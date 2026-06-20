const ANN_READ_KEY = 'readAnnouncements';
const CAL_READ_KEY = 'readCalendarEvents';

function getReadIds(key: string): Set<string> {
  const stored = localStorage.getItem(key);
  return new Set(stored ? JSON.parse(stored) : []);
}

function addReadId(key: string, id: string): void {
  const ids = getReadIds(key);
  ids.add(id);
  localStorage.setItem(key, JSON.stringify([...ids]));
}

function addReadIds(key: string, ids: string[]): void {
  const existing = getReadIds(key);
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(key, JSON.stringify([...existing]));
}

export function markAnnouncementRead(id: string): void {
  addReadId(ANN_READ_KEY, id);
}

export function markCalendarEventRead(id: string): void {
  addReadId(CAL_READ_KEY, id);
}

export function markAllAnnouncementsRead(ids: string[]): void {
  addReadIds(ANN_READ_KEY, ids);
}

export function markAllCalendarEventsRead(ids: string[]): void {
  addReadIds(CAL_READ_KEY, ids);
}

export function getUnreadAnnouncements(list: Record<string, unknown>[]): Record<string, unknown>[] {
  const readIds = getReadIds(ANN_READ_KEY);
  return list.filter((a) => !readIds.has(String(a.id)));
}

export function getUnreadCalendarEvents(list: Record<string, unknown>[]): Record<string, unknown>[] {
  const readIds = getReadIds(CAL_READ_KEY);
  return list.filter((e) => !readIds.has(String(e.id)));
}
