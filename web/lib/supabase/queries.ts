import { supabase } from "./client";

export type RepoStats = {
  repo_id: number;
  owner: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  issues: number;
  score: number;
  created_at: string;
  stars_growth: number;
  forks_growth: number;
  owner_followers: number;
  owner_repo_count: number;
  velocity_badge: string;
};

export async function getRepoStats(
  periodDays: number = 30,
  language: string | null = null,
  page: number = 1,
  pageSize: number = 50,
  minScore: number = 0,
  sortBy: string = "score",
) {
  const { data, error } = await supabase.rpc("get_repo_stats", {
    p_period_days: periodDays,
    p_language: language === "All" ? null : language,
    p_page: page,
    p_page_size: pageSize,
    p_min_score: minScore,
    p_sort_by: sortBy,
  });

  if (error) {
    console.error("Error fetching repo stats:", error);
    throw error;
  }

  return data as RepoStats[];
}

export async function getDistinctLanguages() {
  const { data, error } = await supabase.rpc("get_distinct_languages");

  if (error) {
    console.error("Error fetching languages:", error);
    return [];
  }

  return data.map((d: { language: string }) => d.language) as string[];
}
