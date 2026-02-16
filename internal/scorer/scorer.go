package scorer

import (
	"math"
	"time"

	"github.com/babacar/gemhunter/internal/models"
)

type ScoredRepo struct {
	Repo  models.Repository
	Score float64
	Label string // e.g., "Viral", "Steady", "Hidden Gem"
}

// CalculateScore computes a "Gem Score" based on velocity and freshness
func CalculateScore(r models.Repository) float64 {
	hoursSinceCreation := time.Since(r.CreatedAt).Hours()
	if hoursSinceCreation < 1 {
		hoursSinceCreation = 1
	}

	// 1. Initial Velocity: Stars per hour
	velocity := float64(r.Stars) / hoursSinceCreation

	// 2. Freshness Boost: Boost younger repos
	// Decays logarithmically over time
	freshness := 1.0 + (100.0 / (hoursSinceCreation + 10.0))

	// 3. Engagement Ratio
	// High forks relative to stars suggests utility
	engagement := 1.0
	if r.Stars > 0 {
		forkRatio := float64(r.Forks) / float64(r.Stars)
		engagement = 1.0 + forkRatio
	}

	// 4. Issue Vitality (Active Maintenance or Usage)
	vitality := 1.0
	if r.Issues > 0 {
		vitality = 1.1
	}

	// 5. Sleeper Gem Bonus
	// If it has decent stars (e.g. > 100) and high forks, but maybe low recent velocity, it's a classic "useful tool"
	sleeperBonus := 1.0
	if r.Stars > 100 && r.Forks > 20 {
		sleeperBonus = 1.5
	}

	// Total Score
	score := velocity * freshness * engagement * vitality * sleeperBonus
	
	// Dampen massive repos (we want gems, not established giants)
	if r.Stars > 5000 {
		score = score * 0.2
	}
	
	return math.Round(score*100) / 100
}
