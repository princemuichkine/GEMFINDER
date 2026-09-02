package main

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"testing"
	"time"

	"github.com/babacar/gemhunter/internal/mcp"
	mcpsdk "github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestStdioListsFiveTools(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	t.Cleanup(cancel)

	exe := filepath.Join(t.TempDir(), "gemfinder-mcp")
	build := exec.CommandContext(ctx, "go", "build", "-o", exe, ".")
	if out, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, out)
	}

	cmd := exec.CommandContext(ctx, exe)
	cmd.Env = []string{"PATH=" + os.Getenv("PATH")}
	client := mcpsdk.NewClient(&mcpsdk.Implementation{Name: "test", Version: "v0.0.1"}, nil)
	session, err := client.Connect(ctx, &mcpsdk.CommandTransport{Command: cmd}, nil)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(func() { _ = session.Close() })

	listed, err := session.ListTools(ctx, nil)
	if err != nil {
		t.Fatalf("ListTools: %v", err)
	}
	got := make([]string, 0, len(listed.Tools))
	for _, tool := range listed.Tools {
		got = append(got, tool.Name)
		if tool.Name == "fetch" || tool.Name == "cleanup" || tool.Name == "runCollector" {
			t.Fatalf("destructive tool %q must not be registered", tool.Name)
		}
	}
	slices.Sort(got)
	want := mcp.ToolNames()
	slices.Sort(want)
	if !slices.Equal(got, want) {
		t.Fatalf("listed tools = %v, want %v", got, want)
	}
}
