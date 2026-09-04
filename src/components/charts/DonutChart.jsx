import './DonutChart.scss'

const COLORS = ['#2f89ae', '#22a06b', '#c9a257', '#73a992', '#d1554f', '#919e97']
const SIZE = 140
const STROKE = 18
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function DonutChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let offset = 0

  return (
    <div className="donut-chart">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#ddd9ee" strokeWidth={STROKE} />
        {total > 0 &&
          data.map((item, index) => {
            const fraction = item.value / total
            const dash = fraction * CIRCUMFERENCE
            const circle = (
              <circle
                key={item.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={item.color || COLORS[index % COLORS.length]}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            )
            offset += dash
            return circle
          })}
      </svg>
      <ul className="donut-chart__legend">
        {data.map((item, index) => (
          <li key={item.label}>
            <span className="donut-chart__swatch" style={{ background: item.color || COLORS[index % COLORS.length] }} />
            <span>{item.label}</span>
            <span className="donut-chart__legend-value">{item.value}</span>
          </li>
        ))}
        {total === 0 && <li className="text-muted">Ma'lumot yo‘q</li>}
      </ul>
    </div>
  )
}
