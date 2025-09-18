import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsPage from '../views/TabsPage.vue'

const LoginPage = () => import('../views/LoginPage.vue')

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/character' },
      { path: 'character', component: () => import('../views/CharacterPage.vue') },
      { path: 'plans', component: () => import('../views/PlansPage.vue') },
      { path: 'plan/:id', component: () => import('../views/PlanDetailPage.vue') },
      { path: 'settings', component: () => import('../views/SettingsPage.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

