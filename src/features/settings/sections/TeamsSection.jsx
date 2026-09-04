import { Link } from 'react-router-dom'
import { useTeams } from '../../teams/teams.hooks'
import { Card } from '../../../components/Card/Card'
import { Badge } from '../../../components/Badge/Badge'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { Alert } from '../../../components/Alert/Alert'
import { TeamIcon } from '../../../components/icons/Icons'

export function TeamsSection() {
  const { data, loading, error } = useTeams()
  const teams = data?.items ?? []

  return (
    <Card title="Jamoalar" actions={<Link to="/admin/teams">Barchasini ko‘rish →</Link>}>
      {error && (
        <Alert variant="danger" title="Jamoalarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}
      {loading && !error && (
        <div className="page-loading">
          <Spinner />
        </div>
      )}
      {!loading && !error && teams.length === 0 && (
        <EmptyState compact icon={<TeamIcon width={20} height={20} />} title="Jamoalar mavjud emas" />
      )}
      {!loading && !error && teams.length > 0 && (
        <ul className="stack">
          {teams.slice(0, 5).map((team) => (
            <li key={team.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{team.name}</span>
              <Badge variant={team.status === 'active' ? 'success' : 'gray'}>{team.status === 'active' ? 'Faol' : 'Nofaol'}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
