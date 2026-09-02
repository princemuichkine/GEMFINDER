package envload

import "testing"

func TestSupabaseURLSkipsPostgresDSN(t *testing.T) {
	t.Setenv("SUPABASE_URL", "postgresql://user:pass@localhost/db")
	t.Setenv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
	if got := SupabaseURL(); got != "https://example.supabase.co" {
		t.Fatalf("got %q", got)
	}
}

func TestSupabaseKeyPrefersSecret(t *testing.T) {
	t.Setenv("SUPABASE_SECRET_KEY", "sb_secret_test")
	t.Setenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test")
	if got := SupabaseKey(); got != "sb_secret_test" {
		t.Fatalf("got %q", got)
	}
}
