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

// Breakdown holds the transparent, normalized (0..1) sub-scores that make up the
// final Gem Score, so the result can be explained, logged, and tuned.
type Breakdown struct {
	Momentum    float64 // recent star accumulation rate (saturating)
	Traction    float64 // absolute adoption (log-scaled, capped)
	Engagement  float64 // fork-to-star ratio (utility signal)
	Freshness   float64 // how recently the repo was created
	Maintenance float64 // how recently the repo was pushed/updated
	Creator     float64 // owner reputation (followers + public repos)
	Total       float64 // final 0..100 score
}

// Tunable weights. They sum to 1.0 so Total maps cleanly onto 0..100.
// Momentum and adoption dominate, but a stale/abandoned repo is penalized via
// the maintenance factor, and freshness is intentionally gentle (it no longer
// lets a brand-new repo with a handful of stars dominate the board).
var weights = struct {
	Momentum    float64
	Traction    float64
	Engagement  float64
	Freshness   float64
	Maintenance float64
	Creator     float64
}{
	Momentum:    0.30,
	Traction:    0.15,
	Engagement:  0.10,
	Freshness:   0.15,
	Maintenance: 0.15,
	Creator:     0.15,
}

// saturating maps a non-negative value to 0..1 via x/(x+k); k is the half-saturation
// point (where the output is 0.5). It can never explode past 1.
func saturating(x, k float64) float64 {
	if x <= 0 {
		return 0
	}
	return x / (x + k)
}

func clamp01(x float64) float64 {
	if x < 0 {
		return 0
	}
	if x > 1 {
		return 1
	}
	return x
}

// CalculateBreakdown computes each normalized factor and the final 0..100 score.
func CalculateBreakdown(r models.Repository) Breakdown {
	now := time.Now()

	daysSinceCreation := now.Sub(r.CreatedAt).Hours() / 24.0
	if daysSinceCreation < 0.5 {
		daysSinceCreation = 0.5
	}

	// 1. Momentum: average stars/day since creation, saturating at k=3 (3 stars/day -> 0.5).
	starsPerDay := float64(r.Stars) / daysSinceCreation
	momentum := saturating(starsPerDay, 3.0)

	// 2. Traction: absolute adoption on a log scale, capped so giants don't run away.
	//    ~5000 stars -> ~1.0.
	traction := clamp01(math.Log10(float64(r.Stars)+1) / math.Log10(5000))

	// 3. Engagement: fork ratio is a strong "people actually use/build on this" signal.
	//    A healthy ratio (~0.2) maps near the top.
	engagement := 0.0
	if r.Stars > 0 {
		engagement = clamp01((float64(r.Forks) / float64(r.Stars)) / 0.2)
	}

	// 4. Freshness: gentle exponential decay over ~120 days. Today -> 1, 120d -> ~0.37.
	freshness := math.Exp(-daysSinceCreation / 120.0)

	// 5. Maintenance: penalize abandoned repos. Decay over ~45 days since last push.
	maintenance := 1.0
	if !r.UpdatedAt.IsZero() {
		daysSinceUpdate := now.Sub(r.UpdatedAt).Hours() / 24.0
		if daysSinceUpdate < 0 {
			daysSinceUpdate = 0
		}
		maintenance = math.Exp(-daysSinceUpdate / 45.0)
	}

	// 6. Creator quality: reputable authors are a (capped) positive signal.
	creator := clamp01(float64(r.OwnerFollowers)/5000.0 + float64(r.OwnerRepoCount)/50.0)

	total := 100.0 * (weights.Momentum*momentum +
		weights.Traction*traction +
		weights.Engagement*engagement +
		weights.Freshness*freshness +
		weights.Maintenance*maintenance +
		weights.Creator*creator)

	// Soft damping for entrenched giants — we're hunting gems, not megaprojects.
	if r.Stars > 25000 {
		total *= 0.7
	}

	if total > 100 {
		total = 100
	}

	return Breakdown{
		Momentum:    momentum,
		Traction:    traction,
		Engagement:  engagement,
		Freshness:   freshness,
		Maintenance: maintenance,
		Creator:     creator,
		Total:       math.Round(total*100) / 100,
	}
}

// CalculateScore computes the transparent, weighted "Gem Score" (0..100).
func CalculateScore(r models.Repository) float64 {
	return CalculateBreakdown(r).Total
}

// CalculateVelocityBadge determines a trending label from recent accumulation rate.
func CalculateVelocityBadge(r models.Repository) string {
	daysSinceCreation := time.Since(r.CreatedAt).Hours() / 24.0
	if daysSinceCreation < 0.5 {
		daysSinceCreation = 0.5
	}
	starsPerDay := float64(r.Stars) / daysSinceCreation

	// Hot: strong accumulation on a young repo (first ~3 weeks).
	if daysSinceCreation <= 21 && starsPerDay > 20 {
		return "🔥 Hot"
	}

	// Rising: healthy ongoing accumulation.
	if starsPerDay > 3 {
		return "📈 Rising"
	}

	// Hidden: high quality score but still low star count (quality over popularity).
	if CalculateScore(r) > 45 && r.Stars < 500 {
		return "💎 Hidden"
	}

	return ""
}
