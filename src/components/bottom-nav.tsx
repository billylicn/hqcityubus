import { sitePath } from '../lib/site-path';

export function BottomNav({ active }: { active: 'home' | 'schedule' }) {
  return (
    <nav className="bottom-nav" aria-label="主要页面">
      <a className={active === 'home' ? 'active' : ''} href={sitePath()}>
        <span aria-hidden="true">●</span>
        下一班
      </a>
      <a className={active === 'schedule' ? 'active' : ''} href={sitePath('schedule/')}>
        <span aria-hidden="true">≡</span>
        时刻表
      </a>
    </nav>
  );
}
