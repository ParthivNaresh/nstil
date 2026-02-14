const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const WEEK_MS = 604_800_000;

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < MINUTE_MS) {
    return "Just now";
  }

  if (diff < HOUR_MS) {
    const minutes = Math.floor(diff / MINUTE_MS);
    return `${minutes}m ago`;
  }

  if (diff < DAY_MS) {
    const hours = Math.floor(diff / HOUR_MS);
    return `${hours}h ago`;
  }

  if (diff < 2 * DAY_MS) {
    return "Yesterday";
  }

  if (diff < WEEK_MS) {
    const days = Math.floor(diff / DAY_MS);
    return `${days}d ago`;
  }

  return dateFormatter.format(date);
}
