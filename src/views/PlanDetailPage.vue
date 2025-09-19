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
        <div ref="taskListElement">
          <ion-item v-for="task in tasks" :key="task.id" :data-task-id="task.id">
            <ion-checkbox
              slot="start"
              :checked="doneMap[task.id]"
              @ionChange="toggle(task, $event.detail.checked)"
            />
            <ion-label>
              <div class="task-item">
                <span class="task-name">{{ task.name }}</span>
                <div class="task-actions">
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click="editTask(task)"
                  >
                    <ion-icon :icon="createOutline"></ion-icon>
                  </ion-button>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click="deleteTask(task.id)"
                    color="danger"
                  >
                    <ion-icon :icon="trashOutline"></ion-icon>
                  </ion-button>
                  <ion-icon 
                    :icon="reorderThreeOutline" 
                    class="drag-handle"
                  ></ion-icon>
                </div>
              </div>
            </ion-label>
            <ion-badge slot="end">{{ rewardText(task.reward) }}</ion-badge>
            <ion-button size="small" fill="clear" @click="undo(task.id)">撤銷</ion-button>
          </ion-item>
        </div>
        <div class="ion-padding">
          <ion-button expand="block" @click="addTask">新增任務</ion-button>
        </div>
      </ion-list>

      <!-- 編輯任務的 Modal -->
      <ion-modal :is-open="editModalOpen" @did-dismiss="closeEditModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>編輯任務</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditModal">取消</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-item>
            <ion-label position="stacked">任務名稱</ion-label>
            <ion-input
              v-model="editingTaskName"
              placeholder="請輸入任務名稱"
            ></ion-input>
          </ion-item>
          
          <ion-item>
            <ion-label position="stacked">獎勵類型</ion-label>
            <ion-select v-model="editingRewardType" placeholder="選擇獎勵類型">
              <ion-select-option value="money">金錢</ion-select-option>
              <ion-select-option value="token">特殊代幣</ion-select-option>
              <ion-select-option value="attr">屬性</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item v-if="editingRewardType === 'attr'">
            <ion-label position="stacked">屬性類型</ion-label>
            <ion-select v-model="editingRewardKey" placeholder="選擇屬性">
              <ion-select-option value="str">力量</ion-select-option>
              <ion-select-option value="int">智力</ion-select-option>
              <ion-select-option value="dex">敏捷</ion-select-option>
              <ion-select-option value="vit">體力</ion-select-option>
              <ion-select-option value="wis">智慧</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">獎勵數量</ion-label>
            <ion-input
              v-model.number="editingRewardAmount"
              type="number"
              placeholder="請輸入獎勵數量"
            ></ion-input>
          </ion-item>

          <ion-button expand="block" @click="saveTask" :disabled="!editingTaskName">
            保存
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onActivated } from 'vue'
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
  IonText,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonButtons
} from '@ionic/vue'
import { db, type Plan, type Task, type Reward, type AttributeKey } from '@/db'
import { nanoid } from 'nanoid'
import { useGameStore } from '@/stores/useGameStore'
import { createOutline, reorderThreeOutline, trashOutline } from 'ionicons/icons'
import Sortable from 'sortablejs'

const route = useRoute()
const store = useGameStore()

const planId = computed(() => String(route.params.id))
const plan = ref<Plan | null>(null)
const tasks = ref<Task[]>([])
const doneMap = ref<Record<string, boolean>>({})

// 編輯相關狀態
const editModalOpen = ref(false)
const editingTask = ref<Task | null>(null)
const editingTaskName = ref('')
const editingRewardType = ref<'money' | 'token' | 'attr'>('money')
const editingRewardAmount = ref(5)
const editingRewardKey = ref<AttributeKey>('str')
const taskListElement = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

// 狀態緩存鍵（包含日期）
const stateKey = computed(() => `planDetail_${planId.value}_${store.currentCharId}_${new Date().toDateString()}`)

// 從 sessionStorage 載入狀態
function loadStateFromCache(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    // 首先清理舊的緩存
    cleanupOldCache()
    
    const cached = sessionStorage.getItem(stateKey.value)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

// 保存狀態到 sessionStorage
function saveStateToCache(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(stateKey.value, JSON.stringify(state))
  } catch {
    // 忽略錯誤
  }
}

// 清理舊的緩存（不同日期的）
function cleanupOldCache() {
  if (typeof window === 'undefined') return
  try {
    const today = new Date().toDateString()
    const keysToRemove: string[] = []
    
    // 遍歷所有 sessionStorage 鍵值
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('planDetail_') && !key.endsWith(`_${today}`)) {
        keysToRemove.push(key)
      }
    }
    
    // 移除舊的緩存
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  } catch {
    // 忽略錯誤
  }
}

// 計算當前編輯的獎勵對象
const editingReward = computed<Reward>(() => {
  if (editingRewardType.value === 'money') {
    return { type: 'money', amount: editingRewardAmount.value }
  } else if (editingRewardType.value === 'token') {
    return { type: 'token', amount: editingRewardAmount.value }
  } else {
    return { type: 'attr', key: editingRewardKey.value, amount: editingRewardAmount.value }
  }
})

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
  const newTasks = await store.listTasks(planId.value)
  
  // 保存當前的完成狀態
  const previousDoneMap = { ...doneMap.value }
  
  // 從緩存載入狀態
  const cachedState = loadStateFromCache()
  
  // 更新任務列表
  tasks.value = newTasks
  
  // 重新計算完成狀態，優先級：本地狀態 > 緩存狀態 > 數據庫狀態
  const newDoneMap: Record<string, boolean> = {}
  
  for (const task of newTasks) {
    // 1. 如果本地有狀態，使用本地狀態
    if (task.id in previousDoneMap) {
      newDoneMap[task.id] = previousDoneMap[task.id]
      console.log(`使用本地狀態 ${task.name}: ${previousDoneMap[task.id]}`)
    }
    // 2. 如果緩存有狀態，使用緩存狀態
    else if (task.id in cachedState) {
      newDoneMap[task.id] = cachedState[task.id]
      console.log(`使用緩存狀態 ${task.name}: ${cachedState[task.id]}`)
    }
    // 3. 否則查詢數據庫
    else {
      newDoneMap[task.id] = await store.isCompletedToday(task.id)
      console.log(`使用數據庫狀態 ${task.name}: ${newDoneMap[task.id]}`)
    }
  }
  
  doneMap.value = newDoneMap
  
  // 保存狀態到緩存
  saveStateToCache(newDoneMap)
  
  console.log('載入完成狀態:', doneMap.value) // 調試信息
  console.log('任務清單:', tasks.value.map(t => ({ id: t.id, name: t.name }))) // 調試信息
  
  // 初始化拖拽排序
  await nextTick()
  initSortable()
}

function initSortable() {
  if (!taskListElement.value) return
  
  if (sortableInstance) {
    sortableInstance.destroy()
  }
  
  sortableInstance = new Sortable(taskListElement.value, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: async (evt) => {
      if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
        try {
          // 重新排序任務陣列
          const reorderedTasks = [...tasks.value]
          const [movedTask] = reorderedTasks.splice(evt.oldIndex, 1)
          reorderedTasks.splice(evt.newIndex, 0, movedTask)
          
          // 更新排序
          const taskIds = reorderedTasks.map(task => task.id)
          await store.updateTaskOrder(planId.value, taskIds)
          await load()
        } catch (error) {
          console.error('拖拽排序失敗:', error)
        }
      }
    }
  })
}

async function toggle(task: Task, checked: boolean) {
  if (!plan.value) return
  
  console.log(`切換任務 ${task.name} 到 ${checked ? '完成' : '未完成'}, 當前狀態: ${doneMap.value[task.id]}`)
  
  try {
    if (checked && !doneMap.value[task.id]) {
      await store.completeTask(task)
      doneMap.value[task.id] = true
      console.log(`任務 ${task.name} 已標記為完成`)
    } else if (!checked && doneMap.value[task.id]) {
      await store.undoTask(task.id)
      doneMap.value[task.id] = false
      console.log(`任務 ${task.name} 已標記為未完成`)
    }
    
    // 立即保存狀態到緩存
    saveStateToCache(doneMap.value)
    
  } catch (error) {
    console.error('切換任務狀態失敗:', error)
    // 回復到之前的狀態
    doneMap.value[task.id] = !checked
    // 回復緩存
    saveStateToCache(doneMap.value)
  }
}

async function undo(taskId: string) {
  if (!doneMap.value[taskId]) return
  
  try {
    await store.undoTask(taskId)
    doneMap.value[taskId] = false
    
    // 立即保存狀態到緩存
    saveStateToCache(doneMap.value)
    
  } catch (error) {
    console.error('撤銷任務失敗:', error)
    // 重新檢查狀態
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      doneMap.value[taskId] = await store.isCompletedToday(taskId)
      // 保存回復的狀態
      saveStateToCache(doneMap.value)
    }
  }
}

async function addTask() {
  if (!plan.value) return
  
  try {
    const now = Date.now()
    const task: Task = {
      id: nanoid(),
      planId: plan.value.id,
      name: `新任務 ${tasks.value.length + 1}`,
      reward: { type: 'money', amount: 5 },
      repeatable: false,
      sortOrder: tasks.value.length,
      createdAt: now,
      updatedAt: now
    }
    await db.tasks.add(task)
    await load()
  } catch (error) {
    console.error('新增任務失敗:', error)
    alert('新增任務時發生錯誤')
  }
}

// 編輯任務相關方法
function editTask(task: Task) {
  editingTask.value = task
  editingTaskName.value = task.name
  
  // 根據獎勵類型設置編輯狀態
  if (task.reward.type === 'money') {
    editingRewardType.value = 'money'
    editingRewardAmount.value = task.reward.amount
  } else if (task.reward.type === 'token') {
    editingRewardType.value = 'token'
    editingRewardAmount.value = task.reward.amount
  } else {
    editingRewardType.value = 'attr'
    editingRewardAmount.value = task.reward.amount
    editingRewardKey.value = task.reward.key
  }
  
  editModalOpen.value = true
}

function closeEditModal() {
  editModalOpen.value = false
  editingTask.value = null
  editingTaskName.value = ''
  editingRewardType.value = 'money'
  editingRewardAmount.value = 5
  editingRewardKey.value = 'str'
}

async function saveTask() {
  if (!editingTask.value || !editingTaskName.value.trim()) return
  
  try {
    await store.updateTask(editingTask.value.id, {
      name: editingTaskName.value.trim(),
      reward: editingReward.value
    })
    
    await load()
    closeEditModal()
  } catch (error) {
    console.error('保存任務失敗:', error)
    alert('保存任務時發生錯誤')
  }
}

async function deleteTask(taskId: string) {
  try {
    await db.transaction('rw', db.tasks, db.completions, async () => {
      await db.tasks.delete(taskId)
      await db.completions.where('taskId').equals(taskId).delete()
    })
    await load()
  } catch (error) {
    console.error('刪除任務失敗:', error)
    alert('刪除任務時發生錯誤')
  }
}

onMounted(load)
onActivated(load) // 當頁面重新激活時重新載入
watch([() => store.currentCharId, () => planId.value], load)
// 監聽路由變化，確保狀態正確
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    load()
  }
})
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.task-name {
  flex: 1;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  cursor: move;
  color: var(--ion-color-medium);
  font-size: 18px;
  padding: 4px;
}

.drag-handle:hover {
  color: var(--ion-color-primary);
}

.sortable-ghost {
  opacity: 0.4;
}
</style>