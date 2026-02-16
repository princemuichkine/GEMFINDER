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

			if githubToken == "" {
				log.Fatal("GITHUB_TOKEN is required (set via flag or env var)")
			}

			store, err := storage.NewStore(dbURL)
			if err != nil {
				log.Fatalf("Failed to open store: %v", err)
			}
			defer store.Close()

			// We don't strictly need Init() if migrations are run, but keeping it for safety doesn't hurt unless it conflicts.
			// Assuming existing Init() is safe (IF NOT EXISTS).
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

			for _, lang := range languages {
				log.Printf("Fetching recent repositories (Language: %s)...", lang)
				if err := col.FetchRecentRepos(2, 50, lang); err != nil { // Last 2 days, >50 stars
					log.Printf("Error fetching for %s: %v", lang, err)
				}
				// Sleep briefly to avoid hitting rate limits too hard between languages
				time.Sleep(2 * time.Second)
			}
			log.Println("Fetch complete.")
		},
	}
	
	// Add lang flag
	fetchCmd.Flags().String("lang", "", "Filter by programming language (e.g. go, rust, typescript)")

	rootCmd.AddCommand(fetchCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
