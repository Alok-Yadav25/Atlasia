export interface PlannerItem {
  id: string;
  title: string;
  place: string;
  date: string;
  time: string;
  category: string;
  notes: string;
  sourceUrl?: string;
}

const STORAGE_KEY = "place-explorer-planner-v1";

export function readPlanner(): PlannerItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? (value as PlannerItem[]) : [];
  } catch {
    return [];
  }
}

export function writePlanner(items: PlannerItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("place-explorer-planner-change"));
}

export function addPlannerItem(item: PlannerItem): PlannerItem[] {
  const current = readPlanner();
  const next = [item, ...current.filter((entry) => entry.id !== item.id)];
  writePlanner(next);
  return next;
}

export function plannerItemToIcs(item: PlannerItem): string {
  const compactDate = item.date.replaceAll("-", "");
  const compactTime = item.time ? item.time.replace(":", "") + "00" : "090000";
  const escape = (value: string) => value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Atlasia//Planner//EN",
    "BEGIN:VEVENT",
    `UID:${escape(item.id)}@atlasia`,
    `DTSTART:${compactDate}T${compactTime}`,
    `SUMMARY:${escape(item.title)}`,
    `LOCATION:${escape(item.place)}`,
    `DESCRIPTION:${escape(item.notes)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
