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
- [x] **屬性系統 (重構完成)**
  - ✨ **自定義屬性支援** - 可動態新增屬性
  - ✨ **屬性名稱編輯** - 可修改屬性顯示名稱，不影響數值
  - ✨ **屬性排序功能** - 支援拖拽調整屬性順序
  - 📊 **預設屬性**：力量、智力、敏捷、體力、智慧
  - 🔧 **資料遷移**：自動從固定屬性轉換為自定義屬性系統
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
- [x] **獎勵機制 (已升級)**
  - ✨ **動態屬性獎勵** - 自動載入當前角色的所有屬性
  - 💰 **金錢獎勵** (+$N)
  - 🪙 **代幣獎勵** (+代幣 N)
  - 🏷️ **智能顯示** - 獎勵顯示實際屬性名稱而非代碼
- [x] **任務操作**
  - 完成任務獲得獎勵
  - 撤銷功能
  - 動態新增任務
  - ✨ **拖拽排序** - 支援任務順序調整
  - ✨ **任務編輯** - 可修改任務名稱和獎勵

### 4. 用戶認證系統 (Authentication)
- [x] **登入/註冊**
  - 帳號密碼驗證
  - 新用戶註冊
  - 錯誤處理機制
- [x] **用戶切換**
  - 多帳號支援
  - 在設定頁面切換帳號
  - 登出功能

## 🎆 v2.0 自定義屬性系統 (2025-09-19)

### 🚀 **重大功能更新**

#### ✨ **自定義屬性系統**
- **功能特色**：
  - 🏷️ **屬性可自定義新增** - 無限制添加新屬性
  - ✏️ **屬性名稱可編輯** - 不影響已積累數值
  - 🔄 **拖拽排序** - 灣流的屬性順序調整
  - 🛡️ **安全刪除** - 檢查使用狀態防止誤刪

- **技術亮點**：
  - 🔄 **無縫資料遷移** - 自動從固定屬性轉換為動態系統
  - 💾 **資料庫 v4** - 新增 attributeDefinitions 表
  - 🔗 **ID 系統** - 使用 characterId_attr_xxx 格式確保唯一性
  - 🎨 **UI/UX 最佳化** - Ionic 模態框 + Sortable.js 整合

#### 🏠 **人物頁面增強**
- **屬性管理介面**：
  - 📊 **動態屬性顯示** - 自動載入當前角色屬性
  - ⚙️ **管理按鈕** - 一鍵進入屬性管理模式
  - 🎨 **直覺操作** - 清晰的編輯/刪除/拖拽手柄

- **CRUD 功能**：
  - ➕ **新增屬性** - 簡潔的輸入介面
  - ✏️ **編輯名稱** - 點擊編輯按鈕修改
  - 🗑️ **安全刪除** - 檢查使用狀態加確認
  - 🔄 **拖拽排序** - 實時保存新順序

#### 🎣 **任務編輯器升級**
- **動態屬性選擇**：
  - 🔄 **自動載入** - 選擇器顯示當前角色的所有屬性
  - 🏷️ **名稱顯示** - 顯示實際屬性名稱而非代碼
  - 🎯 **智能預設** - 自動選擇第一個可用屬性

### 🛠️ **技術架構改進**

#### **資料模型重構**：
```typescript
// 新增屬性定義介面
interface AttributeDefinition {
  id: string           // 唯一 ID，永不改變
  name: string         // 顯示名稱，可編輯
  characterId: string  // 所屬角色
  sortOrder: number    // 排序順序
  isDefault: boolean   // 是否為預設屬性
  createdAt: number
  updatedAt: number
}

// 更新後的獎勵類型
type Reward = 
  | { type: 'money'; amount: number }
  | { type: 'token'; amount: number }
  | { type: 'attr'; attributeId: string; amount: number } // 使用 attributeId
```

#### **Store 方法增強**：
- `listAttributeDefinitions()` - 列出屬性定義
- `addAttributeDefinition()` - 新增屬性
- `updateAttributeDefinition()` - 更新屬性名稱
- `deleteAttributeDefinition()` - 安全刪除屬性
- `updateAttributeDefinitionOrder()` - 更新排序

#### **UI 組件最佳化**：
- **Sortable.js 整合** - 流暢的拖拽體驗
- **Ionic 模態框生命週期** - 使用 `@didPresent` 確保 DOM 渲染
- **Vue 3 Composition API** - 響應式狀態管理
- **TypeScript 類型安全** - 完整的型別定義和檢查

## 資料模型

### AttributeDefinition (屬性定義) ✨ **v2.0 新增**
```typescript
interface AttributeDefinition {
  id: string           // 唯一 ID，永不改變
  name: string         // 顯示名稱，可編輯
  characterId: string  // 所屬角色
  sortOrder: number    // 排序順序
  isDefault: boolean   // 是否為預設屬性
  createdAt: number
  updatedAt: number
}
```

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

### Character (角色) 🔄 **v2.0 更新**
```typescript
interface Character {
  id: string
  accountId: string
  name: string
  level: number
  money: number
  token: number
  attributes: Record<string, number> // ✨ 改為動態 attributeId 對應
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

### Reward (獎勵) 🔄 **v2.0 更新**
```typescript
type Reward =
  | { type: 'money'; amount: number }
  | { type: 'token'; amount: number }
  | { type: 'attr'; attributeId: string; amount: number } // ✨ 使用 attributeId 取代 key
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

### 🎯 開發進度

#### ✅ **v2.0 自定義屬性系統** (2025-09-19)
- [x] **資料層重構**
  - [x] 新增 AttributeDefinition 資料模型
  - [x] 資料庫版本升級到 v4
  - [x] 完整的 v3→v4 自動遷移邏輯
  - [x] Store 屬性管理方法完整實現

- [x] **UI 層實現**
  - [x] CharacterPage 屬性管理重構
  - [x] 屬性 CRUD 完整介面
  - [x] Sortable.js 拖拽排序整合
  - [x] PlanDetailPage 動態屬性選擇器
  - [x] Ionic 模態框生命週期優化

- [x] **功能驗證**
  - [x] 屬性新增/編輯/刪除
  - [x] 拖拽排序即時保存
  - [x] 任務編輯器動態屬性載入
  - [x] 安全刪除檢查機制

#### ✅ **v1.x 基礎功能** (已完成)
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

#### 🔧 **技術修復** (已完成)
- [x] 修復 TabsPage 圖示導入問題
- [x] 新增缺失的 nanoid 依賴
- [x] 修復 LoginPage segment 綁定
- [x] 清理測試文件錯誤引用
- [x] 移除調試代碼
- [x] **人物系統優化**
  - [x] 新增修改姓名的彈窗功能
  - [x] 計劃頁面打勾後同步更新人物介面屬性
- [x] **計劃介面優化**
  - [x] 計劃介面分為每日/每週/每月三個子區塊 (tab)
  - [x] 每個 tab 中可以獨立新增修改刪除計劃
  - [x] 每個計劃需要有獨立的 id 並記錄勾選狀態
  - [x] 避免重新回來計劃介面時打勾狀態重置
- [x] **編輯功能增強**
  - [x] 計劃名稱可編輯
  - [x] 任務名稱/獎勵可編輯
  - [x] 順序可拖曳移動

### 🚀 **未來規劃**

#### 🎯 **v3.0 進階功能**
- [ ] **屬性系統擴展**
  - [ ] 屬性分組管理
  - [ ] 屬性類型定義 (百分比、等級制等)
  - [ ] 屬性間的關聯和公式計算
  - [ ] 屬性成長曲線和里程碑

- [ ] **任務系統增強**
  - [ ] 任務模板系統
  - [ ] 條件式任務 (前置任務完成)
  - [ ] 週期性任務自動生成
  - [ ] 任務難度和動態獎勵

#### 🎨 **v3.1 使用者體驗**
- [ ] **視覺化增強**
  - [ ] 屬性成長圖表
  - [ ] 成就系統和徽章
  - [ ] 主題和個性化設定
  - [ ] 動畫和過渡效果

- [ ] **社交功能**
  - [ ] 好友系統
  - [ ] 排行榜
  - [ ] 分享成就
  - [ ] 團隊挑戰

#### 🔧 **v3.2 技術優化**
- [ ] **效能優化**
  - [ ] 虛擬列表大量資料處理
  - [ ] 離線支援和同步
  - [ ] PWA 功能
  - [ ] 資料備份和還原

- [ ] **開發工具**
  - [ ] 單元測試覆蓋率提升
  - [ ] E2E 測試自動化
  - [ ] CI/CD 流程優化
  - [ ] 效能監控和分析
  - [x] 順序可拖曳移動
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