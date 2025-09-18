<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>計畫</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="addPlan" :disabled="!store.currentCharId">新增</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!store.currentCharId" class="ion-padding">
        <ion-text color="medium">請先建立或選擇角色，再管理計畫。</ion-text>
      </div>

      <ion-list v-else>
        <ion-item v-if="!plans.length">
          <ion-label color="medium">尚未建立計畫，點擊右上角「新增」。</ion-label>
        </ion-item>
        <ion-item v-for="plan in plans" :key="plan.id" button :router-link="`/tabs/plan/${plan.id}`">
          <ion-label>{{ plan.name }}</ion-label>
          <ion-buttons slot="end">
            <ion-button color="danger" @click.stop="removePlan(plan.id)">刪除</ion-button>
          </ion-buttons>
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
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonText
} from '@ionic/vue'
import { db, type Plan } from '@/db'
import { nanoid } from 'nanoid'
import { useGameStore } from '@/stores/useGameStore'

const store = useGameStore()
const plans = ref<Plan[]>([])

async function load() {
  if (!store.currentCharId) {
    plans.value = []
    return
  }
  plans.value = await store.listPlans()
}

async function addPlan() {
  if (!store.currentCharId) return
  const now = Date.now()
  const plan: Plan = {
    id: nanoid(),
    characterId: store.currentCharId,
    name: `新計畫 ${plans.value.length + 1}`,
    resetRule: 'daily',
    sortOrder: now,
    createdAt: now,
    updatedAt: now
  }
  await db.plans.add(plan)
  await load()
}

async function removePlan(id: string) {
  await db.plans.delete(id)
  await load()
}

onMounted(load)
watch(() => store.currentCharId, load)
</script>

