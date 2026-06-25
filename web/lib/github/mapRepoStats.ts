import type { RepoStats } from "@/lib/supabase/queries";
import type { GitHubSearchRepoItem } from "./search";

/** Maps GitHub search API rows into the same shape GemTable expects. */
export function githubItemToRepoStats(item: GitHubSearchRepoItem): RepoStats {
  return {
    repo_id: item.id,
    github_id: item.id,
    owner: item.owner.login,
    name: item.name,
    description: item.description ?? "",
    language: item.language ?? "",
    stars: item.stargazers_count,
    forks: item.forks_count,
    issues: item.open_issues_count,
    score: item.score ?? 0,
    created_at: item.created_at,
    stars_growth: 0,
    forks_growth: 0,
    owner_followers: 0,
    owner_repo_count: 0,
    velocity_badge: "",
    // Time-series-derived fields are not available for live GitHub search results.
    prev_stars_growth: 0,
    acceleration: 0,
    times_seen: 0,
    first_seen_at: null,
    updated_at: null,
    is_saved: false,
    is_hidden: false,
  };
}
