package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"strings"

	"github.com/babacar/gemhunter/internal/collector"
	"github.com/babacar/gemhunter/internal/storage"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

func main() {
	// Load .env file if it exists
	_ = godotenv.Load()

	var dbURL string
	var githubToken string

	var rootCmd = &cobra.Command{
		Use:   "gemhunter",
		Short: "GitHub Gem Hunter - Find promising repositories",
	}

	// Default to env var if flag not set
	// Prefer DATABASE_URL, fallback to SUPABASE_URL for backward compatibility
	defaultDB := os.Getenv("DATABASE_URL")
	if defaultDB == "" {
		defaultDB = os.Getenv("SUPABASE_URL")
	}
	if defaultDB == "" {
		defaultDB = "postgres://postgres:postgres@localhost:5432/gemhunter"
	}

	rootCmd.PersistentFlags().StringVar(&dbURL, "db", defaultDB, "Postgres connection string (or DATABASE_URL/SUPABASE_URL env)")
	tokenEnv := os.Getenv("TOKEN")
	rootCmd.PersistentFlags().StringVar(&githubToken, "token", tokenEnv, "GitHub Personal Access Token")

	var noArchive bool
	var fetchCmd = &cobra.Command{
		Use:   "fetch",
		Short: "Fetch recent trending repositories from GitHub",
		Run: func(cmd *cobra.Command, args []string) {
			language, _ := cmd.Flags().GetString("lang")
			days, _ := cmd.Flags().GetInt("days")

			githubToken = strings.TrimSpace(githubToken)

			if githubToken == "" {
				log.Fatal("TOKEN is required (set via flag or env var)")
			}

			store, err := storage.NewStore(strings.TrimSpace(dbURL))
			if err != nil {
				log.Fatalf("Failed to open store: %v", err)
			}
			defer store.Close()

			if err := store.Init(); err != nil {
				log.Printf("Warning: Failed to init store (might be handled by migrations): %v", err)
			}

			// Archive current repos and clear before fetch (fresh list, no leftover)
			if !noArchive {
				log.Print("Archiving current repos before fresh fetch...")
				archived, err := store.ArchiveAndClear()
				if err != nil {
					log.Fatalf("Archive failed: %v", err)
				}
				log.Printf("  Archived %d repos", archived)
			}

			col := collector.NewCollector(githubToken, store)

			languages := []string{}
			if language != "" {
				languages = append(languages, language)
			} else {
				// Default list of languages to scan if none provided
				languages = []string{
					"Go", "Rust", "TypeScript", "JavaScript", "Python", 
					"Solidity", "C++", "Java", "C", "Swift", "Kotlin",
				}
			}

			// Blacklist patterns (lowercase) - filter out boring/tutorial repos
			blacklist := []string{
				// Tutorials & Learning
				"claude", "tutorial", "course", "demo", "example", "learning",
				
				// OpenClaw/ClawBot ecosystem (boring)
				"openclaw", "clawbot", "claw-", "-claw", "clawwork", "zeroclaw", "claw",
				
				// Skills & MCP-related
				"skill", "skills", "mcp", "model-context",

				// Crypto/Trading bots (noise)
				"polymarket", "trading-bot", "arbitrage", "telegram-bot",
				
				// Other common patterns
				"template", "boilerplate", "starter", "awesome-", "learn-",
				"daily-digest", "digest", "age-verifier",
			}

			// Star range diversity - vary ranges to find different types of gems
			starRanges := []struct{ min, max int }{
				{10, 200},      // Small hidden gems
				{200, 1000},    // Rising projects
				{1000, 5000},   // Established quality
				{5000, 15000},  // Popular but not giants
			}

			for _, lang := range languages {
				// Rotate through star ranges for diversity
				for i, starRange := range starRanges {
					log.Printf("Fetching recent repositories (Language: %s, Days: %d, Stars: %d-%d)...", 
						lang, days, starRange.min, starRange.max)
					
					// Fetch multiple pages (10 pages = 1000 repos per range)
					pagesToFetch := 3 // 3 pages per range = more diversity
					for page := 1; page <= pagesToFetch; page++ {
						log.Printf("  Range %d/%d, Page %d...", i+1, len(starRanges), page)
						if err := col.FetchRecentRepos(days, starRange.min, starRange.max, lang, page, blacklist); err != nil {
							log.Printf("Error fetching for %s (page %d): %v", lang, page, err)
							break
						}
						time.Sleep(1 * time.Second) // Pause between pages
					}
					
					// Sleep between ranges
					time.Sleep(2 * time.Second)
				}
				
				// Sleep between languages
				time.Sleep(3 * time.Second)
			}
			log.Println("Fetch complete.")
		},
	}
	
	fetchCmd.Flags().String("lang", "", "Filter by programming language")
	fetchCmd.Flags().Int("min-stars", 10, "Minimum stars required")
	fetchCmd.Flags().Int("max-stars", 10000, "Maximum stars allowed (to exclude huge repos)")
	fetchCmd.Flags().Int("days", 30, "Look back days for creation date")
	fetchCmd.Flags().BoolVar(&noArchive, "no-archive", false, "Skip archive+clear (append to existing repos)")

	rootCmd.AddCommand(fetchCmd)

	var cleanupDays int
	var cleanupCmd = &cobra.Command{
		Use:   "cleanup",
		Short: "Remove old repos and prune metrics history",
		Run: func(cmd *cobra.Command, args []string) {
			store, err := storage.NewStore(strings.TrimSpace(dbURL))
			if err != nil {
				log.Fatalf("Failed to open store: %v", err)
			}
			defer store.Close()

			log.Printf("Pruning repos not scanned in %d days...", cleanupDays)
			reposDeleted, err := store.PruneOldRepos(cleanupDays)
			if err != nil {
				log.Fatalf("Prune repos failed: %v", err)
			}
			log.Printf("  Deleted %d old repositories", reposDeleted)

			log.Print("Pruning orphaned metrics_history...")
			orphaned, err := store.PruneOrphanedMetricsHistory()
			if err != nil {
				log.Fatalf("Prune orphaned metrics failed: %v", err)
			}
			log.Printf("  Deleted %d orphaned metrics rows", orphaned)

			log.Print("Pruning old metrics_history (keeping last 90 days)...")
			oldMetrics, err := store.PruneOldMetricsHistory(90)
			if err != nil {
				log.Fatalf("Prune old metrics failed: %v", err)
			}
			log.Printf("  Deleted %d old metrics rows", oldMetrics)

			log.Print("Pruning old archives (older than 180 days)...")
			archivesPruned, err := store.PruneOldArchives(180)
			if err != nil {
				log.Fatalf("Prune archives failed: %v", err)
			}
			log.Printf("  Deleted %d old archive rows", archivesPruned)

			log.Println("Cleanup complete.")
		},
	}
	cleanupCmd.Flags().IntVar(&cleanupDays, "days", 180, "Delete repos not scanned in this many days")
	rootCmd.AddCommand(cleanupCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
