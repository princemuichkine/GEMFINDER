"use client";

import { useEffect, useState, useCallback } from "react";
import GemTable from "@/components/design/GemTable";
import {
  getRepoStats,
  getDistinctLanguages,
  RepoStats,
} from "@/lib/supabase/queries";
import {
  Button,
  ButtonGroup,
  HTMLSelect,
  InputGroup,
  Intent,
  Classes,
} from "@blueprintjs/core";

export default function GemfindPage() {
  const [repos, setRepos] = useState<RepoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  const [language, setLanguage] = useState<string>("All");
  const [period, setPeriod] = useState<number>(30);
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("score");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    getDistinctLanguages().then(setAvailableLanguages);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRepoStats(
        period,
        language,
        page,
        pageSize,
        minScore,
        sortBy,
        debouncedSearch || null,
      );
      setRepos(data);
    } catch (error) {
      console.error("Failed to load gems", error);
    } finally {
      setLoading(false);
    }
  }, [period, language, page, pageSize, minScore, sortBy, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNextPage = () => setPage((p) => p + 1);
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));

  return (
    <div className="flex-1">
      <div
        className="container mx-auto max-w-[1400px] px-6 pb-10 md:px-10 lg:px-14"
        style={{ paddingTop: "3rem" }}
      >
        <div className="mb-2">
          <h1 className={Classes.HEADING} style={{ fontSize: "1.5rem" }}>
            Gemfind
          </h1>
          <p className={`${Classes.TEXT_MUTED} mt-1`}>
            Curated repositories from your collector (Supabase).
          </p>
        </div>

        <div className="mb-6" style={{ padding: "1.5rem" }}>
          <div className="mb-4 max-w-xl">
            <InputGroup
              large
              leftIcon="search"
              placeholder="Search owner, repo name, or description…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              rightElement={
                searchInput ? (
                  <Button
                    minimal
                    icon="cross"
                    aria-label="Clear search"
                    onClick={() => setSearchInput("")}
                  />
                ) : undefined
              }
            />
          </div>
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-wrap items-center gap-y-3">
              <div style={{ width: "180px", marginRight: "1rem" }}>
                <HTMLSelect
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setPage(1);
                  }}
                  fill
                  large
                >
                  <option value="All">All languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </HTMLSelect>
              </div>

              <div style={{ width: "180px", marginRight: "1rem" }}>
                <HTMLSelect
                  value={period}
                  onChange={(e) => {
                    setPeriod(Number(e.target.value));
                    setPage(1);
                  }}
                  fill
                  large
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                  <option value={180}>Last 6 Months</option>
                  <option value={365}>Last Year</option>
                </HTMLSelect>
              </div>

              <div style={{ width: "180px", marginRight: "1rem" }}>
                <HTMLSelect
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
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

              <div style={{ width: "180px", marginRight: "1rem" }}>
                <HTMLSelect
                  value={minScore}
                  onChange={(e) => {
                    setMinScore(Number(e.target.value));
                    setPage(1);
                  }}
                  fill
                  large
                >
                  <option value={0}>All scores</option>
                  <option value={25}>Score 25+</option>
                  <option value={50}>Score 50+</option>
                  <option value={75}>Score 75+</option>
                </HTMLSelect>
              </div>

              <div style={{ width: "200px" }}>
                <HTMLSelect
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  fill
                  large
                >
                  <option value="score">Best score</option>
                  <option value="stars">Most stars</option>
                  <option value="growth">Most growth</option>
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                </HTMLSelect>
              </div>
            </div>
          </div>
        </div>

        <GemTable repos={repos} loading={loading} variant="gems" />

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
                onClick={handlePrevPage}
                large
                intent={page === 1 ? Intent.NONE : Intent.PRIMARY}
              />
              <Button
                icon="chevron-right"
                disabled={repos.length < pageSize}
                onClick={handleNextPage}
                large
                intent={
                  repos.length < pageSize ? Intent.NONE : Intent.PRIMARY
                }
              />
            </ButtonGroup>
          </div>
        )}
      </div>
    </div>
  );
}
