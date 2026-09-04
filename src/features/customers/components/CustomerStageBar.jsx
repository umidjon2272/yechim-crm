import { CUSTOMER_STAGES, CUSTOMER_STAGE_LABELS } from '../customers.constants'
import { classNames } from '../../../utils/classNames'
import './CustomerStageBar.scss'

// Mijoz bilan ishlash jarayoni: Yangi -> Gaplashildi -> Buyurtma olindi ->
// To'lov qilindi -> O'rnatish -> Tugallandi. Bosilgan bosqich ro'yxatni
// shu bosqichdagi mijozlargacha filtrlaydi.
export function CustomerStageBar({ activeStage, stages = CUSTOMER_STAGES, stageLabels = CUSTOMER_STAGE_LABELS, stageCounts = {}, onSelectStage }) {
  const total = Object.values(stageCounts).reduce((sum, n) => sum + n, 0)

  return (
    <div className="customer-stage-bar">
      <button
        type="button"
        className={classNames('customer-stage-bar__pill', !activeStage && 'customer-stage-bar__pill--active')}
        onClick={() => onSelectStage('')}
      >
        Barchasi
        <span className="customer-stage-bar__count">{total}</span>
      </button>
      {stages.map((stage) => (
        <button
          key={stage}
          type="button"
          className={classNames('customer-stage-bar__pill', activeStage === stage && 'customer-stage-bar__pill--active')}
          onClick={() => onSelectStage(stage)}
        >
          {stageLabels[stage] || stage}
          <span className="customer-stage-bar__count">{stageCounts[stage] || 0}</span>
        </button>
      ))}
    </div>
  )
}
