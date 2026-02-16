package main

import (
	"fmt"
	"log"
	"os"

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

			if err := store.Init(); err != nil {
				log.Fatalf("Failed to init store: %v", err)
			}

			col := collector.NewCollector(githubToken, store)
			log.Printf("Fetching recent repositories (Language: %s)...", language)
			if err := col.FetchRecentRepos(2, 50, language); err != nil { // Last 2 days, >50 stars
				log.Fatalf("Fetch failed: %v", err)
			}
			log.Println("Fetch complete.")
		},
	}
	
	// Add lang flag
	fetchCmd.Flags().String("lang", "", "Filter by programming language (e.g. go, rust, typescript)")
	
	fetchCmd.Flags().String("lang", "", "Filter by programming language (e.g. go, rust, typescript)")

	rootCmd.AddCommand(fetchCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
