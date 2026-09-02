package githubapi

import "testing"

func TestSearchParamsValidate(t *testing.T) {
	t.Parallel()
	_, err := SearchRepositories(t.Context(), NewClient(""), SearchParams{})
	if err == nil {
		t.Fatal("empty query should fail before network")
	}
	_, err = SearchRepositories(t.Context(), NewClient(""), SearchParams{Query: "go", Sort: "watchers"})
	if err == nil {
		t.Fatal("invalid sort should fail before network")
	}
}
