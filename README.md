# StatusCheck - 習慣管理 RPG 遊戲

## 專案概述

StatusCheck 是一個基於 RPG 遊戲化機制的習慣管理應用程式，使用者可以透過完成日常任務來獲得獎勵，提升角色屬性，實現個人成長。

## 技術架構

- **前端框架**: Vue 3 + TypeScript
- **UI 框架**: Ionic Vue
- **狀態管理**: Pinia
- **資料庫**: Dexie (IndexedDB)
- **路由**: Vue Router
- **建置工具**: Vite
- **測試**: Vitest + Cypress

## 核心功能需求

### 1. 人物系統 (Character System)
- [x] **角色基本資訊**
  - 姓名 (name) - 支援點擊編輯
  - 等級 (level)
  - 金錢 (money)
  - 特殊代幣 (token)
- [x] **屬性系統**
  - STR (力量)
  - INT (智力) 
  - DEX (敏捷)
  - VIT (體力)
  - WIS (智慧)
- [x] **角色管理**
  - 載入範例資料功能
  - 角色資訊展示
  - 姓名編輯彈窗
  - 即時屬性同步更新

### 2. 計劃管理系統 (Plan Management)
- [x] **計劃總覽**
  - 分類顯示：每日/每週/每月 tab 切換
  - 動態新增計劃（按當前 tab 分類）
  - 刪除計劃功能（包含相關任務）
- [x] **計劃屬性**
  - 計劃名稱
  - 重置規則 (daily/weekly/monthly/none)
  - 排序順序
- [x] **狀態管理**
  - 獨立的計劃 ID 系統
  - 任務完成狀態持久化
  - 按週期類型正確重置

### 3. 任務系統 (Task System)
- [x] **任務介面**
  - 表格式設計
  - 第一欄：checkbox (完成狀態)
  - 第二欄：任務名稱
  - 第三欄：獎勵顯示
- [x] **獎勵機制**
  - 屬性獎勵 (STR/INT/DEX/VIT/WIS +N)
  - 金錢獎勵 (+$N)
  - 代幣獎勵 (+代幣 N)
- [x] **任務操作**
  - 完成任務獲得獎勵
  - 撤銷功能
  - 動態新增任務

### 4. 用戶認證系統 (Authentication)
- [x] **登入/註冊**
  - 帳號密碼驗證
  - 新用戶註冊
  - 錯誤處理機制
- [x] **用戶切換**
  - 多帳號支援
  - 在設定頁面切換帳號
  - 登出功能

## 資料模型

### Account (帳號)
```typescript
interface Account {
  id: string
  username: string
  password: string
  createdAt: number
  updatedAt: number
}
```

### Character (角色)
```typescript
interface Character {
  id: string
  accountId: string
  name: string
  level: number
  money: number
  token: number
  attributes: Record<AttributeKey, number>
  createdAt: number
  updatedAt: number
}
```

### Plan (計劃)
```typescript
interface Plan {
  id: string
  characterId: string
  name: string
  resetRule: 'none' | 'daily' | 'weekly'
  sortOrder: number
  createdAt: number
  updatedAt: number
}
```

### Task (任務)
```typescript
interface Task {
  id: string
  planId: string
  name: string
  reward: Reward
  repeatable: boolean
  createdAt: number
  updatedAt: number
}
```

### Reward (獎勵)
```typescript
type Reward =
  | { type: 'money'; amount: number }
  | { type: 'token'; amount: number }
  | { type: 'attr'; key: AttributeKey; amount: number }
```

## 頁面結構

### 路由設計
```
/ → 重定向到 /login
/login → 登入頁面
/tabs/ → 主要應用區域 (需要認證)
  ├── /tabs/character → 人物頁面
  ├── /tabs/plans → 計劃列表頁面
  ├── /tabs/plan/:id → 計劃詳細頁面
  └── /tabs/settings → 設定頁面
```

### 頁面功能

#### LoginPage (登入頁面)
- 登入/註冊切換
- 表單驗證
- 錯誤訊息顯示
- 自動重定向

#### CharacterPage (人物頁面)
- 角色資訊展示
- 屬性數值顯示
- 載入範例資料按鈕

#### PlansPage (計劃列表)
- 計劃列表展示
- 新增計劃功能
- 刪除計劃功能
- 導航至計劃詳細頁面

#### PlanDetailPage (計劃詳細頁面)
- 任務列表展示
- 任務完成/撤銷
- 獎勵即時更新
- 新增任務功能

#### SettingsPage (設定頁面)
- 帳號列表
- 帳號切換
- 登出功能
- 清空資料功能

## 開發狀態

### ✅ 已完成功能
- [x] 基本專案架構設置
- [x] 路由配置和認證守衛
- [x] 資料庫設計和遷移
- [x] 用戶認證系統
- [x] 人物系統
- [x] 計劃管理系統
- [x] 任務系統和獎勵機制
- [x] 所有核心 UI 頁面
- [x] 狀態管理 (Pinia Store)
- [x] 錯誤處理機制

### 🔧 技術修復
- [x] 修復 TabsPage 圖示導入問題
- [x] 新增缺失的 nanoid 依賴
- [x] 修復 LoginPage segment 綁定
- [x] 清理測試文件錯誤引用
- [x] 移除調試代碼

### 🎯 待優化項目
- [x] **人物系統優化** (已完成)
  - [x] 新增修改姓名的彈窗功能
  - [x] 計劃頁面打勾後同步更新人物介面屬性
- [x] **計劃介面優化** (已完成)
  - [x] 計劃介面分為每日/每週/每月三個子區塊 (tab)
  - [x] 每個 tab 中可以獨立新增修改刪除計劃
  - [x] 每個計劃需要有獨立的 id 並記錄勾選狀態
  - [x] 避免重新回來計劃介面時打勾狀態重置
- [ ] **編輯功能增強** (進行中)
  - [ ] 計劃名稱可編輯
  - [ ] 任務名稱/獎勵可編輯
  - [ ] 順序可拖曳移動
- [ ] 任務編輯功能
- [ ] 計劃編輯功能
- [ ] 更豐富的獎勵類型
- [ ] 角色升級機制
- [ ] 統計和成就系統
- [ ] 資料匯入/匯出功能
- [ ] PWA 支援
- [ ] 深色主題優化

## 安裝和運行

### 依賴安裝
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置生產版本
```bash
npm run build
```

### 運行測試
```bash
npm run test:unit
npm run test:e2e
```

## 專案結構

```
src/
├── components/          # 可重用組件
├── views/              # 頁面組件
│   ├── LoginPage.vue
│   ├── CharacterPage.vue
│   ├── PlansPage.vue
│   ├── PlanDetailPage.vue
│   ├── SettingsPage.vue
│   └── TabsPage.vue
├── stores/             # Pinia 狀態管理
│   └── useGameStore.ts
├── router/             # 路由配置
│   └── index.ts
├── db.ts              # 資料庫定義
├── main.ts            # 應用入口
└── App.vue            # 根組件
```

## 貢獻指南

1. 所有新功能需求請在此文件中記錄
2. 開發前請確認需求規格
3. 代碼提交前請確保測試通過
4. 遵循現有的代碼風格和架構模式

## 版本記錄

- **v0.1.0** - 基礎功能完成，核心 RPG 機制實現

---

*此文件將持續更新，記錄專案需求變更和開發進度*