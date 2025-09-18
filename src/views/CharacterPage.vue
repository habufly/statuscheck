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
          <ion-card-title>{{ character.name }}（Lv. {{ character.level }}）</ion-card-title>
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
  IonText
} from '@ionic/vue'
import { useGameStore } from '@/stores/useGameStore'
import type { AttributeKey, Character } from '@/db'

const store = useGameStore()
const character = ref<Character | null>(null)
const seeding = ref(false)
const attributeKeys: AttributeKey[] = ['str', 'int', 'dex', 'vit', 'wis']

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

onMounted(load)
watch(() => store.currentCharId, load)
</script>

