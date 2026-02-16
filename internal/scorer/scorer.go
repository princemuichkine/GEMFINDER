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

// CalculateScore computes a "Gem Score" based on velocity, freshness, and creator quality
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

	// 6. Creator Quality Score (NEW)
	// Boost repos from developers with high followers or many repos
	creatorQuality := 1.0
	if r.OwnerFollowers > 0 || r.OwnerRepoCount > 0 {
		followerBonus := float64(r.OwnerFollowers) / 10000.0 // Max ~0.5 for 5k followers
		repoBonus := float64(r.OwnerRepoCount) / 100.0       // Max ~0.5 for 50 repos
		creatorQuality = 1.0 + math.Min(followerBonus+repoBonus, 1.0) // Cap at 2.0x
	}

	// Total Score
	score := velocity * freshness * engagement * vitality * sleeperBonus * creatorQuality
	
	// Dampen massive repos (we want gems, not established giants)
	if r.Stars > 15000 {
		score = score * 0.2
	}
	
	return math.Round(score*100) / 100
}

// CalculateVelocityBadge determines trending status
func CalculateVelocityBadge(r models.Repository) string {
	hoursSinceCreation := time.Since(r.CreatedAt).Hours()
	if hoursSinceCreation < 1 {
		hoursSinceCreation = 1
	}
	
	starsPerHour := float64(r.Stars) / hoursSinceCreation
	
	// Hot: High velocity recent repos (> 1 star/hour in first week)
	if hoursSinceCreation <= 168 && starsPerHour > 1.0 {
		return "🔥 Hot"
	}
	
	// Rising: Good velocity (> 0.1 star/hour)
	if starsPerHour > 0.1 {
		return "📈 Rising"
	}
	
	// Hidden: High score but low star count (quality over popularity)
	score := CalculateScore(r)
	if score > 40 && r.Stars < 500 {
		return "💎 Hidden"
	}
	
	return ""
}
