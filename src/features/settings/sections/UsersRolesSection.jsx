import { useState } from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { rolesService } from '../../../services/roles.service'
import { Card } from '../../../components/Card/Card'
import { Alert } from '../../../components/Alert/Alert'
import { Spinner } from '../../../components/Spinner/Spinner'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { PermissionMatrix } from '../../roles/components/PermissionMatrix'
import { SettingsIcon } from '../../../components/icons/Icons'
import { ROLE_LABELS } from '../../roles/permissions'

export function UsersRolesSection() {
  const { data, loading, error } = useAsync(() => rolesService.list(), [])
  const [expandedId, setExpandedId] = useState(null)
  const roles = data?.items ?? []

  return (
    <Card title="Ruxsatlar">
      <p className="text-muted" style={{ marginBottom: 16 }}>
        Tizim faqat ADMIN va EMPLOYEE rollaridan foydalanadi. Xodimga kerakli ruxsatlar xodim profilida belgilanadi.
      </p>
      {error && <Alert variant="danger" title="Ruxsatlarni yuklab bo'lmadi">{error.message}</Alert>}
      {loading && !error && <div className="page-loading"><Spinner /></div>}
      {!loading && !error && roles.length === 0 && <EmptyState compact icon={<SettingsIcon width={20} height={20} />} title="Rollar topilmadi" />}
      {!loading && !error && roles.length > 0 && (
        <div className="stack">
          {roles.map((role) => (
            <div key={role.id}>
              <button type="button" className="settings-nav__item" onClick={() => setExpandedId(expandedId === role.id ? null : role.id)}>
                {ROLE_LABELS[role.name] || role.name}
              </button>
              {expandedId === role.id && <div style={{ overflowX: 'auto', marginTop: 8 }}><PermissionMatrix value={role.permissions ?? []} /></div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
