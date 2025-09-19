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

      <div v-else>
        <!-- Tab 切換區域 -->
        <ion-segment :value="activeTab" @ionChange="onTabChange($event.detail.value)">
          <ion-segment-button value="daily">
            <ion-label>每日</ion-label>
          </ion-segment-button>
          <ion-segment-button value="weekly">
            <ion-label>每週</ion-label>
          </ion-segment-button>
          <ion-segment-button value="monthly">
            <ion-label>每月</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- 計畫列表 -->
        <ion-list>
          <ion-item v-if="!filteredPlans.length">
            <ion-label color="medium">
              尚未建立{{ getTabLabel(activeTab) }}計畫，點擊右上角「新增」。
            </ion-label>
          </ion-item>
          <ion-item v-for="plan in filteredPlans" :key="plan.id">
            <ion-label @click="goToPlan(plan.id)" style="cursor: pointer; flex: 1;">
              <div class="plan-item">
                <span class="plan-name">{{ plan.name }}</span>
                <ion-note>{{ getResetRuleLabel(plan.resetRule) }}</ion-note>
              </div>
            </ion-label>
            <ion-button 
              fill="clear" 
              size="small" 
              @click="editPlanName(plan)"
              aria-label="編輯計劃名稱"
            >
              <ion-icon :icon="createOutline"></ion-icon>
            </ion-button>
            <ion-button 
              fill="clear" 
              size="small" 
              color="danger" 
              @click="removePlan(plan.id)"
              aria-label="刪除計劃"
            >
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>

      <!-- 編輯計劃名稱的 Modal -->
      <ion-modal :is-open="editModalOpen" @did-dismiss="closeEditModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>編輯計劃名稱</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditModal">取消</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-item>
            <ion-input
              v-model="editingPlanName"
              placeholder="請輸入計劃名稱"
              @keyup.enter="savePlanName"
            ></ion-input>
          </ion-item>
          <ion-button expand="block" @click="savePlanName" :disabled="!editingPlanName">
            保存
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
  IonText,
  IonSegment,
  IonSegmentButton,
  IonNote,
  IonModal,
  IonInput,
  IonIcon
} from '@ionic/vue'
import { db, type Plan } from '@/db'
import { nanoid } from 'nanoid'
import { useGameStore } from '@/stores/useGameStore'
import { createOutline, trashOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

type TabType = 'daily' | 'weekly' | 'monthly'

const store = useGameStore()
const router = useRouter()
const plans = ref<Plan[]>([])
const activeTab = ref<TabType>('daily')

// 編輯相關的狀態
const editModalOpen = ref(false)
const editingPlan = ref<Plan | null>(null)
const editingPlanName = ref('')

// 計算過濾後的計畫列表
const filteredPlans = computed(() => {
  return plans.value.filter(plan => plan.resetRule === activeTab.value)
})

async function load() {
  if (!store.currentCharId) {
    plans.value = []
    return
  }
  plans.value = await store.listPlans()
}

function onTabChange(value: any) {
  activeTab.value = value as TabType
}

function getTabLabel(tab: TabType): string {
  const labels = {
    daily: '每日',
    weekly: '每週',
    monthly: '每月'
  }
  return labels[tab]
}

function getResetRuleLabel(resetRule: string): string {
  const labels = {
    daily: '每日',
    weekly: '每週',
    monthly: '每月',
    none: '無重置'
  }
  return labels[resetRule as keyof typeof labels] || resetRule
}

async function addPlan() {
  if (!store.currentCharId) return
  
  const tabLabel = getTabLabel(activeTab.value)
  const existingPlansCount = filteredPlans.value.length
  
  const now = Date.now()
  const plan: Plan = {
    id: nanoid(),
    characterId: store.currentCharId,
    name: `新${tabLabel}計畫 ${existingPlansCount + 1}`,
    resetRule: activeTab.value,
    sortOrder: now,
    createdAt: now,
    updatedAt: now
  }
  await db.plans.add(plan)
  await load()
}

async function removePlan(id: string) {
  // 獲取計劃名稱用於確認對話框
  const plan = plans.value.find(p => p.id === id)
  const planName = plan ? plan.name : '該計劃'
  
  if (!confirm(`確定要刪除「${planName}」嗎？這將同時刪除所有相關任務。`)) {
    return
  }
  
  try {
    // 同時刪除計畫下的所有任務
    const tasks = await db.tasks.where('planId').equals(id).toArray()
    const taskIds = tasks.map(task => task.id)
    
    await db.transaction('rw', db.plans, db.tasks, db.completions, async () => {
      await db.plans.delete(id)
      await db.tasks.where('planId').equals(id).delete()
      // 刪除相關的任務完成記錄
      for (const taskId of taskIds) {
        await db.completions.where('taskId').equals(taskId).delete()
      }
    })
    
    await load()
  } catch (error) {
    console.error('刪除計劃失敗:', error)
    alert('刪除計劃時發生錯誤')
  }
}

// 編輯計劃名稱相關方法
function editPlanName(plan: Plan) {
  editingPlan.value = plan
  editingPlanName.value = plan.name
  editModalOpen.value = true
}

function closeEditModal() {
  editModalOpen.value = false
  editingPlan.value = null
  editingPlanName.value = ''
}

async function savePlanName() {
  if (!editingPlan.value || !editingPlanName.value.trim()) return
  
  try {
    await store.updatePlanName(editingPlan.value.id, editingPlanName.value.trim())
    await load()
    closeEditModal()
  } catch (error) {
    console.error('保存計劃名稱失敗:', error)
    alert('保存計劃名稱時發生錯誤')
  }
}

function goToPlan(planId: string) {
  router.push(`/tabs/plan/${planId}`)
}

onMounted(load)
watch(() => store.currentCharId, load)
</script>

<style scoped>
.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.plan-name {
  flex: 1;
}
</style>

