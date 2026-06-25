import { supabase } from "./client";

export type RepoStats = {
  repo_id: number;
  /** Stable GitHub repo id (use this for history lookups across runs). */
  github_id: number;
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
  // Phase 1: derived from the repositories_archive time-series.
  /** Star growth in the period immediately before the selected one. */
  prev_stars_growth: number;
  /** Recent growth minus previous growth (positive = star-rate speeding up). */
  acceleration: number;
  /** Number of distinct collector runs this repo has appeared in (durability). */
  times_seen: number;
  /** When this repo was first discovered by the collector. */
  first_seen_at: string | null;
  /** Repo's own last push/update time on GitHub. */
  updated_at: string | null;
  // Phase 4: curation flags (global, no auth).
  is_saved: boolean;
  is_hidden: boolean;
};

/** View filter for the curated list. */
export type FlagFilter = "default" | "saved" | "hidden" | "all";

export type RepoFlag = "saved" | "hidden";

export type RepoHistoryPoint = {
  captured_at: string;
  stars: number;
  forks: number;
};

export type RepoStatsParams = {
  periodDays?: number;
  language?: string | null;
  page?: number;
  pageSize?: number;
  minScore?: number;
  sortBy?: string;
  search?: string | null;
  flagFilter?: FlagFilter;
  minStars?: number;
  maxStars?: number | null;
};

export async function getRepoStats({
  periodDays = 30,
  language = null,
  page = 1,
  pageSize = 50,
  minScore = 0,
  sortBy = "score",
  search = null,
  flagFilter = "default",
  minStars = 0,
  maxStars = null,
}: RepoStatsParams = {}) {
  const trimmed = search?.trim() ?? "";
  const { data, error } = await supabase.rpc("get_repo_stats", {
    p_period_days: periodDays,
    p_language: language === "All" ? null : language,
    p_page: page,
    p_page_size: pageSize,
    p_min_score: minScore,
    p_sort_by: sortBy,
    p_search: trimmed === "" ? null : trimmed,
    p_flag_filter: flagFilter,
    p_min_stars: minStars,
    p_max_stars: maxStars,
  });

  if (error) {
    console.error("Error fetching repo stats:", error);
    throw error;
  }

  return data as RepoStats[];
}

/** Add or remove a curation flag (saved/hidden) for a repo. Global, no auth. */
export async function setRepoFlag(
  githubId: number,
  flag: RepoFlag,
  on: boolean,
): Promise<void> {
  if (on) {
    const { error } = await supabase
      .from("repo_flags")
      .upsert({ github_id: githubId, flag }, { onConflict: "github_id,flag" });
    if (error) {
      console.error("Error setting repo flag:", error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("repo_flags")
      .delete()
      .eq("github_id", githubId)
      .eq("flag", flag);
    if (error) {
      console.error("Error clearing repo flag:", error);
      throw error;
    }
  }
}

export async function getRepoHistory(
  githubId: number,
): Promise<RepoHistoryPoint[]> {
  const { data, error } = await supabase.rpc("get_repo_history", {
    p_github_id: githubId,
  });

  if (error) {
    console.error("Error fetching repo history:", error);
    return [];
  }

  return (data ?? []) as RepoHistoryPoint[];
}

export async function getDistinctLanguages() {
  const { data, error } = await supabase.rpc("get_distinct_languages");

  if (error) {
    console.error("Error fetching languages:", error);
    return [];
  }

  return data.map((d: { language: string }) => d.language) as string[];
}

export async function getLastRunAt(): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_last_run_at");

  if (error) {
    console.error("Error fetching last run:", error);
    return null;
  }

  return data as string | null;
}
