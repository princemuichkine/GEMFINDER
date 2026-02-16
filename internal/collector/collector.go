package collector

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/babacar/gemhunter/internal/models"
	"github.com/babacar/gemhunter/internal/scorer"
	"github.com/babacar/gemhunter/internal/storage"
	"github.com/google/go-github/v69/github"
	"golang.org/x/oauth2"
)

type Collector struct {
	client *github.Client
	store  *storage.Store
}

func NewCollector(token string, store *storage.Store) *Collector {
	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	return &Collector{
		client: client,
		store:  store,
	}
}

// FetchRecentRepos searches for repositories created in the last n days
func (c *Collector) FetchRecentRepos(days int, minStars int, maxStars int, language string, page int, blacklist []string) error {
	ctx := context.Background()
	date := time.Now().AddDate(0, 0, -days).Format("2006-01-02")
	
	// Construct query: created:>DATE stars:MIN..MAX
	query := fmt.Sprintf("created:>%s stars:%d..%d", date, minStars, maxStars)
	
	if language != "" {
		query += fmt.Sprintf(" language:%s", language)
	}

	opts := &github.SearchOptions{
		Sort:  "stars",
		Order: "desc",
		ListOptions: github.ListOptions{
			Page:    page,
			PerPage: 100,
		},
	}

	result, _, err := c.client.Search.Repositories(ctx, query, opts)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	log.Printf("Found %d repositories (Total: %d)", len(result.Repositories), *result.Total)

	for _, repo := range result.Repositories {
		// Skip likely irrelevant repos based on blacklist (name or description)
		name := repo.GetName()
		desc := repo.GetDescription()
		
		isBlacklisted := false
		for _, term := range blacklist {
			if containsIgnoreCase(name, term) || containsIgnoreCase(desc, term) {
				isBlacklisted = true
				break
			}
		}
		
		if isBlacklisted {
			continue
		}

		r := &models.Repository{
			GithubID:      repo.GetID(),
			Owner:         repo.GetOwner().GetLogin(),
			Name:          repo.GetName(),
			Description:   repo.GetDescription(),
			Language:      repo.GetLanguage(),
			Stars:         repo.GetStargazersCount(),
			Forks:         repo.GetForksCount(),
			Issues:        repo.GetOpenIssuesCount(),
			CreatedAt:     repo.GetCreatedAt().Time,
			UpdatedAt:     repo.GetUpdatedAt().Time,
			LastScannedAt: time.Now(),
		}

		r.Score = scorer.CalculateScore(*r)

		if err := c.store.SaveRepo(r); err != nil {
			log.Printf("Failed to save repo %s: %v", r.Name, err)
		}
	}
	return nil
}

func containsIgnoreCase(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && 
		(strings.Contains(strings.ToLower(s), strings.ToLower(substr)))
}
