import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTeam } from '../teams.hooks'
import { teamsService } from '../../../services/teams.service'
import { employeesService } from '../../../services/employees.service'
import { TeamForm } from '../components/TeamForm'
import { Card } from '../../../components/Card/Card'
import { Button } from '../../../components/Button/Button'
import { Badge } from '../../../components/Badge/Badge'
import { Select } from '../../../components/Select/Select'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { PermissionGate } from '../../roles/PermissionGate'
import { useAction } from '../../../hooks/useAction'
import { useConfirm } from '../../../store/ConfirmContext'
import { useToast } from '../../../store/ToastContext'
import { PlusIcon, UsersIcon } from '../../../components/icons/Icons'
import './TeamDetailPage.scss'

export function TeamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'
  const confirm = useConfirm()
  const toast = useToast()

  const { data: team, loading, error, refetch } = useTeam(id)
  const updateAction = useAction((values) => teamsService.update(id, values))
  const deleteAction = useAction(() => teamsService.remove(id))
  const addMemberAction = useAction((members) => teamsService.update(id, { members, membersCount: members.length }))
  const removeMemberAction = useAction((members) => teamsService.update(id, { members, membersCount: members.length }))
  const [employees, setEmployees] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')

  useEffect(() => {
    employeesService
      .list({ pageSize: 100 })
      .then((res) => setEmployees((res?.items ?? []).filter((e) => e.status === 'active')))
      .catch(() => setEmployees([]))
  }, [])

  const handleUpdate = async (values) => {
    try {
      await updateAction.run(values)
      toast.success('Jamoa yangilandi')
      setSearchParams({})
      refetch()
    } catch (err) {
      toast.error(err.message || 'Yangilashda xatolik yuz berdi')
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Jamoani o‘chirish',
      description: `"${team?.name}" jamoasini o‘chirmoqchimisiz? Bu amalni ortga qaytarib bo‘lmaydi.`,
      confirmLabel: 'O‘chirish',
      danger: true,
    })
    if (!ok) return

    try {
      await deleteAction.run()
      toast.success('Jamoa o‘chirildi')
      navigate('/admin/teams')
    } catch (err) {
      toast.error(err.message || 'O‘chirishda xatolik yuz berdi')
    }
  }

  const handleAddMember = async () => {
    if (!selectedEmployeeId) return
    const employee = employees.find((e) => e.id === selectedEmployeeId)
    if (!employee) return
    const nextMembers = [...(team.members ?? []), { id: employee.id, name: employee.name }]
    try {
      await addMemberAction.run(nextMembers)
      toast.success('Xodim jamoaga qo‘shildi')
      setSelectedEmployeeId('')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Xodim qo‘shishda xatolik yuz berdi')
    }
  }

  const handleRemoveMember = async (member) => {
    const ok = await confirm({
      title: 'Xodimni jamoadan chiqarish',
      description: `${member.name} jamoadan chiqarilsinmi?`,
      confirmLabel: 'Chiqarish',
      danger: true,
    })
    if (!ok) return
    const nextMembers = (team.members ?? []).filter((m) => m.id !== member.id)
    try {
      await removeMemberAction.run(nextMembers)
      toast.success('Xodim jamoadan chiqarildi')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Xodimni chiqarishda xatolik yuz berdi')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <Alert variant="danger" title="Jamoa topilmadi">
        {error?.message || 'Bu jamoa mavjud emas yoki o‘chirilgan.'}
      </Alert>
    )
  }

  const memberIds = new Set((team.members ?? []).map((m) => m.id))
  const availableEmployees = employees.filter((e) => !memberIds.has(e.id))

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2 className="page-header__title">{team.name}</h2>
          <p className="page-header__subtitle">
            <Badge variant={team.status === 'active' ? 'success' : 'gray'}>{team.status === 'active' ? 'Faol' : 'Nofaol'}</Badge>
          </p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" onClick={() => navigate('/admin/teams')}>
            Ortga
          </Button>
          <PermissionGate permission="teams.edit">
            <Button variant="secondary" onClick={() => setSearchParams({ edit: '1' })}>
              Tahrirlash
            </Button>
          </PermissionGate>
          <PermissionGate permission="teams.delete">
            <Button variant="danger" loading={deleteAction.loading} onClick={handleDelete}>
              O‘chirish
            </Button>
          </PermissionGate>
        </div>
      </div>

      {isEditing ? (
        <Card title="Jamoani tahrirlash">
          <TeamForm
            initialValues={team}
            submitLabel="Saqlash"
            loading={updateAction.loading}
            onSubmit={handleUpdate}
            onCancel={() => setSearchParams({})}
          />
        </Card>
      ) : (
        <div className="detail-grid">
          <Card title="Tavsif">
            <p className="text-muted">{team.description || 'Tavsif kiritilmagan'}</p>
          </Card>
          <Card title="Jamoa rahbari">
            <p>{team.lead?.name || 'Tayinlanmagan'}</p>
          </Card>
        </div>
      )}

      <Card title="A'zolar">
        <PermissionGate permission="teams.edit">
          <div className="team-members__add">
            <Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} disabled={addMemberAction.loading}>
              <option value="">Xodim tanlang</option>
              {availableEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
            <Button size="sm" loading={addMemberAction.loading} disabled={!selectedEmployeeId} onClick={handleAddMember}>
              <PlusIcon width={16} height={16} /> Xodim qo‘shish
            </Button>
          </div>
        </PermissionGate>

        {team.members?.length > 0 ? (
          <ul className="team-members__list">
            {team.members.map((member) => (
              <li key={member.id} className="team-members__item">
                <span>{member.name}</span>
                <PermissionGate permission="teams.edit">
                  <button
                    type="button"
                    className="dropdown__item dropdown__item--danger"
                    style={{ width: 'auto' }}
                    onClick={() => handleRemoveMember(member)}
                    disabled={removeMemberAction.loading}
                  >
                    Chiqarish
                  </button>
                </PermissionGate>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={<UsersIcon width={20} height={20} />}
            title="A'zolar yo‘q"
            description="Bu jamoaga hali xodim biriktirilmagan."
          />
        )}
      </Card>
    </div>
  )
}
