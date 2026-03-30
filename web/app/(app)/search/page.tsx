"use client";

import { useCallback, useEffect, useState } from "react";
import GemTable from "@/components/design/GemTable";
import { githubItemToRepoStats } from "@/lib/github/mapRepoStats";
import type { GitHubSearchRepoItem } from "@/lib/github/search";
import type { RepoStats } from "@/lib/supabase/queries";
import {
  Button,
  ButtonGroup,
  Callout,
  Card,
  HTMLSelect,
  InputGroup,
  Intent,
  Classes,
} from "@blueprintjs/core";

type SearchJson = {
  items?: GitHubSearchRepoItem[];
  total_count?: number;
  incomplete_results?: boolean;
  error?: string;
};

export default function SearchfindPage() {
  const [input, setInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [sort, setSort] = useState<string>("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");

  const [repos, setRepos] = useState<RepoStats[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [incomplete, setIncomplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchToken, setSearchToken] = useState(0);

  const fetchGithub = useCallback(async () => {
    if (!activeQuery) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: activeQuery,
        page: String(page),
        per_page: String(perPage),
      });
      if (sort) {
        params.set("sort", sort);
        params.set("order", order);
      }
      const res = await fetch(`/api/github/search?${params.toString()}`);
      const data = (await res.json()) as SearchJson;
      if (!res.ok) {
        setRepos([]);
        setTotalCount(0);
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      const items = data.items ?? [];
      setRepos(items.map(githubItemToRepoStats));
      setTotalCount(data.total_count ?? 0);
      setIncomplete(Boolean(data.incomplete_results));
    } catch (e) {
      console.error(e);
      setRepos([]);
      setTotalCount(0);
      setError("Network error while contacting the app.");
    } finally {
      setLoading(false);
    }
  }, [activeQuery, page, perPage, sort, order]);

  useEffect(() => {
    void fetchGithub();
  }, [fetchGithub, searchToken]);

  const submitSearch = () => {
    const q = input.trim();
    if (!q) return;
    setActiveQuery(q);
    setPage(1);
    setSearchToken((t) => t + 1);
  };

  const hasNextPage = page * perPage < totalCount;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = Math.min(page * perPage, totalCount);

  return (
    <div className="flex-1">
      <div
        className="container mx-auto max-w-[1400px] px-6 pb-10 md:px-10 lg:px-14"
        style={{ paddingTop: "3rem" }}
      >
        <div className="mb-2">
          <h1 className={Classes.HEADING} style={{ fontSize: "1.5rem" }}>
            Searchfind
          </h1>
          <p className={`${Classes.TEXT_MUTED} mt-1`}>
            Global GitHub repository search (same table as Gemfind; blue tag =
            GitHub relevance, not gem score).{" "}
            <a
              href="https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-white/25 underline-offset-2 hover:decoration-white/50"
              style={{ color: "inherit" }}
            >
              Query syntax
            </a>
            .
          </p>
        </div>

        <div className="mb-6" style={{ padding: "1.5rem" }}>
          <div className="mb-4 flex flex-row flex-wrap items-center gap-y-3">
            <div className="max-w-xl min-w-0 flex-1" style={{ marginRight: "1rem" }}>
              <InputGroup
                large
                leftIcon="search"
                placeholder="e.g. machine learning, language:go stars:>500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                rightElement={
                  input ? (
                    <Button
                      minimal
                      icon="cross"
                      aria-label="Clear query"
                      onClick={() => setInput("")}
                    />
                  ) : undefined
                }
              />
            </div>
            <Button large intent={Intent.PRIMARY} text="Search" onClick={submitSearch} />
          </div>

          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-wrap items-center gap-y-3">
              <div style={{ width: "180px", marginRight: "1rem" }}>
                <HTMLSelect
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  fill
                  large
                >
                  <option value="">Best match</option>
                  <option value="stars">Sort: stars</option>
                  <option value="forks">Sort: forks</option>
                  <option value="updated">Sort: updated</option>
                </HTMLSelect>
              </div>

              {(sort === "stars" || sort === "forks" || sort === "updated") && (
                <div style={{ width: "180px", marginRight: "1rem" }}>
                  <HTMLSelect
                    value={order}
                    onChange={(e) => {
                      setOrder(e.target.value === "asc" ? "asc" : "desc");
                      setPage(1);
                    }}
                    fill
                    large
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </HTMLSelect>
                </div>
              )}

              <div style={{ width: "180px", marginRight: "1rem" }}>
                <HTMLSelect
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  fill
                  large
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </HTMLSelect>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Callout intent={Intent.DANGER} className="mb-6" title="Search error">
            {error}
          </Callout>
        )}

        {incomplete && !error && activeQuery && (
          <Callout
            intent={Intent.WARNING}
            className="mb-6"
            title="Incomplete results"
          >
            GitHub truncated this response; refine your query or paginate.
          </Callout>
        )}

        {!activeQuery && !loading && (
          <Card>
            <div className="p-12 text-center">
              <h3 className={Classes.HEADING}>Run a GitHub search</h3>
              <p className={`${Classes.TEXT_MUTED} mt-2`}>
                Enter a query above, then press Search. Optional:{" "}
                <code className="text-[0.875rem]">TOKEN</code> in{" "}
                <code className="text-[0.875rem]">.env.local</code> for higher
                rate limits.
              </p>
            </div>
          </Card>
        )}

        {activeQuery && (
          <>
            <p className={`${Classes.TEXT_MUTED} mb-3`} style={{ fontSize: "0.875rem" }}>
              {totalCount > 0
                ? `Showing ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${totalCount.toLocaleString()} repositories`
                : loading
                  ? "Searching…"
                  : "No results"}
            </p>
            <GemTable repos={repos} loading={loading} variant="github" />
            {!loading && repos.length > 0 && (
              <div
                className="flex justify-center"
                style={{
                  marginTop: "2rem",
                  marginBottom: "2rem",
                  paddingTop: "1rem",
                  paddingBottom: "1rem",
                }}
              >
                <ButtonGroup>
                  <Button
                    icon="chevron-left"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    large
                    intent={page === 1 ? Intent.NONE : Intent.PRIMARY}
                  />
                  <Button
                    icon="chevron-right"
                    disabled={!hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    large
                    intent={!hasNextPage ? Intent.NONE : Intent.PRIMARY}
                  />
                </ButtonGroup>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
