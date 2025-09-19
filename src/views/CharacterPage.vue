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
          <ion-list>
            <ion-item v-for="key in attributeKeys" :key="key">
              <ion-label>{{ key.toUpperCase() }}</ion-label>
              <ion-badge>{{ character.attributes[key] }}</ion-badge>
            </ion-item>
          </ion-list>
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
import { pencil } from 'ionicons/icons'
import { useGameStore } from '@/stores/useGameStore'
import type { AttributeKey, Character } from '@/db'

const store = useGameStore()
const character = ref<Character | null>(null)
const seeding = ref(false)
const attributeKeys: AttributeKey[] = ['str', 'int', 'dex', 'vit', 'wis']

// 編輯姓名相關
const isEditNameModalOpen = ref(false)
const newCharacterName = ref('')
const saving = ref(false)

async function load() {
  character.value = await store.getCharacter() ?? null
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

onMounted(load)
watch(() => store.currentCharId, load)
// 監聽角色資料更新
watch(() => store.characterUpdateTimestamp, load)
</script>

