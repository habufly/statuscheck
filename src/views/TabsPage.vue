<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="character" href="/tabs/character">
          <ion-icon :icon="personCircle" />
          <ion-label>人物</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="plans" href="/tabs/plans">
          <ion-icon :icon="list" />
          <ion-label>計畫</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon :icon="settings" />
          <ion-label>設定</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { personCircle, list, settings } from 'ionicons/icons';
</script>
