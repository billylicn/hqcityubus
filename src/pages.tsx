import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/app-header';
import { BottomNav } from './components/bottom-nav';
import { DirectionSwitch } from './components/direction-switch';
import { RouteCard } from './components/route-card';
import { ServiceNote } from './components/service-note';
import { routes } from './data/routes';
import type { Direction } from './data/types';
import {
  localDateKey,
  timeOnDate,
  tripsForCalendarDate,
  upcomingTrips,
} from './lib/schedule';
import { sitePath } from './lib/site-path';

function currentTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function savedDirection(): Direction {
  const saved = window.localStorage.getItem('tongqin-direction');
  return saved === 'toHengqin' || saved === 'toUniversity' ? saved : 'toHengqin';
}

function isDirection(value: string | null): value is Direction {
  return value === 'toHengqin' || value === 'toUniversity';
}

export function HomePage() {
  const [direction, setDirection] = useState<Direction>('toHengqin');
  const [now, setNow] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState<'now' | 'custom'>('now');
  const [customTime, setCustomTime] = useState('08:00');

  useEffect(() => {
    const update = () => setNow(new Date());
    const current = new Date();
    setCustomTime(currentTimeValue(current));
    setDirection(savedDirection());
    setNow(current);
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const reference = useMemo(() => {
    if (!now) return null;
    return previewMode === 'now'
      ? now
      : timeOnDate(localDateKey(now), customTime);
  }, [customTime, now, previewMode]);

  const trips = useMemo(
    () => reference ? upcomingTrips(routes, direction, reference) : [],
    [direction, reference],
  );

  const changeDirection = (value: Direction) => {
    setDirection(value);
    window.localStorage.setItem('tongqin-direction', value);
  };

  const chooseCustom = () => {
    if (now && previewMode === 'now') setCustomTime(currentTimeValue(now));
    setPreviewMode('custom');
  };

  return (
    <main className="app-shell has-bottom-nav">
      <AppHeader time={now} />
      <DirectionSwitch value={direction} onChange={changeDirection} />

      <section className="preview-control" aria-label="时间预览">
        <div className="preview-tabs" role="group" aria-label="预览方式">
          <button
            type="button"
            className={previewMode === 'now' ? 'active' : ''}
            aria-pressed={previewMode === 'now'}
            onClick={() => setPreviewMode('now')}
          >
            现在
          </button>
          <button
            type="button"
            className={previewMode === 'custom' ? 'active' : ''}
            aria-pressed={previewMode === 'custom'}
            onClick={chooseCustom}
          >
            自选时间
          </button>
        </div>
        {previewMode === 'custom' ? (
          <label className="time-field">
            <span>预览时间</span>
            <input
              type="time"
              value={customTime}
              onChange={(event) => setCustomTime(event.target.value || '00:00')}
            />
          </label>
        ) : null}
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">{previewMode === 'now' ? '现在之后' : `${customTime} 之后`}</p>
          <h2>下一班</h2>
        </div>
        <span>{trips.length} 班可乘</span>
      </section>

      {trips.length && reference ? (
        <section className="service-list" aria-live="polite">
          {trips.map((trip, index) => (
            <RouteCard
              key={trip.id}
              trip={trip}
              reference={reference}
              nearest={index === 0}
              showCountdown
            />
          ))}
        </section>
      ) : now ? (
        <section className="empty-state" aria-live="polite">
          <span className="empty-mark" aria-hidden="true">✓</span>
          <h2>今日暂无后续班次</h2>
          <p>可以查看该方向的完整全天时刻。</p>
          <a href={`${sitePath('schedule/')}?direction=${direction}`}>查看全天时刻表</a>
        </section>
      ) : null}

      <ServiceNote />
      <BottomNav active="home" />
    </main>
  );
}

export function SchedulePage() {
  const [direction, setDirection] = useState<Direction>('toHengqin');
  const [dateKey, setDateKey] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDirection = params.get('direction');
    setDirection(isDirection(requestedDirection) ? requestedDirection : savedDirection());
    setDateKey(localDateKey(new Date()));
  }, []);

  const trips = useMemo(
    () => dateKey ? tripsForCalendarDate(routes, direction, dateKey) : [],
    [dateKey, direction],
  );

  const changeDirection = (value: Direction) => {
    setDirection(value);
    window.localStorage.setItem('tongqin-direction', value);
    const url = new URL(window.location.href);
    url.searchParams.set('direction', value);
    window.history.replaceState(null, '', url);
  };

  return (
    <main className="app-shell has-bottom-nav">
      <AppHeader />
      <DirectionSwitch value={direction} onChange={changeDirection} />

      <section className="schedule-header">
        <div className="section-heading timetable-title">
          <div>
            <p className="eyebrow">每日相同时刻</p>
            <h2>全天班次</h2>
          </div>
          <span>{trips.length} 班</span>
        </div>
      </section>

      {trips.length ? (
        <section className="service-list timetable-list" aria-live="polite">
          {trips.map((trip) => <RouteCard key={trip.id} trip={trip} />)}
        </section>
      ) : dateKey ? (
        <section className="empty-state compact" aria-live="polite">
          <h2>该方向暂无班次</h2>
          <p>可切换方向查看另一方向的全天时刻。</p>
        </section>
      ) : null}

      <ServiceNote />
      <BottomNav active="schedule" />
    </main>
  );
}
