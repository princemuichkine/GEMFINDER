package models

import "time"

type Repository struct {
	ID            int64
	GithubID      int64
	Owner         string
	Name          string
	Description   string
	Language      string
	Stars         int
	Forks         int
	Issues        int
	Score         float64
	CreatedAt     time.Time
	UpdatedAt     time.Time
	LastScannedAt time.Time
	// Creator quality metrics
	OwnerFollowers  int
	OwnerRepoCount  int
	// Trending indicator
	VelocityBadge   string
}
