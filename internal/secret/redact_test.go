package secret

import (
	"strings"
	"testing"
)

func TestRedact(t *testing.T) {
	t.Parallel()
	cases := []struct {
		in   string
		want string
	}{
		{"ok", "ok"},
		{"dsn postgres://user:pass@localhost:5432/gemhunter ping failed", "dsn [redacted] ping failed"},
		{"token github_pat_11AAAAAAA_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "token [redacted]"},
		{"Authorization: Bearer ghp_abcdefghijklmnopqrstuv", "Authorization: [redacted]"},
		{"key sb_secret_abcDEF123", "key [redacted]"},
	}
	for _, tc := range cases {
		got := Redact(tc.in)
		if got != tc.want {
			t.Fatalf("Redact(%q) = %q, want %q", tc.in, got, tc.want)
		}
		if strings.Contains(got, "postgres://") || strings.Contains(got, "github_pat_") || strings.Contains(got, "sb_secret_") {
			t.Fatalf("redacted output still looks like a secret: %q", got)
		}
	}
}
