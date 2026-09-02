package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/babacar/gemhunter/internal/envload"
	"github.com/babacar/gemhunter/internal/githubapi"
	"github.com/babacar/gemhunter/internal/models"
	"github.com/babacar/gemhunter/internal/scorer"
	"github.com/babacar/gemhunter/internal/secret"
	"github.com/babacar/gemhunter/internal/supabase"
	mcpsdk "github.com/modelcontextprotocol/go-sdk/mcp"
)

const (
	serverName    = "gemfinder"
	serverVersion = "0.1.0"
)

var toolNames = []string{
	"list_gems",
	"search_github",
	"score_repo",
	"get_gem_history",
	"last_run",
}

func NewServer() *mcpsdk.Server {
	s := mcpsdk.NewServer(&mcpsdk.Implementation{Name: serverName, Version: serverVersion}, nil)
	mcpsdk.AddTool(s, &mcpsdk.Tool{
		Name:        "list_gems",
		Description: "Ranked gems from the collector DB (read-only). Filters: lang, min_score, min_stars/max_stars, search, saved/hidden.",
	}, listGems)
	mcpsdk.AddTool(s, &mcpsdk.Tool{
		Name:        "search_github",
		Description: "Live GitHub repository search (TOKEN). Read-only; does not write the collector DB.",
	}, searchGitHub)
	mcpsdk.AddTool(s, &mcpsdk.Tool{
		Name:        "score_repo",
		Description: "Existing 0-100 gem scorer plus factor breakdown for one repo. No DB, no LLM.",
	}, scoreRepo)
	mcpsdk.AddTool(s, &mcpsdk.Tool{
		Name:        "get_gem_history",
		Description: "Star/fork time series for a github_id from collector archives (read-only).",
	}, getGemHistory)
	mcpsdk.AddTool(s, &mcpsdk.Tool{
		Name:        "last_run",
		Description: "When the collector last wrote (max last_scanned_at).",
	}, lastRun)
	return s
}

func ToolNames() []string {
	out := make([]string, len(toolNames))
	copy(out, toolNames)
	return out
}

func RunStdio(ctx context.Context) error {
	return NewServer().Run(ctx, &mcpsdk.StdioTransport{})
}

type listGemsIn struct {
	Lang       string  `json:"lang,omitempty" jsonschema:"Programming language (omit or All for any)"`
	MinScore   float64 `json:"min_score,omitempty" jsonschema:"Minimum gem score 0-100"`
	MinStars   int     `json:"min_stars,omitempty" jsonschema:"Minimum stars"`
	MaxStars   int     `json:"max_stars,omitempty" jsonschema:"Maximum stars; omit for no cap"`
	Search     string  `json:"search,omitempty" jsonschema:"Search owner, name, or description"`
	Saved      bool    `json:"saved,omitempty" jsonschema:"Only saved gems"`
	Hidden     bool    `json:"hidden,omitempty" jsonschema:"Only hidden gems"`
	FlagFilter string  `json:"flag_filter,omitempty" jsonschema:"default, saved, hidden, or all (overrides saved/hidden)"`
	SortBy     string  `json:"sort_by,omitempty" jsonschema:"score, stars, growth, acceleration, durability, created_asc, created_desc"`
	Page       int     `json:"page,omitempty" jsonschema:"Page number, default 1"`
	PageSize   int     `json:"page_size,omitempty" jsonschema:"Page size, default 50, max 100"`
	PeriodDays int     `json:"period_days,omitempty" jsonschema:"Growth window in days, default 30"`
}

type searchGitHubIn struct {
	Query   string `json:"query" jsonschema:"GitHub search query (q), same as GET /search/repositories"`
	Page    int    `json:"page,omitempty" jsonschema:"Page number, default 1"`
	PerPage int    `json:"per_page,omitempty" jsonschema:"Results per page, default 30, max 100"`
	Sort    string `json:"sort,omitempty" jsonschema:"stars, forks, updated, or omit for best match"`
	Order   string `json:"order,omitempty" jsonschema:"asc or desc, default desc"`
}

type scoreRepoIn struct {
	Owner string `json:"owner,omitempty" jsonschema:"GitHub owner or org"`
	Name  string `json:"name,omitempty" jsonschema:"Repository name"`
	Repo  string `json:"repo,omitempty" jsonschema:"owner/name if owner and name are omitted"`
}

type gemHistoryIn struct {
	GithubID int64 `json:"github_id" jsonschema:"Stable GitHub repository id"`
}

func listGems(ctx context.Context, _ *mcpsdk.CallToolRequest, in listGemsIn) (*mcpsdk.CallToolResult, any, error) {
	client, err := supabaseClient()
	if err != nil {
		return toolErr(err)
	}
	var maxStars *int
	if in.MaxStars > 0 {
		maxStars = &in.MaxStars
	}
	gems, err := client.GetRepoStats(ctx, supabase.RepoStatsParams{
		PeriodDays: in.PeriodDays,
		Language:   in.Lang,
		Page:       in.Page,
		PageSize:   in.PageSize,
		MinScore:   in.MinScore,
		SortBy:     in.SortBy,
		Search:     in.Search,
		FlagFilter: flagFilter(in),
		MinStars:   in.MinStars,
		MaxStars:   maxStars,
	})
	if err != nil {
		return toolErr(err)
	}
	return toolJSON(map[string]any{"gems": gems, "count": len(gems)})
}

func searchGitHub(ctx context.Context, _ *mcpsdk.CallToolRequest, in searchGitHubIn) (*mcpsdk.CallToolResult, any, error) {
	token := envload.Token()
	if token == "" {
		return toolErr(fmt.Errorf("TOKEN is not set"))
	}
	result, err := githubapi.SearchRepositories(ctx, githubapi.NewClient(token), githubapi.SearchParams{
		Query:   in.Query,
		Page:    in.Page,
		PerPage: in.PerPage,
		Sort:    in.Sort,
		Order:   in.Order,
	})
	if err != nil {
		return toolErr(err)
	}
	items := make([]map[string]any, 0, len(result.Repositories))
	for _, repo := range result.Repositories {
		items = append(items, map[string]any{
			"github_id":   repo.GetID(),
			"owner":       repo.GetOwner().GetLogin(),
			"name":        repo.GetName(),
			"full_name":   repo.GetFullName(),
			"description": repo.GetDescription(),
			"language":    repo.GetLanguage(),
			"stars":       repo.GetStargazersCount(),
			"forks":       repo.GetForksCount(),
			"issues":      repo.GetOpenIssuesCount(),
			"html_url":    repo.GetHTMLURL(),
			"created_at":  repo.GetCreatedAt().Time,
			"updated_at":  repo.GetUpdatedAt().Time,
		})
	}
	total := 0
	if result.Total != nil {
		total = *result.Total
	}
	return toolJSON(map[string]any{
		"items":              items,
		"total_count":        total,
		"incomplete_results": result.IncompleteResults != nil && *result.IncompleteResults,
	})
}

func scoreRepo(ctx context.Context, _ *mcpsdk.CallToolRequest, in scoreRepoIn) (*mcpsdk.CallToolResult, any, error) {
	owner, name := splitRepo(in.Owner, in.Name, in.Repo)
	if owner == "" || name == "" {
		return toolErr(fmt.Errorf("owner and name are required (or repo as owner/name)"))
	}
	token := envload.Token()
	if token == "" {
		return toolErr(fmt.Errorf("TOKEN is not set"))
	}
	repo, err := githubapi.LoadRepository(ctx, githubapi.NewClient(token), owner, name)
	if err != nil {
		return toolErr(err)
	}
	breakdown := scorer.CalculateBreakdown(repo)
	return toolJSON(map[string]any{
		"repo":           publicRepo(repo),
		"score":          breakdown.Total,
		"breakdown":      breakdown,
		"velocity_badge": scorer.CalculateVelocityBadge(repo),
	})
}

func getGemHistory(ctx context.Context, _ *mcpsdk.CallToolRequest, in gemHistoryIn) (*mcpsdk.CallToolResult, any, error) {
	client, err := supabaseClient()
	if err != nil {
		return toolErr(err)
	}
	points, err := client.GetRepoHistory(ctx, in.GithubID)
	if err != nil {
		return toolErr(err)
	}
	return toolJSON(map[string]any{"github_id": in.GithubID, "points": points})
}

func lastRun(ctx context.Context, _ *mcpsdk.CallToolRequest, _ struct{}) (*mcpsdk.CallToolResult, any, error) {
	client, err := supabaseClient()
	if err != nil {
		return toolErr(err)
	}
	ts, err := client.GetLastRunAt(ctx)
	if err != nil {
		return toolErr(err)
	}
	out := map[string]any{"last_run_at": nil}
	if ts != nil {
		out["last_run_at"] = ts.Format(time.RFC3339)
	}
	return toolJSON(out)
}

func supabaseClient() (*supabase.Client, error) {
	return supabase.NewClient(envload.SupabaseURL(), envload.SupabaseKey())
}

func flagFilter(in listGemsIn) string {
	if f := strings.ToLower(strings.TrimSpace(in.FlagFilter)); f != "" {
		return f
	}
	switch {
	case in.Saved && in.Hidden:
		return "all"
	case in.Saved:
		return "saved"
	case in.Hidden:
		return "hidden"
	default:
		return "default"
	}
}

func splitRepo(owner, name, repo string) (string, string) {
	owner = strings.TrimSpace(owner)
	name = strings.TrimSpace(name)
	repo = strings.Trim(strings.TrimSpace(repo), "/")
	if (owner == "" || name == "") && repo != "" {
		if i := strings.Index(repo, "/"); i > 0 && i < len(repo)-1 {
			if owner == "" {
				owner = repo[:i]
			}
			if name == "" {
				name = repo[i+1:]
			}
		}
	}
	return owner, name
}

func publicRepo(r models.Repository) map[string]any {
	return map[string]any{
		"github_id":        r.GithubID,
		"owner":            r.Owner,
		"name":             r.Name,
		"description":      r.Description,
		"language":         r.Language,
		"stars":            r.Stars,
		"forks":            r.Forks,
		"issues":           r.Issues,
		"created_at":       r.CreatedAt,
		"updated_at":       r.UpdatedAt,
		"owner_followers":  r.OwnerFollowers,
		"owner_repo_count": r.OwnerRepoCount,
	}
}

func toolJSON(v any) (*mcpsdk.CallToolResult, any, error) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return toolErr(err)
	}
	return &mcpsdk.CallToolResult{
		Content: []mcpsdk.Content{&mcpsdk.TextContent{Text: string(b)}},
	}, v, nil
}

func toolErr(err error) (*mcpsdk.CallToolResult, any, error) {
	return nil, nil, secret.RedactError(err)
}
