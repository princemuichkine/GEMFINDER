package supabase

import "testing"

func TestNewClientRejectsPostgresDSN(t *testing.T) {
	t.Parallel()
	_, err := NewClient("postgresql://user:pass@localhost/db", "key")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestNewClientRequiresKey(t *testing.T) {
	t.Parallel()
	_, err := NewClient("https://example.supabase.co", "")
	if err == nil {
		t.Fatal("expected error")
	}
}
