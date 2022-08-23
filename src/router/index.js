import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Dashboard from '@/views/Dashboard.vue'
import Profile from '@/views/Profile.vue'
import Snippet from '@/views/Snippet.vue'
import Terms from '@/views/Terms.vue'
import Users from '@/views/Users.vue'
import Privacy from '@/views/Privacy.vue'
import Technicians from '@/views/Technicians.vue'
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
      path: '/tech-portal',
      name: 'tech-portal',
      component: Technicians
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
