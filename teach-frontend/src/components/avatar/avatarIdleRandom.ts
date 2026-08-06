export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

export function randomChance(probability: number): boolean {
  return Math.random() < probability
}

export function randomPick<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)]
  if (item === undefined) {
    throw new Error('randomPick called with empty array')
  }
  return item
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j] as T
    copy[j] = tmp as T
  }
  return copy
}

export function sleep(ms: number, signal?: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (signal?.cancelled) {
        return
      }
      resolve()
    }, ms)
  })
}
