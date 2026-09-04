import { INSTALLATION_STATUS_LABELS } from '../../installations/installations.constants'
import './CustomerSummaryTiles.scss'

// Ixcham xulosa bloklari (spec 13: "Chatning yonida... DASTURLAR / BUYURTMALAR
// / TO'LOV / O'RNATISH / VAZIFALAR") — har doim ko'rinadi, tab almashsa ham
// joyida turadi, xodim mijoz holatini bir qarashda tushunadi.
export function CustomerSummaryTiles({ programs = [], deal, payments = [], installationStatus, taskCount }) {
  const activeProgramCount = programs.filter((p) => p.status === 'ACTIVE').length
  const total = deal?.value != null ? Number(deal.value) : null
  const paid = payments.filter((p) => p.status === 'PAID' || p.status === 'PARTIAL').reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const tiles = [
    { label: 'Dasturlar', value: programs.length ? `${programs.length} (${activeProgramCount} faol)` : '—' },
    { label: 'Buyurtma', value: total != null ? `${total.toLocaleString('ru-RU')} so‘m` : '—' },
    { label: 'To‘lov', value: total != null ? `${paid.toLocaleString('ru-RU')} / ${total.toLocaleString('ru-RU')}` : '—' },
    { label: 'O‘rnatish', value: installationStatus ? INSTALLATION_STATUS_LABELS[installationStatus] || installationStatus : '—' },
    { label: 'Vazifalar', value: taskCount != null ? taskCount : '—' },
  ]

  return (
    <div className="customer-summary-tiles">
      {tiles.map((tile) => (
        <div key={tile.label} className="customer-summary-tiles__tile">
          <div className="customer-summary-tiles__label">{tile.label}</div>
          <div className="customer-summary-tiles__value">{tile.value}</div>
        </div>
      ))}
    </div>
  )
}
