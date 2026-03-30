import { NextRequest, NextResponse } from "next/server";
import type { GitHubSearchResponse } from "@/lib/github/search";

const GH_SEARCH = "https://api.github.com/search/repositories";

const ALLOWED_SORT = new Set(["", "stars", "forks", "updated"]);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(sp.get("page") || "1", 10) || 1);
  const perPageRaw = Number.parseInt(sp.get("per_page") || "30", 10) || 30;
  const perPage = Math.min(100, Math.max(1, perPageRaw));
  const sort = sp.get("sort") ?? "";
  const order = sp.get("order") === "asc" ? "asc" : "desc";

  if (!q) {
    return NextResponse.json(
      { error: "Missing query (q).", items: [], total_count: 0 },
      { status: 400 },
    );
  }
  if (q.length > 500) {
    return NextResponse.json(
      { error: "Query is too long (max 500 characters).", items: [], total_count: 0 },
      { status: 400 },
    );
  }
  if (!ALLOWED_SORT.has(sort)) {
    return NextResponse.json(
      { error: "Invalid sort. Use stars, forks, updated, or omit for best match.", items: [], total_count: 0 },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    q,
    page: String(page),
    per_page: String(perPage),
  });
  if (sort) {
    params.set("sort", sort);
    params.set("order", order);
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Gemfinder-SearchFind/1.0 (repository discovery)",
  };
  const token = process.env.TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${GH_SEARCH}?${params.toString()}`, {
      headers,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach GitHub.", items: [], total_count: 0 },
      { status: 502 },
    );
  }

  if (res.status === 403) {
    const body = await res.text();
    return NextResponse.json(
      {
        error:
          "GitHub rate limit or access denied. Add a TOKEN in .env for higher limits.",
        items: [],
        total_count: 0,
        detail: body.slice(0, 200),
      },
      { status: 403 },
    );
  }

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      {
        error: `GitHub API error (${res.status}).`,
        items: [],
        total_count: 0,
        detail: text.slice(0, 200),
      },
      { status: res.status >= 500 ? 502 : res.status },
    );
  }

  const data = (await res.json()) as GitHubSearchResponse;
  return NextResponse.json({
    items: data.items ?? [],
    total_count: data.total_count ?? 0,
    incomplete_results: data.incomplete_results ?? false,
  });
}
