import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { ProtectedRoute } from './ProtectedRoute'
import { RequirePermission } from './RequirePermission'
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout'
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { AuthStartupState } from './AuthStartupState'

const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })))
const EmployeesListPage = lazyNamed(() => import('../features/employees/pages/EmployeesListPage'), 'EmployeesListPage')
const EmployeeDetailPage = lazyNamed(() => import('../features/employees/pages/EmployeeDetailPage'), 'EmployeeDetailPage')
const SettingsPage = lazyNamed(() => import('../features/settings/pages/SettingsPage'), 'SettingsPage')
const ProfilePage = lazyNamed(() => import('../features/profile/pages/ProfilePage'), 'ProfilePage')
const MyWorkPage = lazyNamed(() => import('../features/myWork/pages/MyWorkPage'), 'MyWorkPage')
const CustomersListPage = lazyNamed(() => import('../features/customers/pages/CustomersListPage'), 'CustomersListPage')
const BusinessesListPage = lazyNamed(() => import('../features/businesses/pages/BusinessesListPage'), 'BusinessesListPage')
const BusinessDetailPage = lazyNamed(() => import('../features/businesses/pages/BusinessDetailPage'), 'BusinessDetailPage')
const LeadsListPage = lazyNamed(() => import('../features/leads/pages/LeadsListPage'), 'LeadsListPage')
const LeadDetailPage = lazyNamed(() => import('../features/leads/pages/LeadDetailPage'), 'LeadDetailPage')
const DealsListPage = lazyNamed(() => import('../features/deals/pages/DealsListPage'), 'DealsListPage')
const DealDetailPage = lazyNamed(() => import('../features/deals/pages/DealDetailPage'), 'DealDetailPage')
const QuotationsListPage = lazyNamed(() => import('../features/quotations/pages/QuotationsListPage'), 'QuotationsListPage')
const QuotationDetailPage = lazyNamed(() => import('../features/quotations/pages/QuotationDetailPage'), 'QuotationDetailPage')
const PaymentsListPage = lazyNamed(() => import('../features/payments/pages/PaymentsListPage'), 'PaymentsListPage')
const TasksListPage = lazyNamed(() => import('../features/tasks/pages/TasksListPage'), 'TasksListPage')
const ActivitiesListPage = lazyNamed(() => import('../features/activities/pages/ActivitiesListPage'), 'ActivitiesListPage')
const InstallationsListPage = lazyNamed(() => import('../features/installations/pages/InstallationsListPage'), 'InstallationsListPage')
const InstallationDetailPage = lazyNamed(() => import('../features/installations/pages/InstallationDetailPage'), 'InstallationDetailPage')
const NotificationsPage = lazyNamed(() => import('../features/notifications/NotificationsPage'), 'NotificationsPage')

function RootRedirect() {
  const { isChecking, isStartupError, isAuthenticated } = useAuth()
  if (isChecking || isStartupError) {
    return <AuthStartupState />
  }
  return <Navigate to={isAuthenticated ? '/admin' : '/login'} replace />
}

function GuestRoute() {
  const { isChecking, isStartupError, isAuthenticated } = useAuth()

  if (isChecking || isStartupError) {
    return <AuthStartupState />
  }

  if (isAuthenticated) return <Navigate to="/admin" replace />

  return <LoginPage />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestRoute />} />
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
            path="notifications"
            element={
              <RequirePermission permission="tasks.view">
                <NotificationsPage />
              </RequirePermission>
            }
          />

          <Route
            path="settings"
            element={
              <RequirePermission anyOf={['settings.view', 'programs.view']}>
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
          <Route
            path="crm/businesses/:id"
            element={
              <RequirePermission permission="businesses.view">
                <BusinessDetailPage />
              </RequirePermission>
            }
          />

          <Route
            path="crm/leads"
            element={
              <RequirePermission permission="leads.view">
                <LeadsListPage />
              </RequirePermission>
            }
          />
          <Route
            path="crm/leads/:id"
            element={
              <RequirePermission permission="leads.view">
                <LeadDetailPage />
              </RequirePermission>
            }
          />

          <Route
            path="crm/deals"
            element={
              <RequirePermission permission="deals.view">
                <DealsListPage />
              </RequirePermission>
            }
          />
          <Route
            path="crm/deals/:id"
            element={
              <RequirePermission permission="deals.view">
                <DealDetailPage />
              </RequirePermission>
            }
          />

          <Route
            path="crm/quotations"
            element={
              <RequirePermission permission="quotations.view">
                <QuotationsListPage />
              </RequirePermission>
            }
          />
          <Route
            path="crm/quotations/:id"
            element={
              <RequirePermission permission="quotations.view">
                <QuotationDetailPage />
              </RequirePermission>
            }
          />

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
          <Route
            path="crm/installations/:id"
            element={
              <RequirePermission permission="installations.view">
                <InstallationDetailPage />
              </RequirePermission>
            }
          />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
