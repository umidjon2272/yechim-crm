import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { ProtectedRoute } from './ProtectedRoute'
import { RequirePermission } from './RequirePermission'
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout'
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { EmployeesListPage } from '../features/employees/pages/EmployeesListPage'
import { EmployeeDetailPage } from '../features/employees/pages/EmployeeDetailPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { MyWorkPage } from '../features/myWork/pages/MyWorkPage'
import { CustomersListPage } from '../features/customers/pages/CustomersListPage'
import { BusinessesListPage } from '../features/businesses/pages/BusinessesListPage'
import { BusinessDetailPage } from '../features/businesses/pages/BusinessDetailPage'
import { LeadsListPage } from '../features/leads/pages/LeadsListPage'
import { LeadDetailPage } from '../features/leads/pages/LeadDetailPage'
import { DealsListPage } from '../features/deals/pages/DealsListPage'
import { DealDetailPage } from '../features/deals/pages/DealDetailPage'
import { QuotationsListPage } from '../features/quotations/pages/QuotationsListPage'
import { QuotationDetailPage } from '../features/quotations/pages/QuotationDetailPage'
import { PaymentsListPage } from '../features/payments/pages/PaymentsListPage'
import { TasksListPage } from '../features/tasks/pages/TasksListPage'
import { ActivitiesListPage } from '../features/activities/pages/ActivitiesListPage'
import { InstallationsListPage } from '../features/installations/pages/InstallationsListPage'
import { InstallationDetailPage } from '../features/installations/pages/InstallationDetailPage'
import { Spinner } from '../components/Spinner/Spinner'

function RootRedirect() {
  const { isChecking, isAuthenticated } = useAuth()
  if (isChecking) {
    return (
      <div className="full-page-loading">
        <Spinner size="lg" />
      </div>
    )
  }
  return <Navigate to={isAuthenticated ? '/admin' : '/login'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          {/* Mijoz — CRM'ning markazi: kirilgan zahoti to'g'ridan-to'g'ri
              Mijozlar ro'yxatiga tushiladi, alohida statistik boshqaruv
              paneli emas (BOLD YECHIM CRM strukturasi, 1-bosqich). */}
          <Route index element={<Navigate to="crm/customers" replace />} />

          <Route
            path="employees"
            element={
              <RequirePermission permission="employees.view">
                <EmployeesListPage />
              </RequirePermission>
            }
          />
          <Route
            path="employees/:id"
            element={
              <RequirePermission permission="employees.view">
                <EmployeeDetailPage />
              </RequirePermission>
            }
          />

          <Route path="profile" element={<ProfilePage />} />

          <Route path="my-work" element={<MyWorkPage />} />

          <Route
            path="settings"
            element={
              <RequirePermission permission="settings.view">
                <SettingsPage />
              </RequirePermission>
            }
          />

          {/* CRM business flow: Customer -> Business -> Lead -> Deal ->
              Deal Items -> Quotation -> Payment -> Installation -> Activity/Task */}
          {/* Bitrix-style: the customer workspace is an overlay on top of
              this same list (see CustomerWorkspace), not a separate route
              component — crm/customers/:id renders the identical list page,
              which reads the :id param itself and opens the workspace
              drawer over it. */}
          <Route
            path="crm/customers"
            element={
              <RequirePermission permission="customers.view">
                <CustomersListPage />
              </RequirePermission>
            }
          />
          <Route
            path="crm/customers/:id"
            element={
              <RequirePermission permission="customers.view">
                <CustomersListPage />
              </RequirePermission>
            }
          />

          <Route
            path="crm/businesses"
            element={
              <RequirePermission permission="businesses.view">
                <BusinessesListPage />
              </RequirePermission>
            }
          />
          <Route path="crm/businesses/:id" element={<BusinessDetailPage />} />

          <Route
            path="crm/leads"
            element={
              <RequirePermission permission="leads.view">
                <LeadsListPage />
              </RequirePermission>
            }
          />
          <Route path="crm/leads/:id" element={<LeadDetailPage />} />

          <Route
            path="crm/deals"
            element={
              <RequirePermission permission="deals.view">
                <DealsListPage />
              </RequirePermission>
            }
          />
          <Route path="crm/deals/:id" element={<DealDetailPage />} />

          <Route
            path="crm/quotations"
            element={
              <RequirePermission permission="quotations.view">
                <QuotationsListPage />
              </RequirePermission>
            }
          />
          <Route path="crm/quotations/:id" element={<QuotationDetailPage />} />

          <Route
            path="crm/payments"
            element={
              <RequirePermission permission="payments.view">
                <PaymentsListPage />
              </RequirePermission>
            }
          />

          <Route
            path="tasks"
            element={
              <RequirePermission permission="tasks.view">
                <TasksListPage />
              </RequirePermission>
            }
          />
          <Route path="crm/tasks" element={<Navigate to="/admin/tasks" replace />} />

          <Route
            path="crm/activities"
            element={
              <RequirePermission permission="activities.view">
                <ActivitiesListPage />
              </RequirePermission>
            }
          />

          <Route
            path="crm/installations"
            element={
              <RequirePermission permission="installations.view">
                <InstallationsListPage />
              </RequirePermission>
            }
          />
          <Route path="crm/installations/:id" element={<InstallationDetailPage />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
