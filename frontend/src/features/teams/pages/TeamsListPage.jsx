import { useNavigate } from 'react-router-dom'
import { useTeams } from '../teams.hooks'
import { teamsService } from '../../../services/teams.service'
import { TeamForm } from '../components/TeamForm'
import { Button } from '../../../components/Button/Button'
import { Badge } from '../../../components/Badge/Badge'
import { Modal } from '../../../components/Modal/Modal'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAction } from '../../../hooks/useAction'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { useToast } from '../../../store/ToastContext'
import { PlusIcon, TeamIcon } from '../../../components/icons/Icons'
import './TeamsListPage.scss'

export function TeamsListPage() {
  const { data, loading, error, refetch } = useTeams()
  const { isOpen, open, close } = useDisclosure()
  const createAction = useAction(teamsService.create)
  const toast = useToast()
  const navigate = useNavigate()

  const teams = data?.items ?? []

  const handleCreate = async (values) => {
    try {
      await createAction.run(values)
      toast.success('Jamoa yaratildi')
      close()
      refetch()
    } catch (err) {
      toast.error(err.message || 'Jamoa yaratishda xatolik yuz berdi')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Jamoalar</h2>
          <p className="page-header__subtitle">Jamoalarni boshqarish</p>
        </div>
        <PermissionGate permission="teams.create">
          <Button onClick={open}>
            <PlusIcon width={16} height={16} /> Yangi jamoa
          </Button>
        </PermissionGate>
      </div>

      {error && (
        <Alert variant="danger" title="Jamoalarni yuklab bo‘lmadi">
          {error.message}
        </Alert>
      )}

      {loading && !error && (
        <div className="page-loading">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && teams.length === 0 && (
        <EmptyState
          icon={<TeamIcon width={22} height={22} />}
          title="Jamoalar mavjud emas"
          description="Kompaniyangiz uchun birinchi jamoani yarating (masalan: Sales, Support, Installation)."
        />
      )}

      {!loading && !error && teams.length > 0 && (
        <div className="team-grid">
          {teams.map((team) => (
            <div key={team.id} className="team-card" onClick={() => navigate(`/admin/teams/${team.id}`)}>
              <div className="team-card__header">
                <span className="team-card__name">{team.name}</span>
                <Badge variant={team.status === 'active' ? 'success' : 'gray'}>{team.status === 'active' ? 'Faol' : 'Nofaol'}</Badge>
              </div>
              <p className="team-card__description">{team.description || 'Tavsif kiritilmagan'}</p>
              <div className="team-card__footer">
                <span className="team-card__members">{team.membersCount ?? 0} a'zo</span>
                <span>{team.lead?.name ? `Rahbar: ${team.lead.name}` : 'Rahbar tayinlanmagan'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isOpen} title="Yangi jamoa yaratish" onClose={close}>
        <TeamForm submitLabel="Yaratish" loading={createAction.loading} onSubmit={handleCreate} onCancel={close} />
      </Modal>
    </div>
  )
}
