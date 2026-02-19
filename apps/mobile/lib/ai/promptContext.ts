import type {
  AIContextEntry,
  AIContextMoodDistribution,
  AIContextProfile,
  AIContextResponse,
  AIContextStats,
} from "@/types";

const MAX_ENTRY_SUMMARY_LENGTH = 150;
const MAX_ENTRIES_IN_CONTEXT = 5;
const MAX_MOOD_CATEGORIES = 5;

function summarizeEntry(entry: AIContextEntry): string {
  const mood = entry.mood_category ?? "unspecified mood";
  const title = entry.title || "Untitled";
  const body =
    entry.body.length > MAX_ENTRY_SUMMARY_LENGTH
      ? `${entry.body.slice(0, MAX_ENTRY_SUMMARY_LENGTH)}...`
      : entry.body;
  const tags = entry.tags.length > 0 ? ` [${entry.tags.join(", ")}]` : "";
  return `- "${title}" (${mood}${tags}): ${body}`;
}

function formatMoodDistribution(moods: readonly AIContextMoodDistribution[]): string {
  if (moods.length === 0) return "No mood data available.";

  const total = moods.reduce((sum, m) => sum + m.count, 0);
  const lines = moods.slice(0, MAX_MOOD_CATEGORIES).map((m) => {
    const pct = total > 0 ? Math.round((m.count / total) * 100) : 0;
    const specific = m.mood_specific ? ` (${m.mood_specific})` : "";
    return `- ${m.mood_category}${specific}: ${pct}%`;
  });
  return lines.join("\n");
}

function formatStats(stats: AIContextStats): string {
  const parts: string[] = [];
  parts.push(`Total entries: ${stats.total_entries}`);
  parts.push(`Entries in last 7 days: ${stats.entries_last_7d}`);
  parts.push(`Check-ins in last 7 days: ${stats.check_ins_last_7d}`);
  if (stats.avg_entry_length_7d !== null) {
    parts.push(`Average entry length (7d): ${stats.avg_entry_length_7d} characters`);
  }
  if (stats.last_entry_at) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(stats.last_entry_at).getTime()) / (1000 * 60 * 60 * 24),
    );
    parts.push(`Last entry: ${daysAgo === 0 ? "today" : `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`}`);
  }
  return parts.join("\n");
}

function formatProfile(profile: AIContextProfile): string {
  const parts: string[] = [];
  parts.push(`Preferred style: ${profile.prompt_style}`);
  if (profile.topics_to_avoid.length > 0) {
    parts.push(`Topics to avoid: ${profile.topics_to_avoid.join(", ")}`);
  }
  if (profile.goals.length > 0) {
    const goalNames = profile.goals
      .map((g) => {
        const name = g.name ?? g.title;
        return typeof name === "string" ? name : "unnamed";
      });
    parts.push(`Goals: ${goalNames.join(", ")}`);
  }
  return parts.join("\n");
}

export function buildContextString(context: AIContextResponse): string {
  const sections: string[] = [];

  sections.push(`USER PROFILE:\n${formatProfile(context.profile)}`);
  sections.push(`JOURNALING ACTIVITY:\n${formatStats(context.stats)}`);
  sections.push(`RECENT MOOD PATTERNS:\n${formatMoodDistribution(context.mood_distribution)}`);

  if (context.recent_entries.length > 0) {
    const entries = context.recent_entries
      .slice(0, MAX_ENTRIES_IN_CONTEXT)
      .map(summarizeEntry)
      .join("\n");
    sections.push(`RECENT ENTRIES:\n${entries}`);
  }

  return sections.join("\n\n");
}
