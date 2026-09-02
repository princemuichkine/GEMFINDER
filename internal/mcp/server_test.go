package mcp

import (
	"context"
	"slices"
	"testing"

	mcpsdk "github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestToolNamesAreReadOnly(t *testing.T) {
	t.Parallel()
	want := []string{"list_gems", "search_github", "score_repo", "get_gem_history", "last_run"}
	got := ToolNames()
	if !slices.Equal(got, want) {
		t.Fatalf("ToolNames() = %v, want %v", got, want)
	}
	for _, name := range got {
		if name == "fetch" || name == "cleanup" || name == "runCollector" {
			t.Fatalf("destructive tool %q must not be registered", name)
		}
	}
}

func TestListToolsOverStdioSession(t *testing.T) {
	ctx := context.Background()
	server := NewServer()
	t1, t2 := mcpsdk.NewInMemoryTransports()

	errCh := make(chan error, 1)
	go func() {
		errCh <- server.Run(ctx, t1)
	}()

	client := mcpsdk.NewClient(&mcpsdk.Implementation{Name: "test", Version: "v0.0.1"}, nil)
	session, err := client.Connect(ctx, t2, nil)
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
	}
	slices.Sort(got)
	want := append([]string{}, ToolNames()...)
	slices.Sort(want)
	if !slices.Equal(got, want) {
		t.Fatalf("listed tools = %v, want %v", got, want)
	}
}

func TestScoreRepoRequiresOwner(t *testing.T) {
	t.Setenv("TOKEN", "")
	_, _, err := scoreRepo(context.Background(), nil, scoreRepoIn{})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestSearchGitHubRequiresToken(t *testing.T) {
	t.Setenv("TOKEN", "")
	_, _, err := searchGitHub(context.Background(), nil, searchGitHubIn{Query: "language:go"})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestSplitRepo(t *testing.T) {
	t.Parallel()
	owner, name := splitRepo("", "", "golang/go")
	if owner != "golang" || name != "go" {
		t.Fatalf("got %s/%s", owner, name)
	}
}
