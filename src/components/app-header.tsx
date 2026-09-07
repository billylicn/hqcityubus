export function AppHeader({ time }: { time?: Date | null }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">澳门城市大学 ↔ 横琴口岸</p>
        <h1>通琴号班次</h1>
      </div>
      {time !== undefined ? (
        <span className="live-time">
          {time ? time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
      ) : null}
    </header>
  );
}
