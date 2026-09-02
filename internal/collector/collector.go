package collector

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/babacar/gemhunter/internal/githubapi"
	"github.com/babacar/gemhunter/internal/scorer"
	"github.com/babacar/gemhunter/internal/storage"
	"github.com/google/go-github/v69/github"
)

type Collector struct {
	client *github.Client
	store  *storage.Store
}

func NewCollector(token string, store *storage.Store) *Collector {
	return &Collector{
		client: githubapi.NewClient(token),
		store:  store,
	}
}

// FetchRecentRepos searches for repositories created in the last n days
func (c *Collector) FetchRecentRepos(days int, minStars int, maxStars int, language string, page int, blacklist []string) error {
	ctx := context.Background()
	date := time.Now().AddDate(0, 0, -days).Format("2006-01-02")

	query := fmt.Sprintf("created:>%s stars:%d..%d", date, minStars, maxStars)
	if language != "" {
		query += fmt.Sprintf(" language:%s", language)
	}

	result, err := githubapi.SearchRepositories(ctx, c.client, githubapi.SearchParams{
		Query:   query,
		Page:    page,
		PerPage: 100,
		Sort:    "stars",
		Order:   "desc",
	})
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	total := 0
	if result.Total != nil {
		total = *result.Total
	}
	log.Printf("Found %d repositories (Total: %d)", len(result.Repositories), total)

	for _, repo := range result.Repositories {
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

		ownerLogin := repo.GetOwner().GetLogin()
		var ownerDetails *github.User
		if ownerLogin != "" {
			ownerDetails, _, err = c.client.Users.Get(ctx, ownerLogin)
			if err != nil {
				log.Printf("Failed to fetch owner %s details: %v", ownerLogin, err)
			}
		}

		r := githubapi.MapRepo(repo, ownerDetails)
		r.LastScannedAt = time.Now()
		r.Score = scorer.CalculateScore(r)
		r.VelocityBadge = scorer.CalculateVelocityBadge(r)

		if err := c.store.SaveRepo(&r); err != nil {
			log.Printf("Failed to save repo %s: %v", r.Name, err)
		}
	}
	return nil
}

func containsIgnoreCase(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 &&
		(strings.Contains(strings.ToLower(s), strings.ToLower(substr)))
}
