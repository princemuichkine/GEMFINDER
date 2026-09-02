package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/babacar/gemhunter/internal/collector"
	"github.com/babacar/gemhunter/internal/envload"
	"github.com/babacar/gemhunter/internal/secret"
	"github.com/babacar/gemhunter/internal/storage"
	"github.com/spf13/cobra"
)

func main() {
	envload.Load()
	if err := newRootCmd().Execute(); err != nil {
		fmt.Fprintln(os.Stderr, secret.Redact(err.Error()))
		os.Exit(1)
	}
}

func newRootCmd() *cobra.Command {
	var dbURL string
	var githubToken string

	rootCmd := &cobra.Command{
		Use:   "gemhunter",
		Short: "GitHub Gem Hunter - Find promising repositories",
	}

	// Empty defaults so --help never prints TOKEN or DATABASE_URL from the environment.
	rootCmd.PersistentFlags().StringVar(&dbURL, "db", "", "Postgres connection string (DATABASE_URL)")
	rootCmd.PersistentFlags().StringVar(&githubToken, "token", "", "GitHub Personal Access Token (TOKEN)")

	var noArchive bool
	fetchCmd := &cobra.Command{
		Use:   "fetch",
		Short: "Fetch recent trending repositories from GitHub",
		Run: func(cmd *cobra.Command, args []string) {
			language, _ := cmd.Flags().GetString("lang")
			days, _ := cmd.Flags().GetInt("days")

			token := resolveToken(githubToken)
			if token == "" {
				log.Fatal("TOKEN is required (set via flag or env var)")
			}

			store, err := storage.NewStore(resolveDBURL(dbURL))
			if err != nil {
				log.Fatalf("Failed to open store: %s", secret.Redact(err.Error()))
			}
			defer store.Close()

			if err := store.Init(); err != nil {
				log.Printf("Warning: Failed to init store (might be handled by migrations): %s", secret.Redact(err.Error()))
			}

			if !noArchive {
				log.Print("Archiving current repos before fresh fetch...")
				archived, err := store.ArchiveAndClear()
				if err != nil {
					log.Fatalf("Archive failed: %s", secret.Redact(err.Error()))
				}
				log.Printf("  Archived %d repos", archived)
			}

			col := collector.NewCollector(token, store)

			languages := []string{}
			if language != "" {
				languages = append(languages, language)
			} else {
				languages = []string{
					"Go", "Rust", "TypeScript", "JavaScript", "Python",
					"Solidity", "C++", "Java", "C", "Swift", "Kotlin",
				}
			}

			blacklist := []string{
				"claude", "tutorial", "course", "demo", "example", "learning",
				"openclaw", "clawbot", "claw-", "-claw", "clawwork", "zeroclaw", "claw",
				"skill", "skills", "mcp", "model-context",
				"polymarket", "trading-bot", "arbitrage", "telegram-bot",
				"template", "boilerplate", "starter", "awesome-", "learn-",
				"daily-digest", "digest", "age-verifier",
			}

			starRanges := []struct{ min, max int }{
				{10, 200},
				{200, 1000},
				{1000, 5000},
				{5000, 15000},
			}

			for _, lang := range languages {
				for i, starRange := range starRanges {
					log.Printf("Fetching recent repositories (Language: %s, Days: %d, Stars: %d-%d)...",
						lang, days, starRange.min, starRange.max)

					pagesToFetch := 3
					for page := 1; page <= pagesToFetch; page++ {
						log.Printf("  Range %d/%d, Page %d...", i+1, len(starRanges), page)
						if err := col.FetchRecentRepos(days, starRange.min, starRange.max, lang, page, blacklist); err != nil {
							log.Printf("Error fetching for %s (page %d): %s", lang, page, secret.Redact(err.Error()))
							break
						}
						time.Sleep(1 * time.Second)
					}

					time.Sleep(2 * time.Second)
				}

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
	cleanupCmd := &cobra.Command{
		Use:   "cleanup",
		Short: "Remove old repos and prune metrics history",
		Run: func(cmd *cobra.Command, args []string) {
			store, err := storage.NewStore(resolveDBURL(dbURL))
			if err != nil {
				log.Fatalf("Failed to open store: %s", secret.Redact(err.Error()))
			}
			defer store.Close()

			log.Printf("Pruning repos not scanned in %d days...", cleanupDays)
			reposDeleted, err := store.PruneOldRepos(cleanupDays)
			if err != nil {
				log.Fatalf("Prune repos failed: %s", secret.Redact(err.Error()))
			}
			log.Printf("  Deleted %d old repositories", reposDeleted)

			log.Print("Pruning orphaned metrics_history...")
			orphaned, err := store.PruneOrphanedMetricsHistory()
			if err != nil {
				log.Fatalf("Prune orphaned metrics failed: %s", secret.Redact(err.Error()))
			}
			log.Printf("  Deleted %d orphaned metrics rows", orphaned)

			log.Print("Pruning old metrics_history (keeping last 90 days)...")
			oldMetrics, err := store.PruneOldMetricsHistory(90)
			if err != nil {
				log.Fatalf("Prune old metrics failed: %s", secret.Redact(err.Error()))
			}
			log.Printf("  Deleted %d old metrics rows", oldMetrics)

			log.Print("Pruning old archives (older than 180 days)...")
			archivesPruned, err := store.PruneOldArchives(180)
			if err != nil {
				log.Fatalf("Prune archives failed: %s", secret.Redact(err.Error()))
			}
			log.Printf("  Deleted %d old archive rows", archivesPruned)

			log.Println("Cleanup complete.")
		},
	}
	cleanupCmd.Flags().IntVar(&cleanupDays, "days", 180, "Delete repos not scanned in this many days")
	rootCmd.AddCommand(cleanupCmd)

	return rootCmd
}

func resolveToken(flagVal string) string {
	if v := strings.TrimSpace(flagVal); v != "" {
		return v
	}
	return envload.Token()
}

func resolveDBURL(flagVal string) string {
	if v := strings.TrimSpace(flagVal); v != "" {
		return v
	}
	if v := envload.DatabaseURL(); v != "" {
		return v
	}
	log.Fatal("DATABASE_URL is required (set via flag or env var)")
	return ""
}
