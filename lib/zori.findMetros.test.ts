import { describe, expect, it } from 'vitest'

import { findMetros } from './zori'

describe('a typed city, found in the rent data', () => {
  it('finds the metro and its state for a bare or state-qualified city', async () => {
    expect((await findMetros('Dallas')).map((m) => [m.value, m.stateCode])).toEqual([['Dallas, TX', 'TX']])
    expect((await findMetros('charlotte', 'NC')).map((m) => m.value)).toEqual(['Charlotte, NC'])
    expect((await findMetros('Dallas Fort Worth')).map((m) => m.value)).toEqual(['Dallas, TX'])
  })

  it('returns each place for a name in several states, and nothing for a non-place', async () => {
    expect((await findMetros('Portland')).map((m) => m.value).sort()).toEqual(['Portland, ME', 'Portland, OR'])
    expect(await findMetros('how much is utilities')).toEqual([])
    expect(await findMetros('SA')).toEqual([])
  })

  it('prices Washington, DC in DC, though the data also lists it under VA', async () => {
    expect((await findMetros('Washington', 'DC')).map((m) => [m.value, m.stateCode])).toEqual([['Washington, DC', 'DC']])
  })
})
