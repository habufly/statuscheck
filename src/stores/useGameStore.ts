import { defineStore } from 'pinia'
import {
  db,
  todayKey,
  type Account,
  type Character,
  type Plan,
  type Reward,
  type Task,
  type TaskCompletion
} from '@/db'
import { nanoid } from 'nanoid'

function applyRewardToChar(character: Character, reward: Reward, reverse = false) {
  const sign = reverse ? -1 : 1
  if (reward.type === 'money') character.money += sign * reward.amount
  if (reward.type === 'token') character.token += sign * reward.amount
  if (reward.type === 'attr') {
    character.attributes[reward.key] = (character.attributes[reward.key] ?? 0) + sign * reward.amount
  }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    currentAccountId:
      (typeof window !== 'undefined' ? localStorage.getItem('currentAccountId') : '') || '',
    currentCharId:
      (typeof window !== 'undefined' ? localStorage.getItem('currentCharId') : '') || '',
    initialized: false
  }),

  getters: {
    isAuthenticated: state => !!state.currentAccountId
  },

  actions: {
    async init() {
      await this.ensureStateConsistency()
      this.initialized = true
    },

    async ensureStateConsistency() {
      await this.ensureAccount()
      await this.ensureCharacter()
    },

    async ensureAccount() {
      if (this.currentAccountId) {
        const account = await db.accounts.get(this.currentAccountId)
        if (!account) {
          this.clearAccountState()
        }
      }
      if (!this.currentAccountId) {
        const first = await db.accounts.toCollection().first()
        if (first) {
          await this.setCurrentAccount(first.id)
        }
      }
    },

    async ensureCharacter() {
      if (!this.currentAccountId) {
        this.setCurrentChar('')
        return
      }

      if (this.currentCharId) {
        const existing = await db.characters.get(this.currentCharId)
        if (existing && existing.accountId === this.currentAccountId) {
          return
        }
      }

      const firstChar = await db.characters.where('accountId').equals(this.currentAccountId).first()
      if (firstChar) {
        this.setCurrentChar(firstChar.id)
      } else {
        this.setCurrentChar('')
      }
    },

    async setCurrentAccount(id: string) {
      this.currentAccountId = id
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentAccountId', id)
      }
      await this.ensureCharacter()
    },

    clearAccountState() {
      this.currentAccountId = ''
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentAccountId')
      }
      this.setCurrentChar('')
    },

    setCurrentChar(id: string) {
      this.currentCharId = id
      if (typeof window !== 'undefined') {
        if (id) {
          localStorage.setItem('currentCharId', id)
        } else {
          localStorage.removeItem('currentCharId')
        }
      }
    },

    async listAccounts(): Promise<Account[]> {
      return db.accounts.orderBy('username').toArray()
    },

    async register(username: string, password: string) {
      const trimmedUser = username.trim()
      const trimmedPass = password.trim()
      if (!trimmedUser || !trimmedPass) {
        throw new Error('USERNAME_OR_PASSWORD_EMPTY')
      }

      const existing = await db.accounts.where('username').equals(trimmedUser).first()
      if (existing) {
        throw new Error('USERNAME_EXISTS')
      }

      const now = Date.now()
      const account: Account = {
        id: nanoid(),
        username: trimmedUser,
        password: trimmedPass,
        createdAt: now,
        updatedAt: now
      }

      await db.accounts.add(account)
      await this.setCurrentAccount(account.id)
    },

    async login(username: string, password: string) {
      const account = await db.accounts.where('username').equals(username.trim()).first()
      if (!account || account.password !== password.trim()) {
        throw new Error('INVALID_CREDENTIALS')
      }
      await this.setCurrentAccount(account.id)
    },

    async logout() {
      this.clearAccountState()
    },

    async switchAccount(id: string) {
      const account = await db.accounts.get(id)
      if (!account) {
        throw new Error('ACCOUNT_NOT_FOUND')
      }
      await this.setCurrentAccount(account.id)
    },

    async seedOnce() {
      if (!this.currentAccountId) {
        throw new Error('NOT_AUTHENTICATED')
      }

      const existingCount = await db.characters.where('accountId').equals(this.currentAccountId).count()
      if (existingCount) return

      const now = Date.now()

      const char: Character = {
        id: nanoid(),
        accountId: this.currentAccountId,
        name: 'Cliff',
        level: 1,
        money: 0,
        token: 0,
        attributes: { str: 1, int: 1, dex: 1, vit: 1, wis: 1 },
        createdAt: now,
        updatedAt: now
      }

      const plan: Plan = {
        id: nanoid(),
        characterId: char.id,
        name: '每日習慣',
        resetRule: 'daily',
        sortOrder: 1,
        createdAt: now,
        updatedAt: now
      }

      const tasks: Task[] = [
        {
          id: nanoid(),
          planId: plan.id,
          name: '早睡',
          reward: { type: 'attr', key: 'vit', amount: 1 },
          repeatable: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: nanoid(),
          planId: plan.id,
          name: '30 分鐘閱讀',
          reward: { type: 'money', amount: 10 },
          repeatable: false,
          createdAt: now,
          updatedAt: now
        },
        {
          id: nanoid(),
          planId: plan.id,
          name: '打坐 20 分鐘',
          reward: { type: 'token', amount: 1 },
          repeatable: false,
          createdAt: now,
          updatedAt: now
        }
      ]

      await db.transaction('rw', db.characters, db.plans, db.tasks, async () => {
        await db.characters.add(char)
        await db.plans.add(plan)
        await db.tasks.bulkAdd(tasks)
      })

      this.setCurrentChar(char.id)
    },

    async getCharacter() {
      if (!this.currentAccountId || !this.currentCharId) return undefined
      const character = await db.characters.get(this.currentCharId)
      if (!character || character.accountId !== this.currentAccountId) return undefined
      return character
    },

    async listPlans() {
      if (!this.currentCharId) return []
      return db.plans.where('characterId').equals(this.currentCharId).sortBy('sortOrder')
    },

    async listTasks(planId: string) {
      return db.tasks.where('planId').equals(planId).toArray()
    },

    async isCompletedToday(taskId: string) {
      return !!(await db.completions
        .where({ taskId, periodKey: todayKey(), undone: undefined })
        .first())
    },

    async completeTask(task: Task) {
      if (!this.currentCharId) throw new Error('CHARACTER_NOT_SELECTED')
      const plan = await db.plans.get(task.planId)
      if (!plan) throw new Error('PLAN_NOT_FOUND')
      if (plan.characterId !== this.currentCharId) throw new Error('PLAN_MISMATCH')
      const character = await db.characters.get(this.currentCharId)
      if (!character || character.accountId !== this.currentAccountId) throw new Error('CHAR_NOT_FOUND')

      if (!task.repeatable) {
        const done = await db.completions
          .where({ taskId: task.id, periodKey: todayKey(), undone: undefined })
          .first()
        if (done) return
      }

      const completion: TaskCompletion = {
        id: nanoid(),
        taskId: task.id,
        planId: plan.id,
        characterId: character.id,
        ts: Date.now(),
        valueApplied: task.reward,
        periodKey:
          plan.resetRule === 'daily'
            ? todayKey()
            : plan.resetRule === 'weekly'
              ? `W${getWeekKey(new Date())}`
              : undefined
      }

      await db.transaction('rw', db.characters, db.completions, async () => {
        applyRewardToChar(character, task.reward, false)
        character.updatedAt = Date.now()
        await db.characters.put({ ...character })
        await db.completions.add({ ...completion })
        console.log(character)
      })
    },

    async undoTask(taskId: string) {
      if (!this.currentCharId) return
      const completion = await db.completions
        .where({ taskId })
        .reverse()
        .sortBy('ts')
        .then(entries => entries.find(entry => !entry.undone))
      if (!completion) return
      if (completion.characterId !== this.currentCharId) return
      const character = await db.characters.get(this.currentCharId)
      if (!character) return

      await db.transaction('rw', db.characters, db.completions, async () => {
        applyRewardToChar(character, completion.valueApplied, true)
        character.updatedAt = Date.now()
        await db.characters.put({ ...character })
        completion.undone = true
        await db.completions.put({ ...completion })
      })
    }
  }
})

function getWeekKey(d: Date) {
  const year = d.getUTCFullYear()
  const first = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil((((d.getTime() - first.getTime()) / 86400000) + first.getUTCDay() + 1) / 7)
  return `${year}-W${week}`
}

