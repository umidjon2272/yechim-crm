import { useState } from 'react'
import { tasksService } from '../../../services/tasks.service'
import { leadsService } from '../../../services/leads.service'
import { dealsService } from '../../../services/deals.service'
import { activitiesService } from '../../../services/activities.service'
import { installationsService } from '../../../services/installations.service'
import { useAsync } from '../../../hooks/useAsync'
import { TaskTable } from '../../tasks/components/TaskTable'
import { LeadTable } from '../../leads/components/LeadTable'
import { DealTable } from '../../deals/components/DealTable'
import { InstallationTable } from '../../installations/components/InstallationTable'
import { Timeline } from '../../../components/Timeline/Timeline'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Alert } from '../../../components/Alert/Alert'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { classNames } from '../../../utils/classNames'
import { InboxIcon } from '../../../components/icons/Icons'

const TABS = [
  { id: 'tasks', label: 'Vazifalar' },
  { id: 'leads', label: 'Murojaatlar' },
  { id: 'deals', label: 'Savdolar' },
  { id: 'activities', label: 'Faoliyatlar' },
  { id: 'installations', label: 'O‘rnatishlar' },
]

function TabPanel({ fetcher, deps, render, emptyTitle }) {
  const { data, loading, error } = useAsync(fetcher, deps)
  const items = data?.items ?? data ?? []

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="danger" title="Yuklab bo‘lmadi">
        {error.message}
      </Alert>
    )
  }

  if (items.length === 0) {
    return <EmptyState icon={<InboxIcon width={22} height={22} />} title={emptyTitle} />
  }

  return render(items)
}

/**
 * Everything a single employee needs to see for their own day — a thin
 * "assignedToMe" view over the already-built list components, nothing new
 * fetched or rendered that doesn't already exist elsewhere in the CRM.
 */
export function MyWorkPage() {
  const [activeTab, setActiveTab] = useState('tasks')

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Mening ishlarim</h2>
          <p className="page-header__subtitle">Sizga biriktirilgan ishlar</p>
        </div>
      </div>

      <div className="view-toggle" style={{ marginBottom: 20 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={classNames('view-toggle__btn', activeTab === tab.id && 'view-toggle__btn--active')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <TabPanel
          fetcher={() => tasksService.list({ assignedToMe: true, pageSize: 50 })}
          deps={[]}
          render={(items) => <TaskTable tasks={items} />}
          emptyTitle="Sizga biriktirilgan vazifalar yo‘q"
        />
      )}

      {activeTab === 'leads' && (
        <TabPanel
          fetcher={() => leadsService.list({ assignedToMe: true, pageSize: 50 })}
          deps={[]}
          render={(items) => <LeadTable leads={items} />}
          emptyTitle="Sizga biriktirilgan murojaatlar yo‘q"
        />
      )}

      {activeTab === 'deals' && (
        <TabPanel
          fetcher={() => dealsService.list({ assignedToMe: true, pageSize: 50 })}
          deps={[]}
          render={(items) => <DealTable deals={items} />}
          emptyTitle="Sizga biriktirilgan savdolar yo‘q"
        />
      )}

      {activeTab === 'activities' && (
        <TabPanel
          fetcher={() => activitiesService.list({ assignedToMe: true, pageSize: 50 })}
          deps={[]}
          render={(items) => <Timeline items={items} />}
          emptyTitle="Sizning faoliyatingiz hali yo‘q"
        />
      )}

      {activeTab === 'installations' && (
        <TabPanel
          fetcher={() => installationsService.list({ assignedToMe: true, pageSize: 50 })}
          deps={[]}
          render={(items) => <InstallationTable installations={items} />}
          emptyTitle="Sizga biriktirilgan o‘rnatishlar yo‘q"
        />
      )}
    </div>
  )
}
