import { Card } from '../../../components/Card/Card'
import { EmptyState } from '../../../components/EmptyState/EmptyState'
import { SettingsIcon } from '../../../components/icons/Icons'

// Structural placeholder — the sidebar/Settings navigation for this section
// already exists (BOLD YECHIM CRM strukturasi, 1-bosqich), but the section
// itself needs its own data model + CRUD (products catalog, custom fields
// engine, CRM-wide toggles) that goes beyond a structure pass. Honest
// "not built yet" beats faking data here.
export function ComingSoonSection({ title, description }) {
  return (
    <Card title={title}>
      <EmptyState icon={<SettingsIcon width={20} height={20} />} title="Tez orada" description={description} />
    </Card>
  )
}
