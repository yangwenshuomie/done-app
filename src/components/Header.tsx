interface Props {
  todayCount: number
  totalCount: number
  onMenuOpen: () => void
}

export default function Header({ todayCount, totalCount, onMenuOpen }: Props) {
  return (
    <header>
      <div className="header-top">
        <div className="logo">Done<em>.</em></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="export-btn" onClick={onMenuOpen} title="更多">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1.2" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
              <circle cx="19" cy="12" r="1.2" fill="currentColor"/>
            </svg>
          </button>
          <div className="stats-pill">
            <div className="stat">
              <div className="stat-num">{todayCount}</div>
              <div className="stat-label">今天</div>
            </div>
            <div className="stat">
              <div className="stat-num">{totalCount}</div>
              <div className="stat-label">总计</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
