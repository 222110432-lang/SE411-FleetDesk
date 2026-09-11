import { useId, useRef, useState } from 'react'
import { ArrowLeft, Check, Monitor } from 'lucide-react'
import {
  AssetValidationError,
  DEPARTMENTS,
  emptyAsset,
  localToday,
  STATUSES,
  TYPES,
  validateAsset,
} from '../domain/assets'

export default function AssetForm({ asset, assets, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({ ...emptyAsset, ...asset }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const formRef = useRef(null)
  const prefix = useId()
  const update = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'status' && ['Available', 'Retired'].includes(value) ? { assignedTo: '' } : {}),
    }))
    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
      ...(name === 'status' ? { assignedTo: undefined } : {}),
    }))
    setFormError('')
  }
  function showErrors(next) {
    setErrors(next)
    formRef.current.elements.namedItem(Object.keys(next)[0])?.focus()
  }
  function submit(event) {
    event.preventDefault()
    const next = validateAsset(values, assets, asset?.id)
    if (Object.keys(next).length) {
      showErrors(next)
      return
    }
    try {
      onSave(values)
    } catch (error) {
      if (error instanceof AssetValidationError) showErrors(error.errors)
      else setFormError(error.message || 'The computer could not be saved. Please try again.')
    }
  }
  function field(name, label, options = {}) {
    const id = `${prefix}-${name}`
    const props = {
      id,
      name,
      value: values[name],
      onChange: update,
      'aria-invalid': !!errors[name],
      'aria-describedby': errors[name] ? `${id}-error` : options.hint ? `${id}-hint` : undefined,
      required: options.required,
      disabled: options.disabled,
    }
    return (
      <div className={`field ${options.wide ? 'wide' : ''}`} key={name}>
        <label htmlFor={id}>
          {label}
          {options.required && <span aria-hidden="true"> *</span>}
        </label>
        {options.options ? (
          <select {...props}>
            {options.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : options.multiline ? (
          <textarea
            {...props}
            rows={4}
            maxLength={500}
            placeholder="Useful details, specifications, or maintenance notes"
          />
        ) : (
          <input
            {...props}
            type={options.type || 'text'}
            placeholder={options.placeholder}
            maxLength={options.maxLength}
            min={options.min}
            max={options.max}
            step={options.step}
          />
        )}
        {options.hint && !errors[name] && (
          <p className="field-hint" id={`${id}-hint`}>
            {options.hint}
          </p>
        )}
        {errors[name] && (
          <p className="field-error" id={`${id}-error`}>
            {errors[name]}
          </p>
        )}
      </div>
    )
  }
  return (
    <div className="form-layout">
      <form className="asset-form card" ref={formRef} noValidate onSubmit={submit}>
        <div className="form-section-heading">
          <h2>Computer details</h2>
          <p>Fields marked with * are required.</p>
        </div>
        {Object.values(errors).some(Boolean) && (
          <p role="alert" className="form-error">
            Please correct the highlighted fields.
          </p>
        )}
        {formError && (
          <p role="alert" className="form-error">
            {formError}
          </p>
        )}
        <div className="form-grid">
          {field('name', 'Computer name', {
            required: true,
            maxLength: 80,
            placeholder: 'e.g. Dell Latitude 7450',
            wide: true,
          })}
          {field('tag', 'Asset tag', {
            required: true,
            maxLength: 24,
            placeholder: 'e.g. PC-1013',
            hint: 'A unique company identifier.',
          })}
          {field('serial', 'Serial number', {
            required: true,
            maxLength: 64,
            placeholder: 'Manufacturer serial number',
          })}
          {field('type', 'Computer type', { required: true, options: TYPES })}
          {field('status', 'Status', { required: true, options: STATUSES })}
        </div>
        <div className="form-section-heading divided">
          <h2>Assignment & location</h2>
          <p>Keep track of where this computer belongs.</p>
        </div>
        <div className="form-grid">
          {field('department', 'Department', { required: true, options: DEPARTMENTS })}
          {field('assignedTo', 'Assigned to', {
            required: values.status === 'Assigned',
            disabled: ['Available', 'Retired'].includes(values.status),
            maxLength: 80,
            placeholder: 'Person or team',
            hint: ['Available', 'Retired'].includes(values.status)
              ? 'This status keeps the computer unassigned.'
              : 'Required when the status is Assigned.',
          })}
          {field('location', 'Location', {
            required: true,
            maxLength: 100,
            placeholder: 'e.g. Riyadh · Floor 2',
            wide: true,
          })}
        </div>
        <div className="form-section-heading divided">
          <h2>Purchase information</h2>
        </div>
        <div className="form-grid">
          {field('purchaseDate', 'Purchase date', {
            required: true,
            type: 'date',
            max: localToday(),
          })}
          {field('cost', 'Purchase cost (SAR)', {
            required: true,
            type: 'number',
            min: 0,
            max: 1000000,
            step: '0.01',
            placeholder: '0.00',
          })}
          {field('notes', 'Notes', { multiline: true, wide: true })}
        </div>
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            <Check size={18} />
            {asset ? 'Save changes' : 'Save computer'}
          </button>
        </div>
      </form>
      <aside className="form-aside">
        <span className="aside-icon">
          <Monitor size={27} />
        </span>
        <h3>A little detail goes a long way.</h3>
        <p>
          Use the asset tag on your company label and the serial number printed on the device. Both
          must be unique.
        </p>
        <p>
          Choose <strong>Available</strong> for an unassigned computer, or <strong>Assigned</strong>{' '}
          when someone is using it.
        </p>
        <button className="text-button" onClick={onCancel}>
          <ArrowLeft size={17} />
          Back to inventory
        </button>
      </aside>
    </div>
  )
}
