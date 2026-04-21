interface Props {
  curTab: 'schedule' | 'stats' | 'mastery'
  onTabChange: (tab: 'schedule' | 'stats' | 'mastery') => void
  onFabClick: () => void
}

export default function BottomNav({ curTab, onTabChange, onFabClick }: Props) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${curTab === 'schedule' ? 'active' : ''}`}
        onClick={() => onTabChange('schedule')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="3"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        日程
      </button>
      <button className="nav-fab" onClick={onFabClick}>
        <div className="nav-fab-circle">+</div>
      </button>
      <button
        className={`nav-btn ${curTab === 'stats' ? 'active' : ''}`}
        onClick={() => onTabChange('stats')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        统计
      </button>
      <button
        className={`nav-btn ${curTab === 'mastery' ? 'active' : ''}`}
        onClick={() => onTabChange('mastery')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 3"/>
        </svg>
        精通
      </button>
    </nav>
  )
}
