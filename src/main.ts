import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'

import { createPinia } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css'

/* Theme variables */
import './theme/variables.css'

const app = createApp(App)
const pinia = createPinia()
const store = useGameStore(pinia)

app.use(IonicVue)
app.use(pinia)
app.use(router)

router.beforeEach(async (to, from, next) => {
  if (!store.initialized) {
    await store.init()
  }

  if (to.meta.requiresAuth && !store.isAuthenticated) {
    const redirectQuery = to.fullPath && to.fullPath !== '/login'
      ? { redirect: to.fullPath }
      : undefined
    next({ path: '/login', query: redirectQuery })
    return
  }

  if (to.path === '/login' && store.isAuthenticated) {
    next('/tabs/character')
    return
  }

  next()
})

router.isReady().then(async () => {
  if (!store.initialized) {
    await store.init()
  }
  app.mount('#app')
})

