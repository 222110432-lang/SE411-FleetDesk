import { describe, expect, it } from 'vitest'
import { emptyAsset, validateAsset, formatMoney } from '../src/domain/assets'

const valid = {
  ...emptyAsset,
  tag: 'PC-2000',
  name: 'Test computer',
  serial: 'TEST-2000',
  location: 'IT store',
  purchaseDate: '2025-01-01',
  cost: '4200.50',
}

describe('Client-side form validation', () => {
  it('accepts a complete record', () => expect(validateAsset(valid)).toEqual({}))
  it.each(['tag', 'name', 'serial', 'location', 'purchaseDate'])(
    'requires %s after trimming',
    (field) => expect(validateAsset({ ...valid, [field]: '   ' })[field]).toBeTruthy(),
  )
  it.each(['', '-1', 'NaN', 'Infinity', '1000000.01', '1.234', '1e4', '0x10'])(
    'rejects invalid cost %s',
    (cost) => expect(validateAsset({ ...valid, cost }).cost).toBeTruthy(),
  )
  it.each(['0', '0.01', '1000000'])('accepts cost boundary %s', (cost) =>
    expect(validateAsset({ ...valid, cost }).cost).toBeUndefined(),
  )
  it.each(['2026-02-30', 'not-a-date', '2099-01-01'])(
    'rejects invalid or future date %s',
    (purchaseDate) => expect(validateAsset({ ...valid, purchaseDate }).purchaseDate).toBeTruthy(),
  )
  it('requires an assignee for Assigned', () =>
    expect(validateAsset({ ...valid, status: 'Assigned' }).assignedTo).toBeTruthy())
  it.each(['Available', 'Retired'])('rejects an assignee for %s', (status) =>
    expect(validateAsset({ ...valid, status, assignedTo: 'Someone' }).assignedTo).toBeTruthy(),
  )
  it.each(['type', 'status', 'department'])('rejects an unsupported %s', (field) =>
    expect(validateAsset({ ...valid, [field]: 'Other' })[field]).toBeTruthy(),
  )
  it('limits identifiers and notes', () => {
    const errors = validateAsset({
      ...valid,
      tag: '<script>',
      notes: 'a'.repeat(501),
      name: 'x'.repeat(81),
      serial: 's'.repeat(65),
    })
    expect(errors).toHaveProperty('tag')
    expect(errors).toHaveProperty('notes')
    expect(errors).toHaveProperty('name')
    expect(errors).toHaveProperty('serial')
  })
  it('formats currency in SAR', () => expect(formatMoney(1250.5)).toContain('1,250.50'))
})
