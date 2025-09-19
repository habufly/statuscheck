import Dexie, { Table } from 'dexie'

// 保留舊的 AttributeKey 用於遷移和向後相容性
export type LegacyAttributeKey = 'str' | 'int' | 'dex' | 'vit' | 'wis'

// 新的屬性定義介面
export interface AttributeDefinition {
  id: string           // 唯一 ID，永不改變
  name: string         // 顯示名稱，可編輯
  characterId: string  // 所屬角色
  sortOrder: number    // 排序順序
  isDefault: boolean   // 是否為預設屬性
  createdAt: number
  updatedAt: number
}

// 更新後的獎勵類型
export type Reward =
  | { type: 'money'; amount: number }
  | { type: 'token'; amount: number }
  | { type: 'attr'; attributeId: string; amount: number }

export interface Account {
  id: string; username: string; password: string;
  createdAt: number; updatedAt: number;
}

export interface Character {
  id: string; accountId: string; name: string; level: number; money: number; token: number;
  attributes: Record<string, number>; // key 改為 attributeId
  createdAt: number; updatedAt: number;
}
export interface Plan {
  id: string; characterId: string; name: string;
  resetRule: 'none' | 'daily' | 'weekly' | 'monthly';
  sortOrder: number; createdAt: number; updatedAt: number;
}
export interface Task {
  id: string; planId: string; name: string; reward: Reward;
  repeatable: boolean; sortOrder?: number; createdAt: number; updatedAt: number;
}
export interface TaskCompletion {
  id: string; taskId: string; characterId: string; planId: string;
  ts: number; valueApplied: Reward; undone?: boolean; periodKey?: string;
}

class AppDB extends Dexie {
  accounts!: Table<Account, string>
  characters!: Table<Character, string>
  plans!: Table<Plan, string>
  tasks!: Table<Task, string>
  completions!: Table<TaskCompletion, string>
  attributeDefinitions!: Table<AttributeDefinition, string>
  
  constructor() {
    super('appdb')
    this.version(1).stores({
      characters: 'id, name',
      plans: 'id, characterId, sortOrder',
      tasks: 'id, planId',
      completions: 'id, taskId, planId, characterId, periodKey'
    })
    this.version(2).stores({
      accounts: 'id, username',
      characters: 'id, accountId, name',
      plans: 'id, characterId, sortOrder',
      tasks: 'id, planId',
      completions: 'id, taskId, planId, characterId, periodKey'
    }).upgrade(async tx => {
      const accountsTable = tx.table('accounts')
      const charactersTable = tx.table('characters')

      // Seed a default account if legacy data exists without an owner
      const legacyChars = await charactersTable.count()
      if (legacyChars) {
        const defaultAccountId = 'default-account'
        const existingDefault = await accountsTable.get(defaultAccountId)
        if (!existingDefault) {
          const now = Date.now()
          await accountsTable.add({
            id: defaultAccountId,
            username: 'demo',
            password: 'demo',
            createdAt: now,
            updatedAt: now
          })
        }
        await charactersTable.toCollection().modify(char => {
          if (!(char as Character).accountId) {
            (char as Character).accountId = defaultAccountId
          }
        })
      }
    })
    this.version(3).stores({
      accounts: 'id, username',
      characters: 'id, accountId, name',
      plans: 'id, characterId, sortOrder',
      tasks: 'id, planId, sortOrder',
      completions: 'id, taskId, planId, characterId, periodKey'
    }).upgrade(async tx => {
      // 為現有任務添加 sortOrder
      const tasksTable = tx.table('tasks')
      let counter = 0
      await tasksTable.toCollection().modify(task => {
        if (task.sortOrder === undefined) {
          task.sortOrder = counter++
        }
      })
    })
    this.version(4).stores({
      accounts: 'id, username',
      characters: 'id, accountId, name',
      plans: 'id, characterId, sortOrder',
      tasks: 'id, planId, sortOrder',
      completions: 'id, taskId, planId, characterId, periodKey',
      attributeDefinitions: 'id, characterId, sortOrder'
    }).upgrade(async tx => {
      await this.migrateToCustomAttributes(tx)
    })
  }
  
  // 遷移現有屬性到自定義屬性系統
  private async migrateToCustomAttributes(tx: any) {
    const charactersTable = tx.table('characters')
    const attributeDefinitionsTable = tx.table('attributeDefinitions')
    const tasksTable = tx.table('tasks')
    const completionsTable = tx.table('completions')
    
    const now = Date.now()
    
    // 預設屬性定義
    const defaultAttributes: Array<{
      id: string
      name: string
      legacyKey: LegacyAttributeKey
    }> = [
      { id: 'attr_str', name: '力量', legacyKey: 'str' },
      { id: 'attr_int', name: '智力', legacyKey: 'int' },
      { id: 'attr_dex', name: '敏捷', legacyKey: 'dex' },
      { id: 'attr_vit', name: '體力', legacyKey: 'vit' },
      { id: 'attr_wis', name: '智慧', legacyKey: 'wis' }
    ]
    
    // 遷移每個角色的屬性
    await charactersTable.toCollection().modify(async (character: Character) => {
      const characterId = character.id
      
      // 為這個角色創建屬性定義
      for (let i = 0; i < defaultAttributes.length; i++) {
        const attr = defaultAttributes[i]
        await attributeDefinitionsTable.add({
          id: `${characterId}_${attr.id}`,
          name: attr.name,
          characterId: characterId,
          sortOrder: i,
          isDefault: true,
          createdAt: now,
          updatedAt: now
        })
      }
      
      // 轉換角色的屬性值
      const newAttributes: Record<string, number> = {}
      const oldAttributes = character.attributes as Record<LegacyAttributeKey, number>
      
      for (const attr of defaultAttributes) {
        const attributeId = `${characterId}_${attr.id}`
        newAttributes[attributeId] = oldAttributes[attr.legacyKey] || 0
      }
      
      character.attributes = newAttributes
    })
    
    // 更新任務獎勵中的屬性引用
    await tasksTable.toCollection().modify((task: Task) => {
      if (task.reward.type === 'attr') {
        const oldReward = task.reward as any
        if (oldReward.key) {
          // 找到對應的新 attributeId
          const attr = defaultAttributes.find(a => a.legacyKey === oldReward.key)
          if (attr) {
            // 需要知道這個任務屬於哪個角色才能構建正確的 attributeId
            // 暫時先使用占位符，後續需要通過 planId 查找
            task.reward = {
              type: 'attr',
              attributeId: `PLACEHOLDER_${attr.id}`, // 稍後修正
              amount: oldReward.amount
            }
          }
        }
      }
    })
    
    // 更新完成記錄中的屬性引用
    await completionsTable.toCollection().modify((completion: TaskCompletion) => {
      if (completion.valueApplied.type === 'attr') {
        const oldReward = completion.valueApplied as any
        if (oldReward.key) {
          const attr = defaultAttributes.find(a => a.legacyKey === oldReward.key)
          if (attr) {
            completion.valueApplied = {
              type: 'attr',
              attributeId: `${completion.characterId}_${attr.id}`,
              amount: oldReward.amount
            }
          }
        }
      }
    })
    
    // 修正任務獎勵中的占位符
    const plansTable = tx.table('plans')
    await tasksTable.toCollection().modify(async (task: Task) => {
      if (task.reward.type === 'attr' && task.reward.attributeId.startsWith('PLACEHOLDER_')) {
        // 通過 planId 找到角色 ID
        const plan = await plansTable.get(task.planId)
        if (plan) {
          const attrId = task.reward.attributeId.replace('PLACEHOLDER_', '')
          task.reward.attributeId = `${plan.characterId}_${attrId}`
        }
      }
    })
  }
}
export const db = new AppDB()
export const todayKey = () => new Date().toISOString().slice(0,10) // YYYY-MM-DD
