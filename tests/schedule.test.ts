import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import routeData from '../src/data/routes.generated.json' with { type: 'json' };
import type { Direction, RouteService } from '../src/data/types.ts';
import {
  addDays,
  localDateKey,
  operatesOn,
  timeOnDate,
  tripsForCalendarDate,
  upcomingTrips,
} from '../src/lib/schedule.ts';
import { normalizeStopName, parseSource } from '../scripts/parse-routes.mjs';

const routes = routeData.routes as RouteService[];

test('真实 TXT 完整解析为 45 条可用线路', async () => {
  const sourceA = await readFile(new URL('../data/routes/城市大学到横琴.txt', import.meta.url), 'utf8');
  const sourceB = await readFile(new URL('../data/routes/横琴到城市大学.txt', import.meta.url), 'utf8');
  const parsedA = parseSource(sourceA, { direction: 'toHengqin' });
  const parsedB = parseSource(sourceB, { direction: 'toUniversity' });

  assert.equal(parsedA.routes.length, 23);
  assert.equal(parsedB.routes.length, 22);
  assert.deepEqual([...parsedA.warnings, ...parsedB.warnings], []);
});

test('城市大学相关原始站名只显示为澳门城市大学', () => {
  assert.equal(normalizeStopName('澳门新濠锋酒店'), '澳门城市大学');
  assert.equal(normalizeStopName('新濠锋正门（澳城大/澳理大/澳旅大）'), '澳门城市大学');
  assert.equal(normalizeStopName('澳门城市大学氹仔校区'), '澳门城市大学');
  assert.equal(normalizeStopName('澳门科技大学南门'), '澳门科技大学南门');

  for (const route of routes) {
    const commuteIndex = route.direction === 'toHengqin'
      ? route.boardingStopIndex
      : route.alightingStopIndex;
    assert.equal(route.stops[commuteIndex].displayName, '澳门城市大学');
  }
});

test('耗时由实际上下车时间计算且均为正数', () => {
  for (const route of routes) {
    assert.equal(route.duration, route.alightingMinutes - route.boardingMinutes);
    assert.ok(route.duration > 0, route.serviceName);
  }
});

test('全天时刻按实际上车时间而非线路始发时间排序', () => {
  const trips = tripsForCalendarDate(routes, 'toUniversity', '2026-09-02');
  assert.equal(trips[0].departure.getHours(), 8);
  assert.equal(trips[0].departure.getMinutes(), 15);
  assert.ok(trips.every((trip, index) => index === 0 || trip.departure >= trips[index - 1].departure));
});

test('自选时间只保留该时间及之后的班次', () => {
  const reference = timeOnDate('2026-09-02', '18:21');
  const trips = upcomingTrips(routes, 'toUniversity', reference);
  assert.ok(trips.length > 0);
  assert.ok(trips.every((trip) => trip.departure >= reference));
  assert.equal(`${trips[0].departure.getHours()}:${trips[0].departure.getMinutes()}`, '18:26');
});

test('末班之后返回空列表', () => {
  const reference = timeOnDate('2026-09-02', '22:49');
  assert.equal(upcomingTrips(routes, 'toUniversity', reference).length, 0);
});

test('跨午夜班次归入实际上车的日历日', () => {
  const overnight: RouteService = {
    routeCode: 'T1',
    serviceName: '跨午夜测试线',
    direction: 'toHengqin',
    serviceDays: [0, 1, 2, 3, 4, 5, 6],
    validDates: null,
    serviceRuleSource: 'test',
    stops: [
      { rawName: '起点', displayName: '起点', time: '23:50', minutes: 1430, dayOffset: 0, role: null },
      { rawName: '澳门新濠锋酒店', displayName: '澳门城市大学', time: '00:30', minutes: 1470, dayOffset: 1, role: 'boarding' },
      { rawName: '横琴口岸', displayName: '横琴口岸', time: '00:55', minutes: 1495, dayOffset: 1, role: 'alighting' },
    ],
    boardingStopIndex: 1,
    alightingStopIndex: 2,
    boardingTime: '00:30',
    alightingTime: '00:55',
    boardingMinutes: 1470,
    alightingMinutes: 1495,
    duration: 25,
  };

  const date = '2026-09-03';
  const trip = tripsForCalendarDate([overnight], 'toHengqin', date)[0];
  assert.equal(localDateKey(trip.departure), date);
  assert.equal(trip.serviceDateKey, addDays(date, -1));
});

test('serviceDays 与 validDates 真正参与日期计算', () => {
  const route = { ...routes[0], serviceDays: [3], validDates: ['2026-09-02'] };
  assert.equal(operatesOn(route, '2026-09-02'), true);
  assert.equal(operatesOn(route, '2026-09-03'), false);
});

test('异常 TXT 会被报告而不是被猜测补全', () => {
  const malformed = [
    '1. 测试线',
    '25:10 错误时间【上车】',
    '08:00 合法站【上车】',
    '08:10 重复上车【上车】',
    '08:30 下车站【下车】',
    '这不是站点',
  ].join('\n');
  const parsed = parseSource(malformed, { direction: 'toHengqin' as Direction });
  assert.equal(parsed.routes.length, 0);
  assert.ok(parsed.warnings.some((warning: { message: string }) => warning.message.includes('超出')));
  assert.ok(parsed.warnings.some((warning: { message: string }) => warning.message.includes('重复')));
  assert.ok(parsed.warnings.some((warning: { message: string }) => warning.message.includes('无法识别')));
});
