/**
 * Gets all Mondays for a given year and month (0-indexed).
 * Returns date strings in YYYY-MM-DD format.
 */
export function getMondaysOfMonth(year: number, month: number): string[] {
  const mondays: string[] = [];
  // Start on the 1st of the month
  const date = new Date(year, month, 1);
  
  // Find the first Monday
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }
  
  // Collect all Mondays of this month
  while (date.getMonth() === month) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    mondays.push(`${yyyy}-${mm}-${dd}`);
    date.setDate(date.getDate() + 7);
  }
  
  return mondays;
}

/**
 * Returns a list of Date objects representing the full calendar grid (42 days)
 * for the given year and month (0-indexed).
 */
export function getCalendarGrid(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Start from the Sunday of the first week (could be in the previous month)
  const startDate = new Date(year, month, 1 - startDayOfWeek);
  
  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    grid.push(new Date(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }
  
  return grid;
}

/**
 * Formats a Date object to YYYY-MM-DD format in local timezone.
 */
export function toLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
