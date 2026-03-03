type TimeOfDay = "morning" | "afternoon" | "evening";

const MORNING_START = 5;
const AFTERNOON_START = 12;
const EVENING_START = 17;

export function getTimeOfDay(hour: number = new Date().getHours()): TimeOfDay {
  if (hour >= MORNING_START && hour < AFTERNOON_START) return "morning";
  if (hour >= AFTERNOON_START && hour < EVENING_START) return "afternoon";
  return "evening";
}
