<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ plan?.name ?? '計畫' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="!store.currentCharId" class="ion-padding">
        <ion-text color="medium">請先選擇角色，再查看計畫內容。</ion-text>
      </div>

      <div v-else-if="!plan" class="ion-padding">
        <ion-text color="medium">找不到這個計畫，請返回計畫列表。</ion-text>
      </div>

      <ion-list v-else>
        <ion-item v-for="task in tasks" :key="task.id">
          <ion-checkbox
            slot="start"
            :checked="doneMap[task.id]"
            @ionChange="toggle(task, $event.detail.checked)"
          />
          <ion-label>{{ task.name }}</ion-label>
          <ion-badge slot="end">{{ rewardText(task.reward) }}</ion-badge>
          <ion-button size="small" fill="clear" @click="undo(task.id)">撤銷</ion-button>
        </ion-item>
        <div class="ion-padding">
          <ion-button expand="block" @click="addTask">新增任務</ion-button>
        </div>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonCheckbox,
  IonText
} from '@ionic/vue'
import { db, type Plan, type Task, type Reward } from '@/db'
import { nanoid } from 'nanoid'
import { useGameStore } from '@/stores/useGameStore'

const route = useRoute()
const store = useGameStore()

const planId = computed(() => String(route.params.id))
const plan = ref<Plan | null>(null)
const tasks = ref<Task[]>([])
const doneMap = ref<Record<string, boolean>>({})

function rewardText(reward: Reward) {
  if (reward.type === 'money') return `+$${reward.amount}`
  if (reward.type === 'token') return `+代幣 ${reward.amount}`
  return `+${reward.key.toUpperCase()} ${reward.amount}`
}

async function load() {
  if (!store.currentCharId) {
    plan.value = null
    tasks.value = []
    doneMap.value = {}
    return
  }

  const fetched = await db.plans.get(planId.value)
  if (!fetched || fetched.characterId !== store.currentCharId) {
    plan.value = null
    tasks.value = []
    doneMap.value = {}
    return
  }

  plan.value = fetched
  tasks.value = await store.listTasks(planId.value)
  const entries = await Promise.all(
    tasks.value.map(async task => [task.id, await store.isCompletedToday(task.id)] as const)
  )
  doneMap.value = Object.fromEntries(entries)
}

async function toggle(task: Task, checked: boolean) {
  if (!plan.value) return
  if (checked && !doneMap.value[task.id]) {
    await store.completeTask(task)
    doneMap.value[task.id] = true
  } else if (!checked && doneMap.value[task.id]) {
    await store.undoTask(task.id)
    doneMap.value[task.id] = false
  }
}

async function undo(taskId: string) {
  if (!doneMap.value[taskId]) return
  await store.undoTask(taskId)
  doneMap.value[taskId] = false
}

async function addTask() {
  if (!plan.value) return
  const now = Date.now()
  const task: Task = {
    id: nanoid(),
    planId: plan.value.id,
    name: `新任務 ${tasks.value.length + 1}`,
    reward: { type: 'money', amount: 5 },
    repeatable: false,
    createdAt: now,
    updatedAt: now
  }
  await db.tasks.add(task)
  await load()
}

onMounted(load)
watch([() => store.currentCharId, () => planId.value], load)
</script>
