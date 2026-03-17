"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import GemTable from "../components/design/GemTable";
import {
  getRepoStats,
  getDistinctLanguages,
  getLastRunAt,
  RepoStats,
} from "@/lib/supabase/queries";
import {
  Button,
  ButtonGroup,
  HTMLSelect,
  Intent,
  OverlayToaster,
  Position,
  Classes,
  Popover,
  Menu,
  MenuItem,
} from "@blueprintjs/core";
import { runCollector, runCleanup } from "@/lib/utils/actions";

export default function Home() {
  const [repos, setRepos] = useState<RepoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  // Filters
  const [language, setLanguage] = useState<string>("All");
  const [period, setPeriod] = useState<number>(30); // Days
  const [minScore, setMinScore] = useState<number>(0); // Minimum score filter
  const [sortBy, setSortBy] = useState<string>("score"); // Sort option
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);

  // Server Action Transition
  const [isPending, startTransition] = useTransition();
  const [isCleanupPending, startCleanupTransition] = useTransition();

  useEffect(() => {
    getDistinctLanguages().then(setAvailableLanguages);
    getLastRunAt().then(setLastRunAt);
  }, []);

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
      );
      setRepos(data);
    } catch (error) {
      console.error("Failed to load gems", error);
    } finally {
      setLoading(false);
    }
  }, [period, language, page, pageSize, minScore, sortBy]);

  useEffect(() => {
    // Fetch data when filters change
    fetchData();
  }, [fetchData]);

  const handleNextPage = () => setPage((p) => p + 1);
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));

  const formatLastRun = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const handleRunEngine = () => {
    startTransition(async () => {
      const AppToaster = await OverlayToaster.create({
        position: Position.TOP,
      });
      AppToaster.show({
        message: "Running collector... (usually takes ~20 min)",
        intent: Intent.PRIMARY,
      });

      const result = await runCollector();

      if (result.success) {
        AppToaster.show({
          message: "Collector finished successfully!",
          intent: Intent.SUCCESS,
        });
        fetchData();
        getDistinctLanguages().then(setAvailableLanguages);
        getLastRunAt().then(setLastRunAt);
      } else {
        AppToaster.show({
          message: `Collector failed: ${result.message}`,
          intent: Intent.DANGER,
        });
      }
    });
  };

  const handleCleanup = () => {
    startCleanupTransition(async () => {
      const AppToaster = await OverlayToaster.create({
        position: Position.TOP,
      });
      AppToaster.show({
        message: "Cleaning up old repos...",
        intent: Intent.PRIMARY,
      });

      const result = await runCleanup(180);

      if (result.success) {
        AppToaster.show({
          message: "Cleanup finished. Refreshing...",
          intent: Intent.SUCCESS,
        });
        fetchData();
        getDistinctLanguages().then(setAvailableLanguages);
      } else {
        AppToaster.show({
          message: `Cleanup failed: ${result.message}`,
          intent: Intent.DANGER,
        });
      }
    });
  };

  return (
    <div className={`${Classes.DARK} min-h-screen flex flex-col`}>
      <div className="flex-1">
        <div
          className="container mx-auto px-6 md:px-10 lg:px-14 pb-10 max-w-[1400px]"
          style={{ paddingTop: "3rem" }}
        >
          {/* Filters Section */}
          <div className="mb-6" style={{ padding: "1.5rem" }}>
            <div className="flex flex-row items-center justify-between">
              {/* Filters Group */}
              <div className="flex items-center">
                {/* Language Filter */}
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

                {/* Growth Period Filter */}
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

                {/* Page Size Filter */}
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

                {/* Minimum Score Filter */}
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

                {/* Sort By Filter */}
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

              {/* Run Engine Button + Last Run + Cleanup */}
              <div className="flex-shrink-0 flex items-center gap-4">
                <span
                  className={Classes.TEXT_MUTED}
                  style={{ fontSize: "0.875rem" }}
                >
                  Last run: {formatLastRun(lastRunAt)}
                </span>
                <Button
                  intent={Intent.SUCCESS}
                  icon="play"
                  text="Run"
                  loading={isPending}
                  onClick={handleRunEngine}
                  large
                />
                <Popover
                  content={
                    <Menu>
                      <MenuItem
                        icon="trash"
                        text="Clean old repos (180+ days)"
                        onClick={handleCleanup}
                        disabled={isCleanupPending}
                      />
                    </Menu>
                  }
                  placement="bottom-end"
                >
                  <Button
                    icon="clean"
                    text="Cleanup"
                    minimal
                    loading={isCleanupPending}
                    large
                  />
                </Popover>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <GemTable repos={repos} loading={loading} />

          {/* Pagination Footer */}
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
    </div>
  );
}
