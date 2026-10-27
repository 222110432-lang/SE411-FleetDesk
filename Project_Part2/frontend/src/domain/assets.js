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

export function validateAsset(values) {
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

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(value)
