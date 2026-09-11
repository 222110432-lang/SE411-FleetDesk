import { describe, expect, it } from 'vitest'
import {
  addAsset,
  AssetValidationError,
  deleteAsset,
  emptyAsset,
  filterAssets,
  getSummary,
  updateAsset,
  validateAsset,
} from '../src/domain/assets'
import { seedAssets } from '../src/data/seedAssets'

const valid = {
  ...emptyAsset,
  tag: 'PC-2000',
  name: 'Test computer',
  serial: 'TEST-2000',
  location: 'IT store',
  purchaseDate: '2026-01-01',
  cost: '4200.50',
}

describe('Computer record validation', () => {
  it('accepts every supplied demonstration record', () => {
    for (const asset of seedAssets) expect(validateAsset(asset, seedAssets, asset.id)).toEqual({})
  })
  it('accepts a valid new computer', () => expect(validateAsset(valid, seedAssets)).toEqual({}))
  it.each(['tag', 'name', 'serial', 'location', 'purchaseDate'])(
    'requires %s after trimming whitespace',
    (field) => expect(validateAsset({ ...valid, [field]: '   ' })[field]).toBeTruthy(),
  )
  it('rejects duplicate tags irrespective of whitespace or letter case', () =>
    expect(validateAsset({ ...valid, tag: ' pc-1001 ' }, seedAssets).tag).toBeTruthy())
  it('rejects duplicate serials irrespective of letter case', () =>
    expect(validateAsset({ ...valid, serial: 'fd-mbp-001' }, seedAssets).serial).toBeTruthy())
  it('permits unchanged identifiers when editing the same record', () =>
    expect(validateAsset(seedAssets[0], seedAssets, seedAssets[0].id)).toEqual({}))
  it.each(['', '-1', 'NaN', 'Infinity', '1000000.01', '1.234', '1e4', '0x10'])(
    'rejects invalid purchase cost %s',
    (cost) => expect(validateAsset({ ...valid, cost }).cost).toBeTruthy(),
  )
  it.each(['0', '0.01', '1000000'])('accepts valid cost boundary %s', (cost) =>
    expect(validateAsset({ ...valid, cost }).cost).toBeUndefined(),
  )
  it.each(['2026-02-30', 'not-a-date', '2099-01-01'])(
    'rejects invalid or future date %s',
    (purchaseDate) => expect(validateAsset({ ...valid, purchaseDate }).purchaseDate).toBeTruthy(),
  )
  it('requires an assignee for an assigned computer', () =>
    expect(validateAsset({ ...valid, status: 'Assigned' }).assignedTo).toBeTruthy())
  it.each(['Available', 'Retired'])('does not permit assignees for %s computers', (status) =>
    expect(validateAsset({ ...valid, status, assignedTo: 'Someone' }).assignedTo).toBeTruthy(),
  )
  it.each(['type', 'status', 'department'])('rejects an unsupported %s', (field) =>
    expect(validateAsset({ ...valid, [field]: 'Other' })[field]).toBeTruthy(),
  )
  it('rejects an unsafe asset tag format and oversized notes', () => {
    const errors = validateAsset({ ...valid, tag: '<script>', notes: 'a'.repeat(501) })
    expect(errors.tag).toBeTruthy()
    expect(errors.notes).toBeTruthy()
  })
})

describe('Immutable create, update and delete operations', () => {
  it('adds and normalizes a record with an independent unique identity', () => {
    const result = addAsset(seedAssets, { ...valid, name: '  New computer  ', tag: 'pc-2000' })
    expect(result).toHaveLength(13)
    expect(result[12]).toMatchObject({ name: 'New computer', tag: 'PC-2000', cost: 4200.5 })
    expect(result[12].id).toBeTruthy()
    expect(seedAssets).toHaveLength(12)
  })
  it('enforces validation at the data operation boundary', () =>
    expect(() => addAsset(seedAssets, { ...valid, cost: '-2' })).toThrow(AssetValidationError))
  it('updates only the requested record while keeping its identity', () => {
    const before = structuredClone(seedAssets)
    const result = updateAsset(seedAssets, seedAssets[0].id, {
      ...seedAssets[0],
      name: 'Updated name',
    })
    expect(result[0].name).toBe('Updated name')
    expect(result[0].id).toBe(seedAssets[0].id)
    expect(result[1]).toBe(seedAssets[1])
    expect(seedAssets).toEqual(before)
  })
  it('rejects a duplicate tag during editing', () =>
    expect(() =>
      updateAsset(seedAssets, seedAssets[0].id, { ...seedAssets[0], tag: seedAssets[1].tag }),
    ).toThrow(AssetValidationError))
  it('deletes only the selected computer without changing the source array', () => {
    const result = deleteAsset(seedAssets, seedAssets[0].id)
    expect(result).toHaveLength(11)
    expect(result.some((a) => a.id === seedAssets[0].id)).toBe(false)
    expect(seedAssets).toHaveLength(12)
  })
  it('rejects missing records on edit and delete', () => {
    expect(() => updateAsset(seedAssets, 'missing', valid)).toThrow('Computer not found.')
    expect(() => deleteAsset(seedAssets, 'missing')).toThrow('Computer not found.')
  })
})

describe('Search, filtering, sorting and summary', () => {
  it('searches multiple words across name and department irrespective of case', () =>
    expect(filterAssets(seedAssets, { query: '  DELL engineering ' }).map((a) => a.tag)).toEqual([
      'PC-1002',
    ]))
  it('searches serial numbers and notes', () => {
    expect(filterAssets(seedAssets, { query: 'fd-mbp-001' })).toHaveLength(1)
    expect(filterAssets(seedAssets, { query: 'battery' })[0].tag).toBe('PC-1010')
  })
  it('combines search, status and department filters', () =>
    expect(
      filterAssets(seedAssets, { query: 'laptop', status: 'Available', department: 'IT' }).map(
        (a) => a.tag,
      ),
    ).toEqual(['PC-1003', 'PC-1011']))
  it('returns no records for an unknown search', () =>
    expect(filterAssets(seedAssets, { query: 'not present anywhere' })).toEqual([]))
  it('sorts cost numerically without reordering the original collection', () => {
    const before = seedAssets.map((a) => a.id)
    expect(filterAssets(seedAssets, { sort: 'cost' })[0].tag).toBe('PC-1007')
    expect(seedAssets.map((a) => a.id)).toEqual(before)
  })
  it('sorts newest purchase first', () =>
    expect(filterAssets(seedAssets, { sort: 'purchaseDate' })[0].tag).toBe('PC-1011'))
  it('sorts names alphabetically', () =>
    expect(filterAssets(seedAssets, { sort: 'name' })[0].name).toBe('Dell Latitude 5440'))
  it('calculates totals and excludes retired computers from the assignment rate', () =>
    expect(getSummary(seedAssets)).toEqual({
      total: 12,
      value: 74588,
      Assigned: 6,
      Available: 3,
      Maintenance: 2,
      Retired: 1,
      assignmentRate: 55,
    }))
  it('handles an empty or fully retired collection without dividing by zero', () => {
    expect(getSummary([])).toMatchObject({ total: 0, value: 0, assignmentRate: 0 })
    expect(getSummary([seedAssets[11]]).assignmentRate).toBe(0)
  })
})
