import Dexie, { Table } from 'dexie'

export type AttributeKey = 'str' | 'int' | 'dex' | 'vit' | 'wis'
export type Reward =
  | { type: 'money'; amount: number }
  | { type: 'token'; amount: number }
  | { type: 'attr'; key: AttributeKey; amount: number }

export interface Account {
  id: string; username: string; password: string;
  createdAt: number; updatedAt: number;
}
export interface Character {
  id: string; accountId: string; name: string; level: number; money: number; token: number;
  attributes: Record<AttributeKey, number>;
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
  }
}
export const db = new AppDB()
export const todayKey = () => new Date().toISOString().slice(0,10) // YYYY-MM-DD
