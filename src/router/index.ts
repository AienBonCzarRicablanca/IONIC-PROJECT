import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import { useAuth } from '../composables/useAuth'
import type { UserRole } from '../types'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/home', redirect: '/' },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfilePage.vue'),
    meta: { requiresAuth: true, title: 'My Profile' },
  },

  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/auth/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../components/auth/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../components/auth/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../components/auth/ResetPasswordPage.vue'),
  },

  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/AdminDashboardPage.vue'),
        meta: { title: 'Front Desk Dashboard', sprint: 'Sprint 4' },
      },
      {
        path: 'inventory',
        name: 'admin-inventory',
        component: () => import('../views/admin/InventoryPage.vue'),
        meta: { title: 'Inventory', sprint: 'Sprint 4' },
      },
      {
        path: 'patients',
        name: 'admin-patients',
        component: () => import('../views/admin/PatientsPage.vue'),
        meta: { title: 'Patient Management', sprint: 'Sprint 4' },
      },
      {
        path: 'appointments',
        name: 'admin-appointments',
        component: () => import('../views/admin/AppointmentsPage.vue'),
        meta: { title: 'Appointment Calendar', sprint: 'Sprint 4' },
      },
      {
        path: 'queue',
        name: 'admin-queue',
        component: () => import('../views/admin/QueuePage.vue'),
        meta: { title: 'Queue Management', sprint: 'Sprint 4' },
      },
      {
        path: 'billing',
        name: 'admin-billing',
        component: () => import('../views/admin/BillingPage.vue'),
        meta: { title: 'Billing & Invoicing', sprint: 'Sprint 4' },
      },
      {
        path: 'messages',
        name: 'admin-messages',
        component: () => import('../views/admin/MessagesPage.vue'),
        meta: { title: 'Messages', sprint: 'Sprint 1' },
      },
    ],
  },
  {
    path: '/dentist',
    component: () => import('../layouts/DentistLayout.vue'),
    redirect: '/dentist/dashboard',
    meta: { requiresAuth: true, roles: ['dentist'] },
    children: [
      {
        path: 'dashboard',
        name: 'dentist-dashboard',
        component: () => import('../views/dentist/DentistDashboardPage.vue'),
        meta: { title: 'Dentist Dashboard', sprint: 'Sprint 5' },
      },
      {
        path: 'calendar',
        name: 'dentist-calendar',
        component: () => import('../views/dentist/DentistCalendarPage.vue'),
        meta: { title: 'My Calendar', sprint: 'Sprint 5' },
      },
      {
        path: 'patients',
        name: 'dentist-patients',
        component: () => import('../views/dentist/DentistPatientsPage.vue'),
        meta: { title: 'Assigned Patients', sprint: 'Sprint 5' },
      },
      {
        path: 'patients/:id',
        name: 'dentist-patient-chart',
        component: () => import('../views/dentist/DentistPatientPage.vue'),
        meta: { title: 'Patient Chart', sprint: 'Sprint 5' },
      },
      {
        path: 'x-rays',
        name: 'dentist-x-rays',
        component: () => import('../views/dentist/DentistFilesPage.vue'),
        meta: { title: 'Digital X-Rays', sprint: 'Sprint 5' },
      },
    ],
  },
  {
    path: '/patient',
    component: () => import('../layouts/PatientLayout.vue'),
    redirect: '/patient/dashboard',
    meta: { requiresAuth: true, roles: ['patient'] },
    children: [
      ['dashboard', 'PatientDashboardPage', 'My Dashboard'],
      ['appointments', 'PatientAppointmentsPage', 'Book an Appointment'],
      ['treatments', 'PatientTreatmentsPage', 'Treatments'],
      ['dental-chart', 'PatientChartPage', 'My Dental Chart'],
      ['payments', 'PatientPaymentsPage', 'Payment History'],
      ['braces', 'PatientBracesPage', 'Try On Braces'],
      ['notifications', 'PatientNotificationsPage', 'Notifications'],
    ].map(([path, file, title]) => ({
      path,
      name: `patient-${path}`,
      component: () => import(`../views/patient/${file}.vue`),
      meta: { title, sprint: 'Sprint 6' },
    })),
  },
  {
    path: '/superadmin',
    component: () => import('../layouts/SuperAdminLayout.vue'),
    redirect: '/superadmin/dashboard',
    meta: { requiresAuth: true, roles: ['superadmin'] },
    children: [
      {
        path: 'dashboard',
        name: 'superadmin-dashboard',
        component: () => import('../views/superadmin/OwnerDashboardPage.vue'),
        meta: { title: 'Owner Dashboard', sprint: 'Sprint 7' },
      },
      {
        path: 'analytics',
        name: 'superadmin-analytics',
        component: () => import('../views/superadmin/AnalyticsPage.vue'),
        meta: { title: 'Reports & Analytics', sprint: 'Sprint 7' },
      },
      {
        path: 'audit-logs',
        name: 'superadmin-audit-logs',
        component: () => import('../views/superadmin/AuditLogsPage.vue'),
        meta: { title: 'Audit Logs', sprint: 'Sprint 7' },
      },
      {
        path: 'patients',
        name: 'superadmin-patients',
        component: () => import('../views/admin/PatientsPage.vue'),
        meta: { title: 'Patient Management', sprint: 'Sprint 4' },
      },
      {
        path: 'staff',
        name: 'superadmin-staff',
        component: () => import('../views/superadmin/StaffPage.vue'),
        meta: { title: 'Staff Management', sprint: 'Sprint 4' },
      },
      {
        path: 'appointments',
        name: 'superadmin-appointments',
        component: () => import('../views/admin/AppointmentsPage.vue'),
        meta: { title: 'Appointment Calendar', sprint: 'Sprint 4' },
      },
      {
        path: 'queue',
        name: 'superadmin-queue',
        component: () => import('../views/admin/QueuePage.vue'),
        meta: { title: 'Queue Management', sprint: 'Sprint 4' },
      },
      {
        path: 'billing',
        name: 'superadmin-billing',
        component: () => import('../views/admin/BillingPage.vue'),
        meta: { title: 'Billing & Invoicing', sprint: 'Sprint 4' },
      },
      {
        path: 'inventory',
        name: 'superadmin-inventory',
        component: () => import('../views/admin/InventoryPage.vue'),
        meta: { title: 'Inventory', sprint: 'Sprint 4' },
      },
      {
        path: 'messages',
        name: 'superadmin-messages',
        component: () => import('../views/admin/MessagesPage.vue'),
        meta: { title: 'Messages', sprint: 'Sprint 1' },
      },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Client-side guard for UX only. Data access is enforced by Supabase RLS (Sprint 3).
router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.initialize()

  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
  const allowedRoles = to.matched.find((record) => record.meta.roles)?.meta.roles as
    | UserRole[]
    | undefined

  if (needsAuth) {
    if (!auth.isAuthenticated.value || !auth.role.value) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (allowedRoles && !allowedRoles.includes(auth.role.value)) {
      return auth.homeFor(auth.role.value)
    }
    if (auth.role.value === 'patient' && auth.requiresProfileCompletion.value && to.path !== '/profile') {
      return { path: '/profile', query: { completeProfile: '1', redirect: to.fullPath } }
    }
  }

  if (to.matched.some((record) => record.meta.guestOnly) && auth.isAuthenticated.value) {
    // A patient who left the required-profile screen is still signed in. Sending
    // them to their dashboard only bounces them back to that screen, so Sign in
    // must open the login page instead.
    if (auth.role.value === 'patient' && auth.requiresProfileCompletion.value) {
      try {
        await auth.logout()
      } catch {
        // The public sign-in page is still the right destination.
      }
      return true
    }
    return auth.homeFor(auth.role.value)
  }

  return true
})

export default router
