export const STATUSES = ['Assigned', 'Available', 'Maintenance', 'Retired']
export const TYPES = ['Laptop', 'Desktop', 'Workstation']
export const DEPARTMENTS = ['Engineering', 'Design', 'Operations', 'Finance', 'People', 'IT']
export const emptyAsset = {
  tag: '',
  name: '',
  serial: '',
  type: 'Laptop',
  status: 'Available',
  department: 'IT',
  assignedTo: '',
  location: '',
  purchaseDate: '',
  cost: '',
  notes: '',
}
const text = (value) => (typeof value === 'string' ? value.trim() : '')

export function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function validateAsset(values, assets = [], editingId = null) {
  const errors = {}
  const required = {
    tag: 'Asset tag',
    name: 'Computer name',
    serial: 'Serial number',
    location: 'Location',
    purchaseDate: 'Purchase date',
  }
  for (const [field, label] of Object.entries(required))
    if (!text(values[field])) errors[field] = `${label} is required.`
  const tag = text(values.tag).toUpperCase()
  if (tag && !/^[A-Z0-9][A-Z0-9-]{1,23}$/.test(tag))
    errors.tag = 'Use 2–24 letters, numbers, or hyphens. Start with a letter or number.'
  if (tag && assets.some((asset) => asset.id !== editingId && asset.tag.toUpperCase() === tag))
    errors.tag = 'This asset tag already exists.'
  const serial = text(values.serial).toUpperCase()
  if (
    serial &&
    assets.some((asset) => asset.id !== editingId && asset.serial.toUpperCase() === serial)
  )
    errors.serial = 'This serial number already exists.'
  for (const [field, limit] of Object.entries({
    name: 80,
    serial: 64,
    assignedTo: 80,
    location: 100,
    notes: 500,
  }))
    if (text(values[field]).length > limit) errors[field] = `Use ${limit} characters or fewer.`
  if (!TYPES.includes(values.type)) errors.type = 'Choose a valid computer type.'
  if (!STATUSES.includes(values.status)) errors.status = 'Choose a valid status.'
  if (!DEPARTMENTS.includes(values.department)) errors.department = 'Choose a valid department.'
  if (values.status === 'Assigned' && !text(values.assignedTo))
    errors.assignedTo = 'Enter the person or team using this computer.'
  if (['Available', 'Retired'].includes(values.status) && text(values.assignedTo))
    errors.assignedTo = 'Available and retired computers must be unassigned.'
  const date = text(values.purchaseDate)
  const parsedDate = new Date(`${date}T00:00:00.000Z`)
  if (
    date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date)
  )
    errors.purchaseDate = 'Enter a valid purchase date.'
  else if (date > localToday()) errors.purchaseDate = 'Purchase date cannot be in the future.'
  const cost = String(values.cost ?? '').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(cost) || !Number.isFinite(Number(cost)) || Number(cost) > 1000000)
    errors.cost = 'Enter a cost from 0 to 1,000,000 SAR, with up to 2 decimal places.'
  return errors
}

export class AssetValidationError extends Error {
  constructor(errors) {
    super('Please correct the highlighted fields.')
    this.name = 'AssetValidationError'
    this.errors = errors
  }
}

function normalizeAsset(values) {
  return {
    tag: text(values.tag).toUpperCase(),
    name: text(values.name),
    serial: text(values.serial).toUpperCase(),
    type: values.type,
    status: values.status,
    department: values.department,
    assignedTo: text(values.assignedTo),
    location: text(values.location),
    purchaseDate: text(values.purchaseDate),
    cost: Number(values.cost),
    notes: text(values.notes),
  }
}

function ensureValid(values, assets, editingId = null) {
  const errors = validateAsset(values, assets, editingId)
  if (Object.keys(errors).length) throw new AssetValidationError(errors)
}

export function addAsset(assets, values) {
  ensureValid(values, assets)
  return [...assets, { ...normalizeAsset(values), id: crypto.randomUUID() }]
}

export function updateAsset(assets, id, values) {
  if (!assets.some((asset) => asset.id === id)) throw new Error('Computer not found.')
  ensureValid(values, assets, id)
  return assets.map((asset) => (asset.id === id ? { ...normalizeAsset(values), id } : asset))
}

export function deleteAsset(assets, id) {
  if (!assets.some((asset) => asset.id === id)) throw new Error('Computer not found.')
  return assets.filter((asset) => asset.id !== id)
}

export function filterAssets(
  assets,
  { query = '', status = 'All statuses', department = 'All departments', sort = 'tag' } = {},
) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  const result = assets.filter((asset) => {
    const searchable = [
      asset.tag,
      asset.name,
      asset.serial,
      asset.type,
      asset.status,
      asset.department,
      asset.assignedTo,
      asset.location,
      asset.notes,
    ]
      .join(' ')
      .toLocaleLowerCase()
    return (
      terms.every((term) => searchable.includes(term)) &&
      (status === 'All statuses' || asset.status === status) &&
      (department === 'All departments' || asset.department === department)
    )
  })
  return result.sort((a, b) =>
    sort === 'cost'
      ? b.cost - a.cost || a.tag.localeCompare(b.tag)
      : sort === 'purchaseDate'
        ? b.purchaseDate.localeCompare(a.purchaseDate) || a.tag.localeCompare(b.tag)
        : String(a[sort === 'name' ? 'name' : 'tag']).localeCompare(
            String(b[sort === 'name' ? 'name' : 'tag']),
            undefined,
            { numeric: true },
          ),
  )
}

export function getSummary(assets) {
  const result = {
    total: assets.length,
    value: 0,
    Assigned: 0,
    Available: 0,
    Maintenance: 0,
    Retired: 0,
  }
  for (const asset of assets) {
    result[asset.status]++
    result.value += Math.round(asset.cost * 100)
  }
  result.value /= 100
  const active = result.total - result.Retired
  result.assignmentRate = active ? Math.round((result.Assigned / active) * 100) : 0
  return result
}

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(value)
