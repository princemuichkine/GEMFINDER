package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestHelpDoesNotPrintEnvSecrets(t *testing.T) {
	const token = "github_pat_11LEAKEDTOKEN_abcdefghijklmnopqrstuvwxyz"
	const dsn = "postgres://hunter:s3cret-pass@db.internal:5432/gemhunter"
	t.Setenv("TOKEN", token)
	t.Setenv("DATABASE_URL", dsn)
	t.Setenv("SUPABASE_URL", "https://example.supabase.co")

	cmd := newRootCmd()
	var buf bytes.Buffer
	cmd.SetOut(&buf)
	cmd.SetErr(&buf)
	cmd.SetArgs([]string{"--help"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("help: %v", err)
	}
	out := buf.String()
	for _, secret := range []string{token, dsn, "s3cret-pass", "hunter:"} {
		if strings.Contains(out, secret) {
			t.Fatalf("help leaked %q", secret)
		}
	}
	if !strings.Contains(out, "--token") || !strings.Contains(out, "--db") {
		t.Fatalf("help missing flags:\n%s", out)
	}
	if !strings.Contains(out, "fetch") || !strings.Contains(out, "cleanup") {
		t.Fatalf("help missing collector commands:\n%s", out)
	}
}
