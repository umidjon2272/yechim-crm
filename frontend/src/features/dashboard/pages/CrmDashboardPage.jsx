import { Link } from 'react-router-dom'
import { analyticsService } from '../../../services/analytics.service'
import { leadsService } from '../../../services/leads.service'
import { dealsService } from '../../../services/deals.service'
import { paymentsService } from '../../../services/payments.service'
import { installationsService } from '../../../services/installations.service'
import { tasksService } from '../../../services/tasks.service'
import { DEAL_STAGE_LABELS } from '../../deals/deals.constants'
import { useAsync } from '../../../hooks/useAsync'
import { StatCard } from '../../../components/charts/StatCard'
import { BarChart } from '../../../components/charts/BarChart'
import { DonutChart } from '../../../components/charts/DonutChart'
import { RelatedList } from '../../../components/RelatedList/RelatedList'
import { Card } from '../../../components/Card/Card'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { PermissionGate } from '../../roles/PermissionGate'
import {
  DashboardIcon,
  UsersIcon,
  BuildingIcon,
  TeamIcon,
  InboxIcon,
} from '../../../components/icons/Icons'

function ChartCard({ title, loading, error, empty, children }) {
  return (
    <Card title={title}>
      {loading && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}
      {!loading && (error || empty) && <EmptyState compact icon={<InboxIcon width={20} height={20} />} title="Ma’lumot yo‘q" />}
      {!loading && !error && !empty && children}
    </Card>
  )
}

export function CrmDashboardPage() {
  const summary = useAsync(() => analyticsService.getDashboardSummary(), [])
  const leadsByStatus = useAsync(() => analyticsService.getLeadsByStatus(), [])
  const dealsByStage = useAsync(() => analyticsService.getDealsByStage(), [])
  const revenue = useAsync(() => analyticsService.getRevenue(), [])
  const installationsByStatus = useAsync(() => analyticsService.getInstallationsByStatus(), [])

  const s = summary.data || {}

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">CRM statistikasi</h2>
          <p className="page-header__subtitle">Sotuv va operatsion ko‘rsatkichlar</p>
        </div>
      </div>

      {summary.error && (
        <Alert variant="danger" title="Statistikani yuklab bo‘lmadi">
          {summary.error.message}
        </Alert>
      )}

      <div className="stat-card-grid">
        <StatCard label="Jami murojaatlar" value={s.totalLeads} icon={<InboxIcon width={20} height={20} />} loading={summary.loading} />
        <StatCard label="Faol savdolar" value={s.activeDeals} icon={<BuildingIcon width={20} height={20} />} variant="info" loading={summary.loading} />
        <StatCard label="Yutilgan savdolar" value={s.wonDeals} icon={<DashboardIcon width={20} height={20} />} variant="success" loading={summary.loading} />
        <PermissionGate permission="profit.view">
          <StatCard label="Tushum" value={s.revenue} icon={<DashboardIcon width={20} height={20} />} variant="gold" loading={summary.loading} />
        </PermissionGate>
        <StatCard label="Kutilayotgan to‘lovlar" value={s.pendingPayments} icon={<InboxIcon width={20} height={20} />} variant="warning" loading={summary.loading} />
        <StatCard label="O‘rnatishlar" value={s.installations} icon={<TeamIcon width={20} height={20} />} loading={summary.loading} />
        <StatCard label="Vazifalar" value={s.tasks} icon={<UsersIcon width={20} height={20} />} loading={summary.loading} />
      </div>

      <div className="detail-grid">
        <ChartCard title="Holat bo‘yicha murojaatlar" loading={leadsByStatus.loading} error={leadsByStatus.error} empty={!leadsByStatus.data?.length}>
          <BarChart data={(leadsByStatus.data ?? []).map((d) => ({ label: d.status, value: d.count }))} />
        </ChartCard>
        <ChartCard title="Savdo jarayoni" loading={dealsByStage.loading} error={dealsByStage.error} empty={!dealsByStage.data?.length}>
          <BarChart data={(dealsByStage.data ?? []).map((d) => ({ label: d.stage, value: d.count }))} />
        </ChartCard>
        <PermissionGate permission="profit.view">
          <ChartCard title="Tushum" loading={revenue.loading} error={revenue.error} empty={!revenue.data?.length}>
            <BarChart data={(revenue.data ?? []).map((d) => ({ label: d.period, value: d.amount }))} />
          </ChartCard>
        </PermissionGate>
        <ChartCard
          title="O‘rnatishlar"
          loading={installationsByStatus.loading}
          error={installationsByStatus.error}
          empty={!installationsByStatus.data?.length}
        >
          <DonutChart data={(installationsByStatus.data ?? []).map((d) => ({ label: d.status, value: d.count }))} />
        </ChartCard>
      </div>

      <div className="detail-grid">
        <RelatedList
          title="So‘nggi murojaatlar"
          fetcher={() => leadsService.list({ sort: '-createdAt', pageSize: 5 })}
          deps={[]}
          linkTo={(item) => `/admin/crm/leads/${item.id}`}
          renderItem={(item) => <span>{item.title} — {item.customer?.name}</span>}
          emptyHint="Hozircha murojaat yo‘q."
        />
        <RelatedList
          title="So‘nggi savdolar"
          fetcher={() => dealsService.list({ sort: '-createdAt', pageSize: 5 })}
          deps={[]}
          linkTo={(item) => `/admin/crm/deals/${item.id}`}
          renderItem={(item) => <span>{item.name} — {DEAL_STAGE_LABELS[item.stage] || item.stage}</span>}
          emptyHint="Hozircha savdo yo‘q."
        />
        <RelatedList
          title="Kutilayotgan to‘lovlar"
          fetcher={() => paymentsService.list({ status: 'PENDING', pageSize: 5 })}
          deps={[]}
          renderItem={(item) => <span>{item.customer?.name || item.deal?.name} — {item.amount}</span>}
          emptyHint="Kutilayotgan to‘lovlar yo‘q."
        />
        <RelatedList
          title="Yaqin o‘rnatishlar"
          fetcher={() => installationsService.list({ status: 'SCHEDULED', sort: 'scheduledDate', pageSize: 5 })}
          deps={[]}
          linkTo={(item) => `/admin/crm/installations/${item.id}`}
          renderItem={(item) => <span>{item.address} — {item.scheduledDate || 'sana belgilanmagan'}</span>}
          emptyHint="Rejalashtirilgan o‘rnatish yo‘q."
        />
        <RelatedList
          title="Mening vazifalarim"
          fetcher={() => tasksService.list({ assignedToMe: true, pageSize: 5 })}
          deps={[]}
          renderItem={(item) => <span>{item.title}</span>}
          emptyHint="Sizga biriktirilgan vazifa yo‘q."
          action={
            <Link to="/admin/my-work" className="dropdown__item" style={{ width: 'auto', padding: 0 }}>
              Barchasi →
            </Link>
          }
        />
      </div>
    </div>
  )
}
