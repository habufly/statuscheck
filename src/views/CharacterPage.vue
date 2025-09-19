<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>人物</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-button expand="block" @click="seed" :disabled="seeding || !store.isAuthenticated">
        {{ seeding ? '載入中…' : '載入範例資料' }}
      </ion-button>

      <ion-card v-if="character">
        <ion-card-header>
          <ion-card-title @click="openEditNameModal" style="cursor: pointer; display: flex; align-items: center;">
            {{ character.name }}（Lv. {{ character.level }}）
            <ion-icon :icon="pencil" style="margin-left: 8px; font-size: 16px;" />
          </ion-card-title>
          <ion-card-subtitle>
            金錢 {{ character.money }} ｜ 代幣 {{ character.token }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <!-- 屬性列表標題與管理按鈕 -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0;">角色屬性</h3>
            <ion-button fill="outline" size="small" @click="openAttributeManageModal">
              <ion-icon :icon="settings" slot="start" />
              管理屬性
            </ion-button>
          </div>
          
          <!-- 動態屬性列表 -->
          <ion-list>
            <ion-item
              v-for="attr in attributeDefinitions"
              :key="attr.id"
            >
              <ion-label>{{ attr.name }}</ion-label>
              <ion-badge>{{ character.attributes[attr.id] || 0 }}</ion-badge>
            </ion-item>
          </ion-list>
          
          <!-- 空狀態 -->
          <ion-text v-if="attributeDefinitions.length === 0" color="medium">
            <p>尚未設定任何屬性</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <ion-text v-else color="medium">
        尚未建立角色，請點擊上方按鈕載入範例資料，或新增自己的角色。
      </ion-text>

      <!-- 編輯姓名模態框 -->
      <ion-modal :is-open="isEditNameModalOpen" @didDismiss="closeEditNameModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>修改角色姓名</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditNameModal">取消</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-input
              v-model="newCharacterName"
              label="角色姓名"
              label-placement="floating"
              placeholder="請輸入新的角色姓名"
              :maxlength="20"
              required
            />
          </ion-item>
          <ion-button 
            expand="block" 
            @click="saveCharacterName" 
            :disabled="!newCharacterName?.trim() || saving"
            class="ion-margin-top"
          >
            {{ saving ? '儲存中…' : '儲存' }}
          </ion-button>
        </ion-content>
      </ion-modal>

      <!-- 屬性管理模態框 -->
      <ion-modal 
        :is-open="isAttributeManageModalOpen" 
        @didDismiss="closeAttributeManageModal"
        @didPresent="onAttributeManageModalPresent"
      >
        <ion-header>
          <ion-toolbar>
            <ion-title>管理屬性</ion-title>
            <ion-buttons slot="start">
              <ion-button @click="closeAttributeManageModal">完成</ion-button>
            </ion-buttons>
            <ion-buttons slot="end">
              <ion-button @click="openAddAttributeModal">
                <ion-icon :icon="add" slot="start" />
                新增
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-text color="medium" v-if="attributeDefinitions.length === 0">
            <p>尚未設定任何屬性，點擊右上角新增按鈕來添加屬性</p>
          </ion-text>
          
          <ion-list v-else>
            <div ref="attributeManageListRef" class="sortable-container">
              <div
                v-for="attr in attributeDefinitions"
                :key="attr.id"
                :data-id="attr.id"
                class="attribute-manage-item"
              >
                <ion-item>
                  <ion-label>
                    <h2>{{ attr.name }}</h2>
                    <p>數值：{{ character?.attributes[attr.id] || 0 }}</p>
                  </ion-label>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    @click="openEditAttributeModal(attr)"
                  >
                    <ion-icon :icon="create" />
                  </ion-button>
                  <ion-button 
                    fill="clear" 
                    size="small" 
                    color="danger"
                    @click="deleteAttribute(attr)"
                    :disabled="attr.isDefault"
                  >
                    <ion-icon :icon="trash" />
                  </ion-button>
                  <ion-icon 
                    :icon="reorderThreeOutline" 
                    class="drag-handle"
                    style="cursor: grab; margin-left: 8px; color: var(--ion-color-medium);"
                  />
                </ion-item>
              </div>
            </div>
          </ion-list>
        </ion-content>
      </ion-modal>

      <!-- 屬性編輯模態框 -->
      <ion-modal :is-open="isAttributeEditModalOpen" @didDismiss="closeAttributeEditModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ isAddingAttribute ? '新增屬性' : '編輯屬性' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeAttributeEditModal">取消</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item>
            <ion-input
              v-model="newAttributeName"
              label="屬性名稱"
              label-placement="floating"
              placeholder="請輸入屬性名稱"
              :maxlength="10"
              required
            />
          </ion-item>
          <ion-button 
            expand="block" 
            @click="saveAttribute" 
            :disabled="!newAttributeName?.trim()"
            class="ion-margin-top"
          >
            {{ isAddingAttribute ? '新增' : '儲存' }}
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonText,
  IonModal,
  IonButtons,
  IonInput,
  IonIcon
} from '@ionic/vue'
import { pencil, settings, reorderThreeOutline, add, create, trash } from 'ionicons/icons'
import { useGameStore } from '@/stores/useGameStore'
import type { Character, AttributeDefinition } from '@/db'
import Sortable from 'sortablejs'

const store = useGameStore()
const character = ref<Character | null>(null)
const attributeDefinitions = ref<AttributeDefinition[]>([])
const seeding = ref(false)

// 編輯姓名相關
const isEditNameModalOpen = ref(false)
const newCharacterName = ref('')
const saving = ref(false)

// 屬性管理相關
const isAttributeManageModalOpen = ref(false)
const attributeManageListRef = ref<HTMLElement>()
const sortableInstance = ref<Sortable | null>(null)

// 屬性 CRUD 相關
const editingAttribute = ref<AttributeDefinition | null>(null)
const isAttributeEditModalOpen = ref(false)
const newAttributeName = ref('')
const isAddingAttribute = ref(false)

async function load() {
  character.value = await store.getCharacter() ?? null
  if (character.value) {
    attributeDefinitions.value = await store.listAttributeDefinitions()
  }
}

async function seed() {
  if (seeding.value) return
  seeding.value = true
  try {
    await store.seedOnce()
    await load()
  } catch (error: any) {
    if (error?.message === 'NOT_AUTHENTICATED') {
      alert('請先登入後再載入資料')
    } else {
      console.error(error)
      alert('載入資料時發生錯誤')
    }
  } finally {
    seeding.value = false
  }
}

function openEditNameModal() {
  if (!character.value) return
  newCharacterName.value = character.value.name
  isEditNameModalOpen.value = true
}

function closeEditNameModal() {
  isEditNameModalOpen.value = false
  newCharacterName.value = ''
}

async function saveCharacterName() {
  if (!newCharacterName.value?.trim() || saving.value) return
  
  saving.value = true
  try {
    await store.updateCharacterName(newCharacterName.value)
    await load() // 重新載入角色資料
    closeEditNameModal()
  } catch (error: any) {
    if (error?.message === 'NAME_EMPTY') {
      alert('請輸入角色姓名')
    } else if (error?.message === 'CHARACTER_NOT_SELECTED') {
      alert('請先選擇角色')
    } else if (error?.message === 'CHAR_NOT_FOUND') {
      alert('找不到角色資料')
    } else {
      console.error(error)
      alert('更新姓名時發生錯誤')
    }
  } finally {
    saving.value = false
  }
}

// 屬性管理相關函數
function openAttributeManageModal() {
  isAttributeManageModalOpen.value = true
  // 不在這裡初始化 Sortable，等待模態框完全顯示後再初始化
}

// 模態框完全顯示後的回調
function onAttributeManageModalPresent() {
  console.log('模態框已顯示，初始化 Sortable')
  // 等待一小段時間確保 DOM 完全渲染
  setTimeout(() => {
    initSortable()
  }, 100)
}

function closeAttributeManageModal() {
  isAttributeManageModalOpen.value = false
  if (sortableInstance.value) {
    sortableInstance.value.destroy()
    sortableInstance.value = null
  }
}

function initSortable() {
  console.log('嘗試初始化 Sortable...')
  console.log('attributeManageListRef.value:', attributeManageListRef.value)
  console.log('attributeManageListRef.value 類型:', typeof attributeManageListRef.value)
  
  // 確保我們有真正的 HTMLElement
  let element = attributeManageListRef.value
  
  // 如果是 Vue 組件實例，嘗試獲取其 $el 屬性
  if (element && typeof element === 'object' && '$el' in element) {
    element = (element as any).$el
    console.log('從 Vue 組件獲取 DOM 元素:', element)
  }
  
  if (!element || !(element instanceof HTMLElement)) {
    console.warn('無法獲取有效的 HTMLElement:', element)
    return
  }
  
  // 清理舊的實例
  if (sortableInstance.value) {
    console.log('清理舊的 Sortable 實例')
    sortableInstance.value.destroy()
    sortableInstance.value = null
  }
  
  console.log('創建新的 Sortable 實例，使用元素:', element)
  sortableInstance.value = new Sortable(element, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart: () => {
      console.log('開始拖拽')
    },
    onEnd: async (evt) => {
      console.log('拖拽結束', evt.oldIndex, '->', evt.newIndex)
      if (evt.oldIndex !== evt.newIndex && character.value) {
        // 重新排列屬性 ID
        const reorderedIds: string[] = []
        const items = element.querySelectorAll('[data-id]')
        items?.forEach(item => {
          const id = (item as HTMLElement).getAttribute('data-id')
          if (id) reorderedIds.push(id)
        })
        
        console.log('新順序:', reorderedIds)
        
        try {
          await store.updateAttributeDefinitionOrder(character.value.id, reorderedIds)
          await load()
        } catch (error) {
          console.error('更新屬性順序失敗:', error)
          alert('更新屬性順序失敗')
        }
      }
    }
  })
  
  console.log('Sortable 初始化完成')
}

// 屬性 CRUD 函數
function openAddAttributeModal() {
  editingAttribute.value = null
  newAttributeName.value = ''
  isAddingAttribute.value = true
  isAttributeEditModalOpen.value = true
}

function openEditAttributeModal(attr: AttributeDefinition) {
  editingAttribute.value = attr
  newAttributeName.value = attr.name
  isAddingAttribute.value = false
  isAttributeEditModalOpen.value = true
}

function closeAttributeEditModal() {
  isAttributeEditModalOpen.value = false
  editingAttribute.value = null
  newAttributeName.value = ''
  isAddingAttribute.value = false
}

async function saveAttribute() {
  if (!newAttributeName.value?.trim()) return
  
  try {
    if (isAddingAttribute.value) {
      await store.addAttributeDefinition(newAttributeName.value)
    } else if (editingAttribute.value) {
      await store.updateAttributeDefinition(editingAttribute.value.id, {
        name: newAttributeName.value
      })
    }
    await load()
    closeAttributeEditModal()
  } catch (error: any) {
    if (error?.message === 'NAME_EMPTY') {
      alert('請輸入屬性名稱')
    } else {
      console.error(error)
      alert('儲存屬性失敗')
    }
  }
}

async function deleteAttribute(attr: AttributeDefinition) {
  if (!confirm(`確定要刪除屬性「${attr.name}」嗎？`)) return
  
  try {
    await store.deleteAttributeDefinition(attr.id)
    await load()
  } catch (error: any) {
    if (error?.message === 'ATTRIBUTE_IN_USE') {
      alert('此屬性正被任務使用，無法刪除')
    } else {
      console.error(error)
      alert('刪除屬性失敗')
    }
  }
}

onMounted(load)
watch(() => store.currentCharId, load)
// 監聽角色資料更新
watch(() => store.characterUpdateTimestamp, load)
</script>

<style scoped>
.sortable-container {
  width: 100%;
}

.attribute-manage-item {
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.attribute-manage-item:hover {
  background-color: var(--ion-color-light);
}

.drag-handle {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.sortable-ghost {
  opacity: 0.4;
  background-color: var(--ion-color-light);
}

.sortable-chosen {
  background-color: var(--ion-color-primary-tint);
}

.sortable-drag {
  background-color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}
</style>