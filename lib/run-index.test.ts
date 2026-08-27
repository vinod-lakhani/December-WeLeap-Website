import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextRunIndex, currentRunIndex } from './run-index'

/**
 * The vitest environment is `node`, so there is no window. These tests install
 * a minimal localStorage-backed one, which is also what lets the
 * storage-unavailable path be exercised deliberately rather than hoped for.
 */
function installWindow(storage?: Partial<Storage>) {
  const backing = new Map<string, string>()
  const fallback: Storage = {
    getItem: (k) => backing.get(k) ?? null,
    setItem: (k, v) => void backing.set(k, String(v)),
    removeItem: (k) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  }
  ;(globalThis as { window?: unknown }).window = {
    localStorage: { ...fallback, ...storage },
  }
  return backing
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window
  vi.restoreAllMocks()
})

describe('nextRunIndex', () => {
  beforeEach(() => installWindow())

  it('starts at 1 and counts up', () => {
    expect(nextRunIndex('rent')).toBe(1)
    expect(nextRunIndex('rent')).toBe(2)
    expect(nextRunIndex('rent')).toBe(3)
  })

  it('counts each tool separately', () => {
    expect(nextRunIndex('rent')).toBe(1)
    expect(nextRunIndex('offer')).toBe(1)
    expect(nextRunIndex('rent')).toBe(2)
    expect(nextRunIndex('offer')).toBe(2)
  })

  it('persists across reads', () => {
    nextRunIndex('rent')
    nextRunIndex('rent')
    expect(currentRunIndex('rent')).toBe(2)
  })

  it('restarts rather than propagating NaN from a corrupted value', () => {
    const backing = installWindow()
    backing.set('wle_runs_rent', 'not-a-number')
    expect(nextRunIndex('rent')).toBe(1)
    expect(nextRunIndex('rent')).toBe(2)
  })

  it('restarts on a negative value', () => {
    const backing = installWindow()
    backing.set('wle_runs_rent', '-5')
    expect(nextRunIndex('rent')).toBe(1)
  })
})

describe('when storage is unavailable', () => {
  it('returns 1 rather than throwing inside an analytics call site', () => {
    installWindow({
      getItem: () => {
        throw new Error('SecurityError: storage disabled')
      },
      setItem: () => {
        throw new Error('SecurityError: storage disabled')
      },
    })
    expect(() => nextRunIndex('rent')).not.toThrow()
    expect(nextRunIndex('rent')).toBe(1)
    expect(currentRunIndex('rent')).toBe(0)
  })

  it('returns 1 on the server, where there is no window at all', () => {
    delete (globalThis as { window?: unknown }).window
    expect(nextRunIndex('rent')).toBe(1)
    expect(currentRunIndex('rent')).toBe(0)
  })
})
