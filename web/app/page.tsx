"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import GemTable from "../components/design/GemTable";
import { getRepoStats, getDistinctLanguages, RepoStats } from "@/lib/supabase/queries";
import { Button, ButtonGroup, HTMLSelect, Intent, OverlayToaster, Position, Classes } from "@blueprintjs/core";
import { runCollector } from "@/lib/utils/actions";

export default function Home() {
  const [repos, setRepos] = useState<RepoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  // Filters
  const [language, setLanguage] = useState<string>("All");
  const [period, setPeriod] = useState<number>(30); // Days
  const [minScore, setMinScore] = useState<number>(0); // Minimum score filter
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);

  // Server Action Transition
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Load available languages on mount
    getDistinctLanguages().then(setAvailableLanguages);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRepoStats(period, language, page, pageSize, minScore);
      setRepos(data);
    } catch (error) {
      console.error("Failed to load gems", error);
    } finally {
      setLoading(false);
    }
  }, [period, language, page, pageSize, minScore]);

  useEffect(() => {
    // Fetch data when filters change
    fetchData();
  }, [fetchData]);

  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

  const handleRunEngine = () => {
    startTransition(async () => {
      const AppToaster = await OverlayToaster.create({ position: Position.TOP });
      AppToaster.show({ message: "Starting Collector Engine...", intent: Intent.PRIMARY });

      const result = await runCollector();

      if (result.success) {
        AppToaster.show({ message: "Collector finished successfully!", intent: Intent.SUCCESS });
        // Refresh data
        fetchData();
        // Also refresh languages
        getDistinctLanguages().then(setAvailableLanguages);
      } else {
        AppToaster.show({ message: `Collector failed: ${result.message}`, intent: Intent.DANGER });
      }
    });
  };

  return (
    <div className={`${Classes.DARK} min-h-screen flex flex-col`}>
      <div className="flex-1">
        <div className="container mx-auto px-6 md:px-10 lg:px-14 pb-10 max-w-[1400px]" style={{ paddingTop: '3rem' }}>
          {/* Filters Section */}
          <div className="mb-6" style={{ padding: '1.5rem' }}>
            <div className="flex flex-row items-center justify-between">
              {/* Filters Group */}
              <div className="flex items-center">
                {/* Language Filter */}
                <div style={{ width: '180px', marginRight: '1rem' }}>
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
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </HTMLSelect>
                </div>

                {/* Growth Period Filter */}
                <div style={{ width: '180px', marginRight: '1rem' }}>
                  <HTMLSelect
                    value={period}
                    onChange={(e) => {
                      setPeriod(Number(e.target.value));
                      setPage(1);
                    }}
                    fill
                    large
                  >
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                    <option value={365}>Last Year</option>
                  </HTMLSelect>
                </div>

                {/* Page Size Filter */}
                <div style={{ width: '180px', marginRight: '1rem' }}>
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
                <div style={{ width: '180px' }}>
                  <HTMLSelect
                    value={minScore}
                    onChange={(e) => {
                      setMinScore(Number(e.target.value));
                      setPage(1);
                    }}
                    fill
                    large
                  >
                    <option value={0}>All Scores</option>
                    <option value={20}>Score 20+</option>
                    <option value={40}>Score 40+</option>
                    <option value={60}>Score 60+</option>
                  </HTMLSelect>
                </div>
              </div>

              {/* Run Engine Button */}
              <div className="flex-shrink-0">
                <Button
                  intent={Intent.SUCCESS}
                  icon="play"
                  text="Run"
                  loading={isPending}
                  onClick={handleRunEngine}
                  large
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <GemTable repos={repos} loading={loading} />

          {/* Pagination Footer */}
          {!loading && repos.length > 0 && (
            <div className="flex justify-center" style={{ marginTop: '2rem', marginBottom: '2rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
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
                  intent={repos.length < pageSize ? Intent.NONE : Intent.PRIMARY}
                />
              </ButtonGroup>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
