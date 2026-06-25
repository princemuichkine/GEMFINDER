/** Compact relative time, e.g. "just now", "5m ago", "2h ago", "3d ago". */
export function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;

  const sec = Math.max(0, (Date.now() - t) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86_400) return `${Math.round(sec / 3600)}h ago`;
  if (sec < 86_400 * 7) return `${Math.round(sec / 86_400)}d ago`;

  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Compact relative age from a past date, e.g. "today", "12d", "5mo". */
export function formatAge(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.max(0, (Date.now() - t) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}
