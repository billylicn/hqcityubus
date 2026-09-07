import { useState } from 'react';
import type { ScheduledTrip } from '../data/types';
import {
  countdownLabel,
  dayOffsetLabel,
  displayTripTime,
  minutesUntil,
} from '../lib/schedule';

export function RouteCard({
  trip,
  reference,
  nearest = false,
  showCountdown = false,
}: {
  trip: ScheduledTrip;
  reference?: Date;
  nearest?: boolean;
  showCountdown?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { route } = trip;
  const minutes = reference ? minutesUntil(trip.departure, reference) : 0;
  const destination = route.direction === 'toUniversity' ? '澳门城市大学' : '横琴口岸';

  return (
    <article className={`service-card${nearest ? ' nearest' : ''}${expanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className={`card-toggle ${route.direction}`}
        aria-expanded={expanded}
        aria-label={`${route.serviceName}，${displayTripTime(trip)} 出发，${route.alightingTime} 到达${destination}，行程 ${route.duration} 分钟`}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="route-row">
          <span className="service-name">{route.serviceName}</span>
          {showCountdown ? <span className="countdown">{countdownLabel(minutes)}</span> : null}
        </span>
        <span className="trip-summary">
          <span className="departure-block">
            <strong>{displayTripTime(trip)}</strong>
            <small>出发</small>
          </span>
          <span className="journey-duration">
            <i aria-hidden="true" />
            <b>{route.duration} 分钟</b>
            <i aria-hidden="true" />
          </span>
          <span className="arrival-block">
            <strong>{route.alightingTime}</strong>
            <small>到达</small>
          </span>
          <span className="expand-label" aria-hidden="true">{expanded ? '收起' : '线路'}</span>
        </span>
      </button>

      <div className="route-details" aria-hidden={!expanded}>
        <div className="route-details-inner">
          <ol className="stop-list">
            {route.stops.map((stop, index) => {
              const isBoarding = index === route.boardingStopIndex;
              const isAlighting = index === route.alightingStopIndex;
              return (
                <li
                  key={`${stop.minutes}-${stop.rawName}-${index}`}
                  className={`${isBoarding ? 'commute-stop boarding' : ''}${isAlighting ? ' commute-stop alighting' : ''}`}
                >
                  <span className="stop-time">
                    {stop.time}
                    <small>{dayOffsetLabel(stop.minutes, route.boardingMinutes)}</small>
                  </span>
                  <span className="timeline-dot" aria-hidden="true" />
                  <span className="stop-name">
                    {stop.displayName}
                    {isBoarding ? <em>上车</em> : null}
                    {isAlighting ? <em>下车</em> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </article>
  );
}
