/** GitHub REST: GET /search/repositories (subset of fields we use). */

export type GitHubSearchRepoItem = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  score?: number;
};

export type GitHubSearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubSearchRepoItem[];
};
