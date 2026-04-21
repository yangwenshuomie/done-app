import { useState } from 'react'
import { toDateKey, pad, fmtDuration } from '../utils'
import { Entry } from '../types'

const CAT_COLORS = ['#5b8ef0', '#f07b5b', '#5bbf8e', '#c97de8', '#e8c45b', '#5bcce8', '#e85b8e', '#8eb85b']

interface CatVal { count: number; secs: number }
interface DonutData { name: string; val: number; color: string; label: string }

function getPeriodStart(period: string): number {
  const now = new Date()
  if (period === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (period === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d.getTime() }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return new Date(now.getFullYear(), 0, 1).getTime()
}

function buildDonut(data: DonutData[], centerVal: number | string, centerLabel: string) {
  const R = 52, r = 36, cx = 60, cy = 60, thick = R - r
  const total = data.reduce((s, d) => s + d.val, 0)
  if (!total) return null

  let cumA = -Math.PI / 2
  const mid = (R + r) / 2
  const paths = data.map(d => {
    const angle = (d.val / total) * 2 * Math.PI
    if (angle >= 2 * Math.PI - 0.001) {
      return <circle key={d.name} cx={cx} cy={cy} r={mid} fill="none" stroke={d.color} strokeWidth={thick} />
    }
    const x1 = cx + mid * Math.cos(cumA), y1 = cy + mid * Math.sin(cumA)
    const x2 = cx + mid * Math.cos(cumA + angle), y2 = cy + mid * Math.sin(cumA + angle)
    const lg = angle > Math.PI ? 1 : 0
    const path = `M${x1.toFixed(1)},${y1.toFixed(1)} A${mid},${mid} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)}`
    cumA += angle
    return <path key={d.name} d={path} fill="none" stroke={d.color} strokeWidth={thick} strokeLinecap="butt" />
  })

  const legendRows = data.slice(0, 6).map(d => (
    <div key={d.name} className="donut-legend-row">
      <div className="donut-legend-dot" style={{ background: d.color }} />
      <div className="donut-legend-name">{d.name}</div>
      <div className="donut-legend-val">{d.label}</div>
    </div>
  ))

  return (
    <div className="donut-inner">
      <div className="donut-svg-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="var(--line)" strokeWidth={thick} />
          {paths}
        </svg>
        <div className="donut-center">
          <div className="donut-center-num">{centerVal}</div>
          <div className="donut-center-label">{centerLabel}</div>
        </div>
      </div>
      <div className="donut-legend-list">
        {legendRows}
        {data.length > 6 && <div style={{ fontSize: '10px', color: 'var(--ink-3)' }}>+{data.length - 6} 个分类</div>}
      </div>
    </div>
  )
}

export default function StatsView({ entries }: { entries: Entry[] }) {
  const [period, setPeriod] = useState('week')
  const [chartType, setChartType] = useState('donut')

  const since = getPeriodStart(period)
  const filtered = entries.filter(e => e.ts >= since)
  const totalCount = filtered.length
  const totalSecs = filtered.reduce((s, e) => s + (e.duration ?? 0), 0)

  const totalHrs = totalSecs > 0
    ? (Math.floor(totalSecs / 3600) > 0 ? `${Math.floor(totalSecs / 3600)}h ${pad(Math.floor((totalSecs % 3600) / 60))}m` : `${Math.floor(totalSecs / 60)}m`)
    : '—'

  let streak = 0
  const sd = new Date()
  while (entries.some(e => toDateKey(e.ts) === toDateKey(sd.getTime()))) {
    streak++; sd.setDate(sd.getDate() - 1)
  }

  const catMap: Record<string, CatVal> = {}
  filtered.forEach(e => {
    const k = e.tag || '未分类'
    if (!catMap[k]) catMap[k] = { count: 0, secs: 0 }
    catMap[k].count++
    if (e.duration) catMap[k].secs += e.duration
  })
  const catList = Object.entries(catMap).sort((a, b) => b[1].secs - a[1].secs || b[1].count - a[1].count)
  const catColors: Record<string, string> = {}
  catList.forEach(([name], i) => { catColors[name] = CAT_COLORS[i % CAT_COLORS.length] })

  const hasDuration = catList.some(([, v]) => v.secs > 0)
  const maxCount = catList.length ? Math.max(...catList.map(([, v]) => v.count)) : 1
  const maxSecs = catList.length ? Math.max(...catList.map(([, v]) => v.secs)) : 1

  const PERIODS = [{ k: 'day', l: '今天' }, { k: 'week', l: '近7天' }, { k: 'month', l: '本月' }, { k: 'year', l: '今年' }]

  const legendEl = (
    <div className="chart-legend">
      {catList.map(([name]) => (
        <div key={name} className="legend-item">
          <div className="legend-dot" style={{ background: catColors[name] }} />
          <div className="legend-name">{name}</div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="scroll-area">
      <div className="stats-period-row">
        {PERIODS.map(p => (
          <button key={p.k} className={`period-btn${period === p.k ? ' active' : ''}`} onClick={() => setPeriod(p.k)}>
            {p.l}
          </button>
        ))}
      </div>

      <div className="stats-summary-row">
        <div className="sum-card">
          <div className="sum-num">{totalCount}</div>
          <div className="sum-label">完成</div>
        </div>
        <div className="sum-card">
          <div className="sum-num" style={{ fontSize: totalHrs.length > 5 ? '16px' : '26px' }}>{totalHrs}</div>
          <div className="sum-label">时长</div>
        </div>
        <div className="sum-card">
          <div className="sum-num">{streak}</div>
          <div className="sum-label">连续天</div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="stats-empty">
          <div className="stats-empty-icon">◎</div>
          <div className="stats-empty-text">这段时间暂无记录</div>
        </div>
      ) : (
        <>
          <div className="chart-type-row">
            <button className={`chart-type-btn${chartType === 'donut' ? ' active' : ''}`} onClick={() => setChartType('donut')}>圆弧图</button>
            <button className={`chart-type-btn${chartType === 'bar' ? ' active' : ''}`} onClick={() => setChartType('bar')}>条形图</button>
          </div>

          {chartType === 'donut' ? (
            <>
              {hasDuration && (
                <div className="donut-card">
                  <div className="donut-card-title">时长占比</div>
                  {buildDonut(
                    catList.filter(([, v]) => v.secs > 0).map(([name, v]) => ({
                      name, val: v.secs, color: catColors[name],
                      label: fmtDuration(v.secs) + ' · ' + Math.round(v.secs / totalSecs * 100) + '%',
                    })),
                    Math.floor(totalSecs / 3600) > 0 ? `${Math.floor(totalSecs / 3600)}h` : `${Math.floor(totalSecs / 60)}m`,
                    '总时长'
                  )}
                </div>
              )}
              <div className="donut-card">
                <div className="donut-card-title">件数占比</div>
                {buildDonut(
                  catList.map(([name, v]) => ({
                    name, val: v.count, color: catColors[name],
                    label: v.count + '件 · ' + Math.round(v.count / totalCount * 100) + '%',
                  })),
                  totalCount, '总件数'
                )}
              </div>
            </>
          ) : (
            <>
              {hasDuration && (() => {
                const gradDur = catList.map(([name, v], i) => {
                  const s1 = i === 0 ? 0 : Math.round(catList.slice(0, i).reduce((s, [, c]) => s + c.secs, 0) / totalSecs * 100)
                  const s2 = Math.round(catList.slice(0, i + 1).reduce((s, [, c]) => s + c.secs, 0) / totalSecs * 100)
                  return `${catColors[name]} ${s1}%,${catColors[name]} ${s2}%`
                }).join(',')
                const totalDurLabel = Math.floor(totalSecs / 3600) > 0
                  ? `${Math.floor(totalSecs / 3600)}h ${pad(Math.floor((totalSecs % 3600) / 60))}m`
                  : `${Math.floor(totalSecs / 60)}m`
                return (
                  <div className="chart-card">
                    <div className="chart-card-title">各分类时长</div>
                    <div className="hbar-row">
                      <div className="hbar-label" style={{ color: 'var(--ink)', fontWeight: 500 }}>全部</div>
                      <div className="hbar-outer">
                        <div className="hbar-inner" style={{ width: '100%', background: `linear-gradient(to right,${gradDur})` }} />
                      </div>
                      <div className="hbar-val" style={{ color: 'var(--ink)', fontWeight: 500 }}>{totalDurLabel}</div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--line)', margin: '8px 0' }} />
                    {catList.map(([name, v]) => (
                      <div key={name} className="hbar-row">
                        <div className="hbar-label" title={name}>{name}</div>
                        <div className="hbar-outer">
                          <div className="hbar-inner" style={{ width: `${maxSecs > 0 ? Math.round(v.secs / maxSecs * 100) : 0}%`, background: catColors[name] }} />
                        </div>
                        <div className="hbar-val">
                          {fmtDuration(v.secs) || '—'}
                          <span className="hbar-pct">{totalSecs > 0 ? Math.round(v.secs / totalSecs * 100) : 0}%</span>
                        </div>
                      </div>
                    ))}
                    {legendEl}
                  </div>
                )
              })()}

              {(() => {
                const gradCnt = catList.map(([name, v], i) => {
                  const s1 = i === 0 ? 0 : Math.round(catList.slice(0, i).reduce((s, [, c]) => s + c.count, 0) / totalCount * 100)
                  const s2 = Math.round(catList.slice(0, i + 1).reduce((s, [, c]) => s + c.count, 0) / totalCount * 100)
                  return `${catColors[name]} ${s1}%,${catColors[name]} ${s2}%`
                }).join(',')
                return (
                  <div className="chart-card">
                    <div className="chart-card-title">各分类件数</div>
                    <div className="hbar-row">
                      <div className="hbar-label" style={{ color: 'var(--ink)', fontWeight: 500 }}>全部</div>
                      <div className="hbar-outer">
                        <div className="hbar-inner" style={{ width: '100%', background: `linear-gradient(to right,${gradCnt})` }} />
                      </div>
                      <div className="hbar-val" style={{ color: 'var(--ink)', fontWeight: 500 }}>{totalCount}件</div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--line)', margin: '8px 0' }} />
                    {catList.map(([name, v]) => (
                      <div key={name} className="hbar-row">
                        <div className="hbar-label" title={name}>{name}</div>
                        <div className="hbar-outer">
                          <div className="hbar-inner" style={{ width: `${Math.round(v.count / maxCount * 100)}%`, background: catColors[name] }} />
                        </div>
                        <div className="hbar-val">
                          {v.count}件
                          <span className="hbar-pct">{Math.round(v.count / totalCount * 100)}%</span>
                        </div>
                      </div>
                    ))}
                    {legendEl}
                  </div>
                )
              })()}
            </>
          )}
        </>
      )}
    </div>
  )
}
