import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'

async function openAdd(user) {
  await user.click(screen.getByRole('button', { name: 'Add computer' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add computer')
}

async function completeForm(user, name = 'Acer Swift Test') {
  await user.type(screen.getByLabelText('Computer name', { exact: false }), name)
  await user.type(screen.getByLabelText('Asset tag', { exact: false }), 'PC-2000')
  await user.type(screen.getByLabelText('Serial number', { exact: false }), 'TEST-SERIAL-2000')
  await user.type(screen.getByLabelText('Location', { exact: false }), 'Riyadh office')
  fireEvent.change(screen.getByLabelText('Purchase date', { exact: false }), {
    target: { value: '2026-01-01' },
  })
  await user.type(screen.getByLabelText('Purchase cost (SAR)', { exact: false }), '2500')
}

describe('FleetDesk user workflows', () => {
  it('displays the seeded inventory and session lifetime', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Computer inventory')
    expect(screen.getAllByRole('row')).toHaveLength(13)
    expect(screen.getByText('Changes last until you refresh this page.')).toBeInTheDocument()
  })

  it('navigates to overview and the required team page', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Overview' }))
    expect(screen.getByRole('heading', { name: 'Maintenance queue' })).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'About & team' }))
    expect(screen.getByRole('heading', { name: 'Meet the team' })).toBeInTheDocument()
    const cards = document.querySelectorAll('.team-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('ABDULLAH NAIF ALORABI')
    expect(cards[0]).toHaveTextContent('222110432')
    expect(cards[1]).toHaveTextContent('Yousef khalid alyousef')
    expect(cards[1]).toHaveTextContent('222110269')
    expect(screen.queryByText('Name and student ID pending')).not.toBeInTheDocument()
  })

  it('adds a valid computer, displays success and retains it across navigation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAdd(user)
    await completeForm(user)
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    expect(screen.getByText('PC-2000 added successfully.')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(14)
    await user.click(screen.getByRole('link', { name: 'Overview' }))
    await user.click(screen.getByRole('link', { name: /Computers/ }))
    expect(screen.getByRole('button', { name: 'View PC-2000 details' })).toHaveTextContent(
      'Acer Swift Test',
    )
  })

  it('shows field errors and focuses the first invalid field on an empty submission', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAdd(user)
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please correct the highlighted fields.')
    expect(screen.getByLabelText('Asset tag', { exact: false })).toHaveFocus()
    expect(screen.getByLabelText('Computer name', { exact: false })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('prevents a duplicate asset tag during editing', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit PC-1001' }))
    await user.clear(screen.getByLabelText('Asset tag', { exact: false }))
    await user.type(screen.getByLabelText('Asset tag', { exact: false }), 'PC-1002')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('This asset tag already exists.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit computer')
  })

  it('edits a computer and immediately updates the inventory', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit PC-1001' }))
    await user.clear(screen.getByLabelText('Computer name', { exact: false }))
    await user.type(
      screen.getByLabelText('Computer name', { exact: false }),
      'Updated design laptop',
    )
    await user.selectOptions(screen.getByLabelText('Status', { exact: false }), 'Available')
    expect(screen.getByLabelText('Assigned to', { exact: false })).toHaveValue('')
    expect(screen.getByLabelText('Assigned to', { exact: false })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('PC-1001 updated successfully.')).toBeInTheDocument()
    const row = screen.getByRole('button', { name: 'View PC-1001 details' }).closest('tr')
    expect(within(row).getByText('Available')).toBeInTheDocument()
    expect(within(row).getByText('Updated design laptop')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(13)
  })

  it('requires an assignee when the status is Assigned', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAdd(user)
    await completeForm(user)
    await user.selectOptions(screen.getByLabelText('Status', { exact: false }), 'Assigned')
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    expect(screen.getByText('Enter the person or team using this computer.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Assigned to', { exact: false }), 'QA team')
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    expect(screen.getByText('QA team')).toBeInTheDocument()
  })

  it('cancels and then confirms deletion of the selected computer', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Delete PC-1001' }))
    expect(screen.getByRole('dialog', { name: 'Delete computer?' })).toHaveTextContent(
      'MacBook Pro 14',
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'View PC-1001 details' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete PC-1001' }))
    await user.click(screen.getByRole('button', { name: 'Delete computer' }))
    expect(screen.queryByRole('button', { name: 'View PC-1001 details' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(12)
    expect(screen.getByText('PC-1001 removed from the inventory.')).toBeInTheDocument()
  })

  it('shows full details and opens edit from the details dialog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'View PC-1001 details' }))
    const dialog = screen.getByRole('dialog', { name: 'MacBook Pro 14' })
    expect(within(dialog).getByText('FD-MBP-001')).toBeInTheDocument()
    expect(within(dialog).getByText('2026-01-12')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Edit computer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Computer name', { exact: false })).toHaveValue('MacBook Pro 14')
  })

  it('handles native dialog cancel and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: 'View PC-1001 details' })
    await user.click(trigger)
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('combines search and filters and recovers from no matching results', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'Search computers' }), 'laptop')
    await user.selectOptions(
      screen.getByLabelText('Filter by status', { exact: false }),
      'Available',
    )
    await user.selectOptions(screen.getByLabelText('Filter by department', { exact: false }), 'IT')
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await user.type(screen.getByRole('textbox', { name: 'Search computers' }), ' unmatched')
    expect(screen.getByRole('heading', { name: 'No matching computers' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getAllByRole('row')).toHaveLength(13)
  })

  it('sorts the table by highest cost', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByLabelText('Sort computers', { exact: false }), 'cost')
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Lenovo ThinkStation P3')
  })

  it('cancels an edit without changing the original record', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Edit PC-1001' }))
    await user.clear(screen.getByLabelText('Computer name', { exact: false }))
    await user.type(screen.getByLabelText('Computer name', { exact: false }), 'Unsaved name')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'View PC-1001 details' })).toHaveTextContent(
      'MacBook Pro 14',
    )
  })

  it('renders entered markup as text rather than executable HTML', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAdd(user)
    await completeForm(user, '<img src=x onerror=alert(1)>')
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    expect(screen.getByRole('button', { name: 'View PC-2000 details' })).toHaveTextContent(
      '<img src=x onerror=alert(1)>',
    )
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })

  it('starts from the sample objects again when the application is remounted', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Delete PC-1001' }))
    await user.click(screen.getByRole('button', { name: 'Delete computer' }))
    first.unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'View PC-1001 details' })).toBeInTheDocument()
  })

  it('moves skip-link focus without changing the current route', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'About & team' }))
    await user.click(screen.getByRole('link', { name: 'Skip to content' }))
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('About FleetDesk')
    expect(window.location.hash).toBe('#/about')
  })
})
