"use client";

import { Classes, Spinner } from "@blueprintjs/core";
import type { RepoHistoryPoint, RepoStats } from "@/lib/supabase/queries";
import { formatRelativeTime } from "@/lib/format/time";
import Sparkline from "./Sparkline";

interface RepoHistoryPanelProps {
  repo: RepoStats;
  history: RepoHistoryPoint[] | null;
  loading: boolean;
}

export default function RepoHistoryPanel({
  repo,
  history,
  loading,
}: RepoHistoryPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Spinner size={20} />
        <span className={Classes.TEXT_MUTED}>Loading star history…</span>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className={`${Classes.TEXT_MUTED} py-2`} style={{ fontSize: "0.875rem" }}>
        No archive history yet — data appears after a few collector runs.
      </p>
    );
  }

  const starValues = history.map((p) => p.stars);
  const forkValues = history.map((p) => p.forks);
  const first = history[0];
  const last = history[history.length - 1];
  const starDelta = last.stars - first.stars;
  const forkDelta = last.forks - first.forks;
  const firstLabel = formatRelativeTime(first.captured_at);
  const lastLabel = formatRelativeTime(last.captured_at);

  return (
    <div className="py-3">
      <div
        className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"
        style={{ fontSize: "0.875rem" }}
      >
        <span className={Classes.HEADING} style={{ fontSize: "0.875rem" }}>
          Star history
        </span>
        <span className={Classes.TEXT_MUTED}>
          {history.length} snapshot{history.length === 1 ? "" : "s"}
          {firstLabel && lastLabel ? ` · ${firstLabel} → ${lastLabel}` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div>
          <div
            className={`${Classes.TEXT_MUTED} mb-1`}
            style={{ fontSize: "0.75rem" }}
          >
            Stars ({first.stars.toLocaleString()} → {last.stars.toLocaleString()}
            {starDelta !== 0 && (
              <span style={{ color: starDelta > 0 ? "#2dd4bf" : "#f87171" }}>
                {" "}
                ({starDelta > 0 ? "+" : ""}
                {starDelta.toLocaleString()})
              </span>
            )}
            )
          </div>
          <Sparkline
            values={starValues}
            width={420}
            height={72}
            strokeWidth={2}
          />
        </div>

        <div>
          <div
            className={`${Classes.TEXT_MUTED} mb-1`}
            style={{ fontSize: "0.75rem" }}
          >
            Forks ({first.forks.toLocaleString()} → {last.forks.toLocaleString()}
            {forkDelta !== 0 && (
              <span style={{ color: forkDelta > 0 ? "#2dd4bf" : "#f87171" }}>
                {" "}
                ({forkDelta > 0 ? "+" : ""}
                {forkDelta.toLocaleString()})
              </span>
            )}
            )
          </div>
          <Sparkline
            values={forkValues}
            width={420}
            height={72}
            strokeWidth={2}
            color="#60a5fa"
          />
        </div>

        <div
          className={`${Classes.TEXT_MUTED} flex flex-col gap-1`}
          style={{ fontSize: "0.75rem", minWidth: "10rem" }}
        >
          <span>Gem score: {repo.score.toFixed(1)}</span>
          {repo.stars_growth > 0 && (
            <span>Period growth: +{repo.stars_growth.toLocaleString()} ★</span>
          )}
          {repo.acceleration !== 0 && (
            <span>
              Acceleration: {repo.acceleration > 0 ? "+" : ""}
              {repo.acceleration.toLocaleString()}
            </span>
          )}
          {repo.times_seen > 0 && (
            <span>Seen in {repo.times_seen} run{repo.times_seen === 1 ? "" : "s"}</span>
          )}
          {repo.first_seen_at && (
            <span>
              First seen: {formatRelativeTime(repo.first_seen_at) ?? "—"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
