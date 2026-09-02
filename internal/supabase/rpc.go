package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/babacar/gemhunter/internal/secret"
)

type Client struct {
	baseURL    string
	key        string
	httpClient *http.Client
}

func NewClient(baseURL, key string) (*Client, error) {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	key = strings.TrimSpace(key)
	if baseURL == "" || key == "" {
		return nil, fmt.Errorf("SUPABASE_URL and a Supabase key are required")
	}
	if strings.HasPrefix(baseURL, "postgres://") || strings.HasPrefix(baseURL, "postgresql://") {
		return nil, fmt.Errorf("SUPABASE_URL must be the https project URL, not a postgres DSN")
	}
	return &Client{
		baseURL:    baseURL,
		key:        key,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}, nil
}

type RepoStatsParams struct {
	PeriodDays int
	Language   string
	Page       int
	PageSize   int
	MinScore   float64
	SortBy     string
	Search     string
	FlagFilter string
	MinStars   int
	MaxStars   *int
}

type RepoStats struct {
	RepoID          int64      `json:"repo_id"`
	GithubID        int64      `json:"github_id"`
	Owner           string     `json:"owner"`
	Name            string     `json:"name"`
	Description     string     `json:"description"`
	Language        string     `json:"language"`
	Stars           int        `json:"stars"`
	Forks           int        `json:"forks"`
	Issues          int        `json:"issues"`
	Score           float64    `json:"score"`
	CreatedAt       *time.Time `json:"created_at"`
	StarsGrowth     int        `json:"stars_growth"`
	ForksGrowth     int        `json:"forks_growth"`
	OwnerFollowers  int        `json:"owner_followers"`
	OwnerRepoCount  int        `json:"owner_repo_count"`
	VelocityBadge   string     `json:"velocity_badge"`
	PrevStarsGrowth int        `json:"prev_stars_growth"`
	Acceleration    int        `json:"acceleration"`
	TimesSeen       int        `json:"times_seen"`
	FirstSeenAt     *time.Time `json:"first_seen_at"`
	UpdatedAt       *time.Time `json:"updated_at"`
	IsSaved         bool       `json:"is_saved"`
	IsHidden        bool       `json:"is_hidden"`
}

type HistoryPoint struct {
	CapturedAt time.Time `json:"captured_at"`
	Stars      int       `json:"stars"`
	Forks      int       `json:"forks"`
}

func (c *Client) GetRepoStats(ctx context.Context, p RepoStatsParams) ([]RepoStats, error) {
	page := p.Page
	if page < 1 {
		page = 1
	}
	pageSize := p.PageSize
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}
	sortBy := strings.TrimSpace(p.SortBy)
	if sortBy == "" {
		sortBy = "score"
	}
	flag := strings.ToLower(strings.TrimSpace(p.FlagFilter))
	if flag == "" {
		flag = "default"
	}
	lang := strings.TrimSpace(p.Language)
	if strings.EqualFold(lang, "All") {
		lang = ""
	}
	search := strings.TrimSpace(p.Search)

	body := map[string]any{
		"p_period_days": p.PeriodDays,
		"p_page":        page,
		"p_page_size":   pageSize,
		"p_min_score":   p.MinScore,
		"p_sort_by":     sortBy,
		"p_flag_filter": flag,
		"p_min_stars":   p.MinStars,
	}
	if p.PeriodDays <= 0 {
		body["p_period_days"] = 30
	}
	if lang == "" {
		body["p_language"] = nil
	} else {
		body["p_language"] = lang
	}
	if search == "" {
		body["p_search"] = nil
	} else {
		body["p_search"] = search
	}
	if p.MaxStars == nil {
		body["p_max_stars"] = nil
	} else {
		body["p_max_stars"] = *p.MaxStars
	}

	var out []RepoStats
	if err := c.rpc(ctx, "get_repo_stats", body, &out); err != nil {
		return nil, err
	}
	if out == nil {
		out = []RepoStats{}
	}
	return out, nil
}

func (c *Client) GetRepoHistory(ctx context.Context, githubID int64) ([]HistoryPoint, error) {
	if githubID == 0 {
		return nil, fmt.Errorf("github_id is required")
	}
	var out []HistoryPoint
	if err := c.rpc(ctx, "get_repo_history", map[string]any{"p_github_id": githubID}, &out); err != nil {
		return nil, err
	}
	if out == nil {
		out = []HistoryPoint{}
	}
	return out, nil
}

func (c *Client) GetLastRunAt(ctx context.Context) (*time.Time, error) {
	var raw json.RawMessage
	if err := c.rpc(ctx, "get_last_run_at", map[string]any{}, &raw); err != nil {
		return nil, err
	}
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}
	var ts time.Time
	if err := json.Unmarshal(raw, &ts); err != nil {
		return nil, fmt.Errorf("decode last run: %w", err)
	}
	return &ts, nil
}

func (c *Client) rpc(ctx context.Context, name string, payload any, dest any) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/rest/v1/rpc/"+name, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", c.key)
	req.Header.Set("Authorization", "Bearer "+c.key)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return secret.RedactError(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return secret.RedactError(err)
	}
	if res.StatusCode >= 400 {
		return fmt.Errorf("supabase rpc %s failed (%d): %s", name, res.StatusCode, secret.Redact(truncate(string(body), 300)))
	}
	if dest == nil {
		return nil
	}
	if err := json.Unmarshal(body, dest); err != nil {
		return fmt.Errorf("decode %s: %w", name, err)
	}
	return nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
