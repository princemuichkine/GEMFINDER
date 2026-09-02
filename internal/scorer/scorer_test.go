package scorer

import (
	"testing"
	"time"

	"github.com/babacar/gemhunter/internal/models"
)

func TestCalculateBreakdownRange(t *testing.T) {
	t.Parallel()
	r := models.Repository{
		Stars:          120,
		Forks:          24,
		CreatedAt:      time.Now().Add(-10 * 24 * time.Hour),
		UpdatedAt:      time.Now().Add(-2 * 24 * time.Hour),
		OwnerFollowers: 400,
		OwnerRepoCount: 12,
	}
	b := CalculateBreakdown(r)
	if b.Total < 0 || b.Total > 100 {
		t.Fatalf("total %v out of range", b.Total)
	}
	for _, pair := range []struct {
		name string
		v    float64
	}{
		{"momentum", b.Momentum},
		{"traction", b.Traction},
		{"engagement", b.Engagement},
		{"freshness", b.Freshness},
		{"maintenance", b.Maintenance},
		{"creator", b.Creator},
	} {
		if pair.v < 0 || pair.v > 1 {
			t.Fatalf("%s %v out of 0..1", pair.name, pair.v)
		}
	}
	if CalculateScore(r) != b.Total {
		t.Fatalf("CalculateScore mismatch")
	}
}
