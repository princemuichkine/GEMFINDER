package githubapi

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/babacar/gemhunter/internal/models"
	"github.com/google/go-github/v69/github"
)

func NewClient(token string) *github.Client {
	token = strings.TrimSpace(token)
	client := github.NewClient(nil)
	if token != "" {
		client = client.WithAuthToken(token)
	}
	return client
}

type SearchParams struct {
	Query   string
	Page    int
	PerPage int
	Sort    string
	Order   string
}

func SearchRepositories(ctx context.Context, client *github.Client, p SearchParams) (*github.RepositoriesSearchResult, error) {
	query := strings.TrimSpace(p.Query)
	if query == "" {
		return nil, fmt.Errorf("query is required")
	}
	if len(query) > 500 {
		return nil, fmt.Errorf("query is too long (max 500 characters)")
	}
	page := p.Page
	if page < 1 {
		page = 1
	}
	perPage := p.PerPage
	if perPage < 1 {
		perPage = 30
	}
	if perPage > 100 {
		perPage = 100
	}
	sort := strings.TrimSpace(p.Sort)
	switch sort {
	case "", "stars", "forks", "updated":
	default:
		return nil, fmt.Errorf("invalid sort (use stars, forks, updated, or omit)")
	}
	order := strings.ToLower(strings.TrimSpace(p.Order))
	if order == "" {
		order = "desc"
	}
	if order != "asc" && order != "desc" {
		return nil, fmt.Errorf("invalid order (use asc or desc)")
	}

	opts := &github.SearchOptions{
		ListOptions: github.ListOptions{Page: page, PerPage: perPage},
	}
	if sort != "" {
		opts.Sort = sort
		opts.Order = order
	}

	result, _, err := client.Search.Repositories(ctx, query, opts)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func LoadRepository(ctx context.Context, client *github.Client, owner, name string) (models.Repository, error) {
	owner = strings.TrimSpace(owner)
	name = strings.TrimSpace(name)
	if owner == "" || name == "" {
		return models.Repository{}, fmt.Errorf("owner and name are required")
	}
	repo, _, err := client.Repositories.Get(ctx, owner, name)
	if err != nil {
		return models.Repository{}, err
	}
	var ownerUser *github.User
	login := repo.GetOwner().GetLogin()
	if login != "" {
		ownerUser, _, _ = client.Users.Get(ctx, login)
	}
	r := MapRepo(repo, ownerUser)
	r.LastScannedAt = time.Now()
	return r, nil
}

func MapRepo(repo *github.Repository, owner *github.User) models.Repository {
	r := models.Repository{
		GithubID:    repo.GetID(),
		Owner:       repo.GetOwner().GetLogin(),
		Name:        repo.GetName(),
		Description: repo.GetDescription(),
		Language:    repo.GetLanguage(),
		Stars:       repo.GetStargazersCount(),
		Forks:       repo.GetForksCount(),
		Issues:      repo.GetOpenIssuesCount(),
		CreatedAt:   repo.GetCreatedAt().Time,
		UpdatedAt:   repo.GetUpdatedAt().Time,
	}
	if owner != nil {
		r.OwnerFollowers = owner.GetFollowers()
		r.OwnerRepoCount = owner.GetPublicRepos()
	}
	return r
}
