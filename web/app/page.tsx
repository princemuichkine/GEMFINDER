"use client";

import { useEffect, useState } from "react";
import GemNavbar from "../components/design/GemNavbar";
import GemTable from "../components/design/GemTable";
import { getRepoStats, getDistinctLanguages, RepoStats } from "@/lib/supabase/queries";
import { Button, ButtonGroup, HTMLSelect } from "@blueprintjs/core";

export default function Home() {
  const [repos, setRepos] = useState<RepoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  // Filters
  const [language, setLanguage] = useState<string>("All");
  const [period, setPeriod] = useState<number>(30); // Days
  const [page, setPage] = useState<number>(1);
  const pageSize = 100;

  useEffect(() => {
    // Load available languages on mount
    getDistinctLanguages().then(setAvailableLanguages);
  }, []);

  useEffect(() => {
    // Fetch data when filters change
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getRepoStats(period, language, page, pageSize);
        setRepos(data);
      } catch (error) {
        console.error("Failed to load gems", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, period, page]);

  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <GemNavbar />

      <div className="container mx-auto px-4 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Gem Hunter
            </h1>
            <p className="text-gray-500 text-sm">
              Discovering the fastest growing repositories.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">

            {/* Language Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Language</label>
              <HTMLSelect
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPage(1); // Reset to first page
                }}
                className="min-w-[150px]"
              >
                <option value="All">All Languages</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </HTMLSelect>
            </div>

            {/* Growth Period Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Growth Period</label>
              <HTMLSelect
                value={period}
                onChange={(e) => {
                  setPeriod(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={30}>Last 30 Days (Month)</option>
                <option value={90}>Last 90 Days (Quarter)</option>
                <option value={365}>Last Year</option>
              </HTMLSelect>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Page {page}</label>
              <ButtonGroup>
                <Button icon="chevron-left" disabled={page === 1} onClick={handlePrevPage} />
                <Button icon="chevron-right" disabled={repos.length < pageSize} onClick={handleNextPage} />
              </ButtonGroup>
            </div>
          </div>
        </div>

        <GemTable repos={repos} loading={loading} />

        {!loading && repos.length > 0 && (
          <div className="text-center text-gray-400 text-sm mt-4">
            Showing {repos.length} repositories
          </div>
        )}
      </div>
    </main>
  );
}
