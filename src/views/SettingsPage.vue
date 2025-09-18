<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>設定</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-list-header>帳號管理</ion-list-header>
        <ion-item v-if="!accounts.length">
          <ion-label>尚未建立帳號，請先從登入頁註冊。</ion-label>
        </ion-item>
        <ion-item v-for="account in accounts" :key="account.id">
          <ion-label>
            <h2>{{ account.username }}</h2>
            <p v-if="account.id === store.currentAccountId">目前使用中</p>
          </ion-label>
          <ion-button
            v-if="account.id !== store.currentAccountId"
            slot="end"
            size="small"
            fill="outline"
            @click="switchAccount(account.id)"
          >
            切換
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-button expand="block" color="medium" @click="logout" :disabled="!store.isAuthenticated">
            登出
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-list class="ion-margin-top">
        <ion-list-header>應用資訊</ion-list-header>
        <ion-item>
          <ion-label>App 版本</ion-label>
          <ion-note slot="end">{{ version }}</ion-note>
        </ion-item>
        <ion-item button detail @click="clearData">
          <ion-label color="danger">清空所有本機資料</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonButton
} from '@ionic/vue'
import { useRouter } from 'vue-router'
import { db, type Account } from '@/db'
import { useGameStore } from '@/stores/useGameStore'

const version = '0.1.0'
const store = useGameStore()
const router = useRouter()

const accounts = ref<Account[]>([])

async function loadAccounts() {
  accounts.value = await store.listAccounts()
}

async function switchAccount(id: string) {
  if (id === store.currentAccountId) return
  await store.switchAccount(id)
}

async function logout() {
  await store.logout()
  await router.replace('/login')
}

async function clearData() {
  if (confirm('確定要刪除所有角色、計畫與帳號資料嗎？')) {
    await db.delete()
    await store.logout()
    location.reload()
  }
}

onMounted(loadAccounts)
watch(() => store.currentAccountId, loadAccounts)
</script>

