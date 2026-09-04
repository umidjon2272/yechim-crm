import { Card } from '../../../components/Card/Card'
import { FormField } from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import { Button } from '../../../components/Button/Button'

// Foundation placeholder — real fields/persistence wire up once the backend
// exposes a company/workspace settings endpoint.
export function GeneralSection() {
  return (
    <Card title="Umumiy sozlamalar">
      <FormField label="Kompaniya nomi" hint="Backend tayyor bo‘lgach ushbu maydon saqlanadi">
        <Input placeholder="YECHIM" disabled />
      </FormField>
      <FormField label="Vaqt mintaqasi">
        <Input placeholder="Asia/Tashkent" disabled />
      </FormField>
      <Button disabled>Saqlash</Button>
    </Card>
  )
}
