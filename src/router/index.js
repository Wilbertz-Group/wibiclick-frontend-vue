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
import EmployeesView from '@/views/Employees/View.vue'
import Jobs from '@/views/Jobs/Jobs.vue'
import AddJobs from '@/views/Jobs/Add.vue'
import Customers from '@/views/Customers/Customers.vue'
import CustomerView from '@/views/Customers/View.vue'
import CustomersAdd from '@/views/Customers/Add.vue'
import Invoices from '@/views/Invoices/Invoices.vue'
import AddInvoices from '@/views/Invoices/Add.vue'
import EditInvoices from '@/views/Invoices/Edit.vue'
import ViewInvoices from '@/views/Invoices/View.vue'
import Estimates from '@/views/Estimates/Estimates.vue'
import AddEstimates from '@/views/Estimates/Add.vue'
import ViewEstimates from '@/views/Estimates/View.vue'
import EditEstimates from '@/views/Estimates/Edit.vue'
import Visitors from '@/views/Visitors/Visitors.vue'
import Forms from '@/views/Forms/Forms.vue'
import Pages from '@/views/Pages/Pages.vue'
import Feedback from '@/views/Feedback.vue'
import Billing from '@/views/Billing.vue'
import Settings from '@/views/Settings.vue'
import Authenticate from '@/views/Authenticate.vue'
import { useUserStore } from "@/stores/UserStore" 
import Reports from '@/views/Insurance/Reports.vue'
import AddReport from '@/views/Insurance/Add.vue'
import ViewReport from '@/views/Insurance/View.vue'
import EditReport from '@/views/Insurance/Edit.vue'
import Suppliers from '@/views/Suppliers/Suppliers.vue'
import AddSuppliers from '@/views/Suppliers/Add.vue'
import Notes from '@/views/Notes/Notes.vue'
import PaymentsList from '@/views/payments/PaymentsList.vue'
import AddPayment from '@/views/payments/AddPayment.vue'
import EditPayment from '@/views/payments/EditPayment.vue'
import ViewPayment from '@/views/payments/ViewPayment.vue'
import ExpensesList from '@/views/Expenses/ExpensesList.vue'
import AddExpense from '@/views/Expenses/AddExpense.vue'
import EditExpense from '@/views/Expenses/EditExpense.vue'
import ViewExpense from '@/views/Expenses/ViewExpense.vue'

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
      component: Snippet,
      meta: {permission: ['owner', 'admin']}
    },
    {
      path: '/billing',
      name: 'billing',
      component: Billing
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: {permission: ['owner', 'admin']}
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
      component: Users,
      meta: {permission: ['owner', 'admin']}
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
      path: '/employee',
      name: 'employee',
      component: EmployeesView
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
      path: '/contacts',
      name: 'contacts',
      component: Customers
    },
    {
      path: '/contact',
      name: 'contact',
      component: CustomerView
    },
    {
      path: '/add-customer',
      name: 'add-customer',
      component: CustomersAdd
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: Invoices
    },
    {
      path: '/add-invoice',
      name: 'add-invoice',
      component: AddInvoices
    },
    {
      path: '/edit-invoice',
      name: 'edit-invoice',
      component: EditInvoices
    },
    {
      path: '/view-invoice',
      name: 'view-invoice',
      component: ViewInvoices
    },
    {
      path: '/estimates',
      name: 'estimates',
      component: Estimates 
    },
    {
      path: '/add-estimate',
      name: 'add-estimate',
      component: AddEstimates
    },
    {
      path: '/view-estimate',
      name: 'view-estimate',
      component: ViewEstimates
    },
    {
      path: '/edit-estimate',
      name: 'edit-estimate',
      component: EditEstimates
    },
    {
      path: '/visitors',
      name: 'visitors',
      component: Visitors,
      meta: {permission: ['owner', 'admin']}
    },
    {
      path: '/pages',
      name: 'pages',
      component: Pages,
      meta: {permission: ['owner', 'admin']}
    },
    {
      path: '/forms',
      name: 'forms',
      component: Forms,
      meta: { permission: ['owner', 'admin']}
    },
    {
      path: '/insurance-reports',
      name: 'insurance-reports',
      component: Reports 
    },
    {
      path: '/add-insurance-report',
      name: 'add-insurance-report',
      component: AddReport
    },
    {
      path: '/view-insurance-report',
      name: 'view-insurance-report',
      component: ViewReport
    },
    {
      path: '/edit-insurance-report',
      name: 'edit-insurance-report',
      component: EditReport
    },
    {
      path: '/suppliers',
      name: 'suppliers',
      component: Suppliers 
    },
    {
      path: '/add-supplier',
      name: 'add-supplier',
      component: AddSuppliers
    },
    {
      path: '/notes',
      name: 'notes',
      component: Notes
    },
    {
      path: '/payments',
      name: 'payments-list',
      component: PaymentsList,
    },
    {
      path: '/add-payment',
      name: 'add-payment',
      component: AddPayment,
    },
    {
      path: '/edit-payment',
      name: 'edit-payment',
      component: EditPayment,
    },
    {
      path: '/view-payment',
      name: 'view-payment',
      component: ViewPayment,
    },
    {
      path: '/expenses',
      name: 'expenses-list',
      component: ExpensesList,
    },
    {
      path: '/add-expense',
      name: 'add-expense',
      component: AddExpense,
    },
    {
      path: '/edit-expense',
      name: 'edit-expense',
      component: EditExpense,
    },
    {
      path: '/view-expense',
      name: 'view-expense',
      component: ViewExpense,
    },
  ]
}) 

router.beforeEach((to, from, next) => {
  // redirect to login page if user is not logged in and trying to access a restricted page
  const publicPages = ['/authenticate', '/', '/terms-of-service', '/privacy-policy']
  const authRequired = !publicPages.includes(to.path)
  const loggedIn = localStorage.getItem('user')
  const userStore = useUserStore()

  if (authRequired && !loggedIn) {
    userStore.$reset()
    localStorage.removeItem('user')
    localStorage.removeItem('UserStore')
    return next('/authenticate')
  }

  if (to.meta?.permission != undefined){
    if (to.meta?.permission.includes('owner') && userStore.user.permission != 'owner') {
      return next('/')
    }

    if (to.meta?.permission.includes('admin') && (userStore.user.permission != 'admin' && userStore.user.permission != 'owner')) {
      return next('/')
    }

    if (to.meta?.permission.includes('manager') && (userStore.user.permission != 'admin' && userStore.user.permission != 'owner' && userStore.user.permission != 'manager')) {
      return next('/')
    }
  }

  next()
})

export default router
