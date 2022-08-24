import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Dashboard from '@/views/Dashboard.vue'
import Profile from '@/views/Profile.vue'
import Snippet from '@/views/Snippet.vue'
import Terms from '@/views/Terms.vue'
import Users from '@/views/Users.vue'
import Privacy from '@/views/Privacy.vue'
import Employees from '@/views/Employees/Employees.vue'
import EmployeesAdd from '@/views/Employees/Add.vue'
import Jobs from '@/views/Jobs/Jobs.vue'
import AddJobs from '@/views/Jobs/Add.vue'
import Customers from '@/views/Customers/Customers.vue'
import Invoices from '@/views/Invoices/Invoices.vue'
import Visitors from '@/views/Visitors/Visitors.vue'
import Forms from '@/views/Forms/Forms.vue'
import Pages from '@/views/Pages/Pages.vue'
import Feedback from '@/views/Feedback.vue'
import Billing from '@/views/Billing.vue'
import Settings from '@/views/Settings.vue'
import Authenticate from '@/views/Authenticate.vue'
import { useUserStore } from "@/stores/UserStore" 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/authenticate',
      name: 'authenticate',
      component: Authenticate
    },
    {
      path: '/snippet',
      name: 'snippet',
      component: Snippet
    },
    {
      path: '/billing',
      name: 'billing',
      component: Billing
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings
    },
    {
      path: '/terms-of-service',
      name: 'terms',
      component: Terms
    },
    {
      path: '/privacy-policy',
      name: 'privacy',
      component: Privacy
    },
    {
      path: '/users',
      name: 'users',
      component: Users
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: Feedback
    },
    {
      path: '/employees',
      name: 'employees',
      component: Employees
    },
    {
      path: '/add-employee',
      name: 'add-employee',
      component: EmployeesAdd
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: Jobs
    },
    {
      path: '/add-job',
      name: 'add-job',
      component: AddJobs
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: Invoices
    },
    {
      path: '/visitors',
      name: 'visitors',
      component: Visitors
    },
    {
      path: '/pages',
      name: 'pages',
      component: Pages
    },
    {
      path: '/forms',
      name: 'forms',
      component: Forms
    },
  ]
})

router.beforeEach((to, from, next) => {
  // redirect to login page if user is not logged in and trying to access a restricted page
  const publicPages = ['/authenticate', '/', '/terms-of-service', '/privacy-policy']
  const authRequired = !publicPages.includes(to.path)
  const loggedIn = localStorage.getItem('user')

  if (authRequired && !loggedIn) {
    useUserStore().$reset()
    localStorage.removeItem('user')
    localStorage.removeItem('UserStore')
    return next('/authenticate')
  }

  next()
})

export default router
