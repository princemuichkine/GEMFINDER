package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/babacar/gemhunter/internal/collector"
	"github.com/babacar/gemhunter/internal/storage"
	"github.com/spf13/cobra"
)

func main() {
	var dbURL string
	var githubToken string

	var rootCmd = &cobra.Command{
		Use:   "gemhunter",
		Short: "GitHub Gem Hunter - Find promising repositories",
	}

	// Default to env var if flag not set
	defaultDB := os.Getenv("SUPABASE_URL")
	if defaultDB == "" {
		defaultDB = "postgres://postgres:postgres@localhost:5432/gemhunter"
	}

	rootCmd.PersistentFlags().StringVar(&dbURL, "db", defaultDB, "Postgres connection string (or SUPABASE_URL env)")
	rootCmd.PersistentFlags().StringVar(&githubToken, "token", os.Getenv("GITHUB_TOKEN"), "GitHub Personal Access Token")

	var fetchCmd = &cobra.Command{
		Use:   "fetch",
		Short: "Fetch recent trending repositories from GitHub",
		Run: func(cmd *cobra.Command, args []string) {
			language, _ := cmd.Flags().GetString("lang")
			minStars, _ := cmd.Flags().GetInt("min-stars")
			maxStars, _ := cmd.Flags().GetInt("max-stars")
			days, _ := cmd.Flags().GetInt("days")

			if githubToken == "" {
				log.Fatal("GITHUB_TOKEN is required (set via flag or env var)")
			}

			store, err := storage.NewStore(dbURL)
			if err != nil {
				log.Fatalf("Failed to open store: %v", err)
			}
			defer store.Close()

			if err := store.Init(); err != nil {
				log.Printf("Warning: Failed to init store (might be handled by migrations): %v", err)
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
				"openclaw", "clawbot", "claw-", "-claw", "clawwork",
				
				// Skills & MCP-related
				"skill", "skills", "mcp", "model-context",
				
				// Other common patterns
				"template", "boilerplate", "starter", "awesome-", "learn-",
			}

			for _, lang := range languages {
				log.Printf("Fetching recent repositories (Language: %s, Days: %d, Stars: %d-%d)...", lang, days, minStars, maxStars)
				
				// Fetch multiple pages (e.g., 5 pages = 500 repos)
				for page := 1; page <= 5; page++ {
					log.Printf("  Page %d...", page)
					if err := col.FetchRecentRepos(days, minStars, maxStars, lang, page, blacklist); err != nil {
						log.Printf("Error fetching for %s (page %d): %v", lang, page, err)
						// Verify if we should break or continue (hit rate limit?)
						// For now, continue to next language if serious error
						break 
					}
					time.Sleep(1 * time.Second) // Pause between pages
				}
				
				// Sleep briefly to avoid hitting rate limits too hard between languages
				time.Sleep(2 * time.Second)
			}
			log.Println("Fetch complete.")
		},
	}
	
	fetchCmd.Flags().String("lang", "", "Filter by programming language")
	fetchCmd.Flags().Int("min-stars", 10, "Minimum stars required")
	fetchCmd.Flags().Int("max-stars", 10000, "Maximum stars allowed (to exclude huge repos)")
	fetchCmd.Flags().Int("days", 30, "Look back days for creation date")

	rootCmd.AddCommand(fetchCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
