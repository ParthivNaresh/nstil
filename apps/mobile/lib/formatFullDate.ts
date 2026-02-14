const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatFullDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
