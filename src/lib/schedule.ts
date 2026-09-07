import type { Direction, RouteService, ScheduledTrip } from '../data/types';

const DAY_MINUTES = 24 * 60;

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    !year || !month || !day ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid local date: ${dateKey}`);
  }
  return date;
}

export function addDays(dateKey: string, days: number) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function timeOnDate(dateKey: string, time: string) {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid time: ${time}`);
  const value = dateFromKey(dateKey);
  value.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return value;
}

export function operatesOn(route: RouteService, serviceDateKey: string) {
  if (route.validDates && !route.validDates.includes(serviceDateKey)) return false;
  return route.serviceDays.includes(dateFromKey(serviceDateKey).getDay());
}

function departureForServiceDate(route: RouteService, serviceDateKey: string) {
  const departure = dateFromKey(serviceDateKey);
  departure.setHours(0, route.boardingMinutes, 0, 0);
  return departure;
}

export function tripsForCalendarDate(
  routes: RouteService[],
  direction: Direction,
  calendarDateKey: string,
): ScheduledTrip[] {
  const candidateServiceDates = [addDays(calendarDateKey, -1), calendarDateKey];
  return candidateServiceDates
    .flatMap((serviceDateKey) => routes
      .filter((route) => route.direction === direction && operatesOn(route, serviceDateKey))
      .map((route) => ({
        id: `${serviceDateKey}:${route.direction}:${route.serviceName}:${route.boardingMinutes}`,
        route,
        serviceDateKey,
        departure: departureForServiceDate(route, serviceDateKey),
      })))
    .filter((trip) => localDateKey(trip.departure) === calendarDateKey)
    .sort((a, b) =>
      a.departure.getTime() - b.departure.getTime() ||
      a.route.serviceName.localeCompare(b.route.serviceName, 'zh-CN'),
    );
}

export function upcomingTrips(
  routes: RouteService[],
  direction: Direction,
  reference: Date,
) {
  return tripsForCalendarDate(routes, direction, localDateKey(reference))
    .filter((trip) => trip.departure.getTime() >= reference.getTime());
}

export function minutesUntil(departure: Date, reference: Date) {
  return Math.max(0, Math.ceil((departure.getTime() - reference.getTime()) / 60_000));
}

export function countdownLabel(minutes: number) {
  if (minutes <= 0) return '即将发车';
  if (minutes < 60) return `${minutes}分钟后`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}小时${rest}分钟后` : `${hours}小时后`;
}

export function displayTripTime(trip: ScheduledTrip) {
  return `${String(trip.departure.getHours()).padStart(2, '0')}:${String(trip.departure.getMinutes()).padStart(2, '0')}`;
}

export function stopDateTime(trip: ScheduledTrip, stopMinutes: number) {
  const value = dateFromKey(trip.serviceDateKey);
  value.setHours(0, stopMinutes, 0, 0);
  return value;
}

export function dayOffsetLabel(stopMinutes: number, boardingMinutes: number) {
  const offset = Math.floor(stopMinutes / DAY_MINUTES) - Math.floor(boardingMinutes / DAY_MINUTES);
  return offset > 0 ? ` +${offset}日` : offset < 0 ? ` ${offset}日` : '';
}

export function formatCalendarDate(dateKey: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(dateFromKey(dateKey));
}
