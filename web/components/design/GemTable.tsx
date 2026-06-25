"use client";

import { useCallback, useState, Fragment } from "react";
import {
  Card,
  HTMLTable,
  Tag,
  Tooltip,
  Intent,
  AnchorButton,
  Button,
  Icon,
  Classes,
  Spinner,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import {
  RepoStats,
  RepoFlag,
  RepoHistoryPoint,
  getRepoHistory,
} from "@/lib/supabase/queries";
import { formatAge } from "@/lib/format/time";
import Sparkline from "./Sparkline";
import RepoHistoryPanel from "./RepoHistoryPanel";

export type GemTableVariant = "gems" | "github";

interface GemTableProps {
  repos: RepoStats[];
  loading?: boolean;
  /** gems: curated DB + gem score. github: global GitHub search (relevance, no growth). */
  variant?: GemTableVariant;
  /** Toggle a curation flag. Only used in the "gems" variant. */
  onToggleFlag?: (githubId: number, flag: RepoFlag, on: boolean) => void;
}

function getLanguageIntent(language: string): Intent {
  const lang = language.toLowerCase();

  if (lang === "javascript" || lang === "js") return Intent.WARNING;
  if (lang === "typescript" || lang === "ts") return Intent.PRIMARY;
  if (lang === "python") return Intent.SUCCESS;
  if (lang === "java") return Intent.DANGER;
  if (lang === "go" || lang === "golang") return Intent.PRIMARY;
  if (lang === "rust") return Intent.DANGER;
  if (lang === "c" || lang === "c++" || lang === "cpp") return Intent.PRIMARY;
  if (lang === "ruby") return Intent.DANGER;
  if (lang === "php") return Intent.PRIMARY;
  if (lang === "swift") return Intent.WARNING;
  if (lang === "kotlin") return Intent.PRIMARY;
  if (lang === "shell" || lang === "bash" || lang === "sh") return Intent.NONE;
  if (lang === "html" || lang === "css") return Intent.WARNING;

  return Intent.NONE;
}

function getScoreIntent(score: number): Intent {
  if (score >= 80) return Intent.SUCCESS;
  if (score >= 50) return Intent.PRIMARY;
  if (score >= 25) return Intent.WARNING;
  return Intent.DANGER;
}

/**
 * Derive a tiny 3-point trend from the growth fields we already have — no extra
 * network calls. Series: [stars two periods ago, stars one period ago, now].
 */
function trendSeries(repo: RepoStats): number[] {
  const now = repo.stars;
  const onePeriodAgo = now - (repo.stars_growth ?? 0);
  const twoPeriodsAgo = onePeriodAgo - (repo.prev_stars_growth ?? 0);
  return [twoPeriodsAgo, onePeriodAgo, now];
}

const cellStyle: React.CSSProperties = {
  padding: "1.25rem 1.5rem",
  verticalAlign: "middle",
};

const headStyle: React.CSSProperties = {
  padding: "1rem 1.5rem",
  fontWeight: 600,
  verticalAlign: "middle",
};

export default function GemTable({
  repos,
  loading,
  variant = "gems",
  onToggleFlag,
}: GemTableProps) {
  const isGems = variant === "gems";
  const colCount = isGems ? 6 : 5;

  const [expandedGithubId, setExpandedGithubId] = useState<number | null>(null);
  const [historyById, setHistoryById] = useState<
    Record<number, RepoHistoryPoint[]>
  >({});
  const [loadingHistoryId, setLoadingHistoryId] = useState<number | null>(null);

  const toggleHistory = useCallback(
    async (githubId: number) => {
      if (expandedGithubId === githubId) {
        setExpandedGithubId(null);
        return;
      }

      setExpandedGithubId(githubId);

      if (historyById[githubId]) return;

      setLoadingHistoryId(githubId);
      try {
        const points = await getRepoHistory(githubId);
        setHistoryById((prev) => ({ ...prev, [githubId]: points }));
      } finally {
        setLoadingHistoryId(null);
      }
    },
    [expandedGithubId, historyById],
  );

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center p-12">
          <Spinner size={50} />
        </div>
      </Card>
    );
  }

  if (repos.length === 0) {
    return (
      <Card>
        <div className="text-center p-12">
          <h3 className={Classes.HEADING}>
            {variant === "github" ? "No repositories found" : "No gems found"}
          </h3>
          <p className={Classes.TEXT_MUTED}>
            {variant === "github"
              ? "Try another query or GitHub search syntax (e.g. language:python, stars:>100)."
              : "Try adjusting your filters or run the collector."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div className="overflow-x-auto">
        <HTMLTable
          striped
          interactive
          style={{ width: "100%", margin: 0 }}
          className="bp5-html-table-compact"
        >
          <thead>
            <tr>
              <th style={headStyle}>Repository</th>
              <th style={headStyle}>Language</th>
              <th style={headStyle}>Stars</th>
              <th style={headStyle}>Forks</th>
              {isGems && <th style={headStyle}>Trend</th>}
              <th style={{ ...headStyle, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => {
              const createdAgo = formatAge(repo.created_at);
              const updatedAgo = isGems ? formatAge(repo.updated_at) : null;
              const accel = repo.acceleration ?? 0;
              const isExpanded = expandedGithubId === repo.github_id;
              const rowKey = `${repo.owner}/${repo.name}`;

              return (
                <Fragment key={rowKey}>
                <tr>
                  <td style={{ padding: "1.25rem 1.5rem", verticalAlign: "top" }}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span
                          className={Classes.HEADING}
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            lineHeight: "1.5",
                          }}
                        >
                          {repo.owner}/{repo.name}
                        </span>
                        <Tooltip
                          content={
                            <div style={{ maxWidth: 280, padding: 4 }}>
                              {variant === "github" ? (
                                <>
                                  <strong>Match</strong> — GitHub&rsquo;s
                                  relevance score for your search query (higher =
                                  closer match).
                                </>
                              ) : (
                                <>
                                  <strong>Gem Score</strong> — Weighted blend of
                                  momentum, traction, engagement, freshness,
                                  maintenance, and creator quality. 80+ = excellent,
                                  50+ = great, 25+ = decent.
                                </>
                              )}
                            </div>
                          }
                          placement="top"
                        >
                          <Tag
                            intent={
                              variant === "github"
                                ? Intent.PRIMARY
                                : getScoreIntent(repo.score)
                            }
                            minimal
                            style={{
                              minHeight: "24px",
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "0.875rem",
                              padding: "4px 6px",
                              cursor: "help",
                            }}
                          >
                            {variant === "github" && repo.score === 0
                              ? "—"
                              : repo.score.toFixed(1)}
                          </Tag>
                        </Tooltip>
                        {isGems && repo.velocity_badge && (
                          <Tag
                            minimal
                            intent={Intent.WARNING}
                            style={{
                              minHeight: "22px",
                              fontSize: "0.8rem",
                              padding: "2px 6px",
                            }}
                          >
                            {repo.velocity_badge}
                          </Tag>
                        )}
                      </div>

                      {repo.description && (
                        <span
                          className={Classes.TEXT_MUTED}
                          style={{
                            fontSize: "0.875rem",
                            lineHeight: "1.4",
                            maxWidth: "36rem",
                          }}
                        >
                          {repo.description}
                        </span>
                      )}

                      {isGems && (
                        <div
                          className={`${Classes.TEXT_MUTED} flex flex-wrap items-center gap-x-3 gap-y-1`}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {createdAgo && <span>created {createdAgo} ago</span>}
                          {updatedAgo && <span>· updated {updatedAgo} ago</span>}
                          {repo.times_seen > 1 && (
                            <Tooltip
                              content="Distinct collector runs this repo has appeared in — a sign of durability vs a one-run fluke."
                              placement="top"
                            >
                              <span style={{ cursor: "help" }}>
                                · seen {repo.times_seen}×
                              </span>
                            </Tooltip>
                          )}
                          {repo.owner_followers > 0 && (
                            <span>
                              · creator {repo.owner_followers.toLocaleString()}{" "}
                              followers
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td style={cellStyle}>
                    {repo.language && (
                      <Tag
                        minimal
                        intent={getLanguageIntent(repo.language)}
                        style={{
                          minHeight: "24px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "0.875rem",
                          padding: "4px 6px",
                        }}
                      >
                        {repo.language}
                      </Tag>
                    )}
                  </td>

                  <td style={cellStyle}>
                    <div className="flex flex-row items-center">
                      <Tag
                        minimal
                        intent={Intent.WARNING}
                        style={{
                          minHeight: "24px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "0.875rem",
                          padding: "4px 4px",
                          maxWidth: "fit-content",
                          marginRight: "0.5rem",
                        }}
                      >
                        {repo.stars.toLocaleString()}
                        <Icon
                          icon={IconNames.STAR}
                          size={10}
                          style={{
                            marginLeft: "3px",
                            flexShrink: 0,
                            transform: "translateY(-2.5px)",
                          }}
                        />
                      </Tag>
                      {isGems && repo.stars_growth > 0 && (
                        <Tag
                          minimal
                          intent={Intent.SUCCESS}
                          style={{
                            minHeight: "24px",
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "0.875rem",
                            padding: "4px 4px",
                            maxWidth: "fit-content",
                          }}
                        >
                          +{repo.stars_growth.toLocaleString()}
                          <Icon
                            icon={IconNames.TRENDING_UP}
                            size={10}
                            style={{
                              marginLeft: "3px",
                              flexShrink: 0,
                              transform: "translateY(-2.5px)",
                            }}
                          />
                        </Tag>
                      )}
                    </div>
                  </td>

                  <td style={cellStyle}>
                    <div className="flex flex-row items-center">
                      <Tag
                        minimal
                        intent={Intent.NONE}
                        style={{
                          minHeight: "24px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "0.875rem",
                          padding: "4px 4px",
                          maxWidth: "fit-content",
                          marginRight: "0.5rem",
                        }}
                      >
                        {repo.forks.toLocaleString()}
                        <Icon
                          icon={IconNames.GIT_BRANCH}
                          size={8}
                          style={{
                            marginLeft: "3px",
                            flexShrink: 0,
                            transform: "translateY(-3px)",
                          }}
                        />
                      </Tag>
                      {isGems && repo.forks_growth > 0 && (
                        <Tag
                          minimal
                          intent={Intent.SUCCESS}
                          style={{
                            minHeight: "24px",
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "0.875rem",
                            padding: "4px 4px",
                            maxWidth: "fit-content",
                          }}
                        >
                          +{repo.forks_growth.toLocaleString()}
                          <Icon
                            icon={IconNames.TRENDING_UP}
                            size={10}
                            style={{
                              marginLeft: "3px",
                              flexShrink: 0,
                              transform: "translateY(-2.5px)",
                            }}
                          />
                        </Tag>
                      )}
                    </div>
                  </td>

                  {isGems && (
                    <td style={cellStyle}>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex flex-row items-center gap-1">
                          <Tooltip
                            content="Click to expand full star history from archive runs."
                            placement="top"
                          >
                            <Button
                              minimal
                              small
                              icon={
                                isExpanded
                                  ? IconNames.CHEVRON_DOWN
                                  : IconNames.CHEVRON_RIGHT
                              }
                              aria-label={
                                isExpanded
                                  ? "Collapse history"
                                  : "Expand history"
                              }
                              aria-expanded={isExpanded}
                              onClick={() => toggleHistory(repo.github_id)}
                            />
                          </Tooltip>
                          <Tooltip
                            content="Recent trajectory (left = older, right = now). Click the chevron for full history."
                            placement="top"
                          >
                            <button
                              type="button"
                              onClick={() => toggleHistory(repo.github_id)}
                              style={{
                                display: "inline-flex",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                padding: 0,
                              }}
                              aria-label="Toggle star history"
                            >
                              <Sparkline values={trendSeries(repo)} />
                            </button>
                          </Tooltip>
                        </div>
                        {accel !== 0 && (
                          <Tooltip
                            content="Acceleration — recent star growth minus the previous period's growth. Positive = the star-rate is speeding up."
                            placement="bottom"
                          >
                            <Tag
                              minimal
                              intent={accel > 0 ? Intent.SUCCESS : Intent.NONE}
                              style={{
                                fontSize: "0.7rem",
                                padding: "1px 5px",
                                cursor: "help",
                              }}
                              icon={
                                accel > 0
                                  ? IconNames.ARROW_UP
                                  : IconNames.ARROW_DOWN
                              }
                            >
                              {accel > 0 ? "+" : ""}
                              {accel.toLocaleString()}
                            </Tag>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  )}

                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <div className="flex flex-row items-center justify-end gap-1">
                      {isGems && onToggleFlag && (
                        <>
                          <Tooltip
                            content={repo.is_saved ? "Unsave" : "Save gem"}
                            placement="top"
                          >
                            <Button
                              minimal
                              icon={
                                repo.is_saved
                                  ? IconNames.STAR
                                  : IconNames.STAR_EMPTY
                              }
                              intent={
                                repo.is_saved ? Intent.WARNING : Intent.NONE
                              }
                              aria-label={repo.is_saved ? "Unsave" : "Save"}
                              onClick={() =>
                                onToggleFlag(
                                  repo.github_id,
                                  "saved",
                                  !repo.is_saved,
                                )
                              }
                            />
                          </Tooltip>
                          <Tooltip
                            content={repo.is_hidden ? "Unhide" : "Hide"}
                            placement="top"
                          >
                            <Button
                              minimal
                              icon={
                                repo.is_hidden
                                  ? IconNames.EYE_OPEN
                                  : IconNames.EYE_OFF
                              }
                              intent={repo.is_hidden ? Intent.DANGER : Intent.NONE}
                              aria-label={repo.is_hidden ? "Unhide" : "Hide"}
                              onClick={() =>
                                onToggleFlag(
                                  repo.github_id,
                                  "hidden",
                                  !repo.is_hidden,
                                )
                              }
                            />
                          </Tooltip>
                        </>
                      )}
                      <AnchorButton
                        href={`https://github.com/${repo.owner}/${repo.name}`}
                        target="_blank"
                        minimal
                        intent={Intent.PRIMARY}
                        text="View"
                      />
                    </div>
                  </td>
                </tr>
                {isGems && isExpanded && (
                  <tr>
                    <td
                      colSpan={colCount}
                      style={{
                        padding: "0 1.5rem 1.25rem",
                        background: "rgba(255,255,255,0.02)",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <RepoHistoryPanel
                        repo={repo}
                        history={historyById[repo.github_id] ?? null}
                        loading={loadingHistoryId === repo.github_id}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </HTMLTable>
      </div>
    </Card>
  );
}
