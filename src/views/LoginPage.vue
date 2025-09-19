<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ mode === 'login' ? '登入' : '建立帳號' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ion-text-center ion-margin-bottom">
        <ion-segment :value="mode" @ionChange="onModeChange($event.detail.value)">
          <ion-segment-button value="login">
            <ion-label>登入</ion-label>
          </ion-segment-button>
          <ion-segment-button value="register">
            <ion-label>註冊</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <form @submit.prevent="handleSubmit">
        <ion-list>
          <ion-item>
            <ion-input
              v-model="username"
              label="帳號"
              label-placement="floating"
              autocomplete="username"
              inputmode="text"
              required
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="password"
              label="密碼"
              label-placement="floating"
              type="password"
              autocomplete="current-password"
              required
            />
          </ion-item>
          <ion-item v-if="mode === 'register'">
            <ion-input
              v-model="confirmPassword"
              label="確認密碼"
              label-placement="floating"
              type="password"
              autocomplete="new-password"
              required
            />
          </ion-item>
        </ion-list>

        <ion-text color="danger" v-if="errorMessage">
          <p class="ion-padding-start ion-padding-top">{{ errorMessage }}</p>
        </ion-text>

        <ion-button type="submit" expand="block" :disabled="loading">
          {{ loading ? '處理中…' : mode === 'login' ? '登入' : '建立帳號' }}
        </ion-button>

        <ion-note class="ion-margin-top">
          提示：DEMO 帳號／密碼為 <code>demo</code>／<code>demo</code>
        </ion-note>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonNote
} from '@ionic/vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/useGameStore'

type AuthMode = 'login' | 'register'

const store = useGameStore()
const router = useRouter()
const route = useRoute()

const mode = ref<AuthMode>('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirectTarget = computed(() => (route.query.redirect as string) || '/tabs/character')

function onModeChange(value: any) {
  mode.value = value as AuthMode
  errorMessage.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!username.value || !password.value) {
    errorMessage.value = '請輸入帳號與密碼'
    return
  }
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  loading.value = true
  try {
    if (mode.value === 'login') {
      await store.login(username.value, password.value)
    } else {
      await store.register(username.value, password.value)
    }
    await router.replace(redirectTarget.value)
  } catch (error: any) {
    if (error?.message === 'INVALID_CREDENTIALS') {
      errorMessage.value = '帳號或密碼錯誤'
    } else if (error?.message === 'USERNAME_EXISTS') {
      errorMessage.value = '帳號已存在，請改用其他帳號'
    } else if (error?.message === 'USERNAME_OR_PASSWORD_EMPTY') {
      errorMessage.value = '請輸入帳號與密碼'
    } else {
      errorMessage.value = '發生未知錯誤，請稍後再試'
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

code {
  font-family: monospace;
}
</style>

