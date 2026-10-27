import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import AssetForm from '../src/components/AssetForm'
import { computerApi, ApiError } from '../src/api/computers'

const uuid = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`
const record = (number) => ({
  id: uuid(number),
  tag: `PC-${String(number).padStart(2, '0')}`,
  name: `Computer ${number}`,
  serial: `SERIAL-${number}`,
  type: 'Laptop',
  status: 'Available',
  department: 'IT',
  assignedTo: '',
  location: 'Riyadh',
  purchaseDate: '2025-01-01',
  cost: 1000,
  notes: '',
})
const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => structuredClone(body),
})
let records
let fetchMock

async function fakeServer(input, options = {}) {
  const url = new URL(input, 'http://localhost')
  const id = url.pathname.split('/').pop()
  if (id === 'summary')
    return response({
      total: records.length,
      value: records.length * 1000,
      statusCounts: { Assigned: 0, Available: records.length, Maintenance: 0, Retired: 0 },
      assignmentRate: 0,
      departments: { IT: records.length },
      maintenance: [],
    })
  if (options.method === 'POST' || options.method === 'PUT') {
    const data = JSON.parse(options.body)
    if (records.some((row) => row.tag === data.tag && row.id !== id))
      return response(
        { message: 'Duplicate identifiers.', errors: { tag: 'This asset tag already exists.' } },
        409,
      )
    const saved = { ...data, id: options.method === 'POST' ? uuid(99) : id }
    records =
      options.method === 'POST'
        ? [...records, saved]
        : records.map((row) => (row.id === id ? saved : row))
    return response(saved, options.method === 'POST' ? 201 : 200)
  }
  if (options.method === 'DELETE') {
    records = records.filter((row) => row.id !== id)
    return response(null, 204)
  }
  if (id !== 'computers')
    return records.some((row) => row.id === id)
      ? response(records.find((row) => row.id === id))
      : response({ message: 'Computer not found.' }, 404)
  const query = (url.searchParams.get('q') || '').toLowerCase()
  const status = url.searchParams.get('status')
  const department = url.searchParams.get('department')
  const page = Number(url.searchParams.get('page') || 0)
  const size = Number(url.searchParams.get('size') || 5)
  const found = records.filter(
    (row) =>
      `${row.name} ${row.tag}`.toLowerCase().includes(query) &&
      (!status || row.status === status) &&
      (!department || row.department === department),
  )
  return response({
    content: found.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: found.length,
    totalPages: Math.ceil(found.length / size),
    first: page === 0,
    last: (page + 1) * size >= found.length,
  })
}

beforeEach(() => {
  records = Array.from({ length: 12 }, (_, index) => record(index + 1))
  fetchMock = vi.fn(fakeServer)
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

async function loaded() {
  const rendered = render(<App />)
  await screen.findByRole('button', { name: 'View PC-01 details' })
  return rendered
}
async function fillForm(user) {
  await user.type(screen.getByLabelText('Computer name', { exact: false }), 'QA laptop')
  await user.type(screen.getByLabelText('Asset tag', { exact: false }), 'PC-99')
  await user.type(screen.getByLabelText('Serial number', { exact: false }), 'SERIAL-99')
  await user.type(screen.getByLabelText('Location', { exact: false }), 'Riyadh office')
  fireEvent.change(screen.getByLabelText('Purchase date', { exact: false }), {
    target: { value: '2025-01-01' },
  })
  await user.type(screen.getByLabelText('Purchase cost (SAR)', { exact: false }), '2500')
}

describe('Frontend + HTTP integration', () => {
  it('loads a server page of five and a summary of all twelve', async () => {
    await loaded()
    expect(screen.getAllByRole('row')).toHaveLength(6)
    expect(screen.getByText('12 matching computers')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Your saved changes stay in the inventory.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/computers/summary')).toBe(true)
  })

  it('requests the next page from the server and resets paging after search', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('button', { name: 'View PC-06 details' })
    expect(screen.queryByRole('button', { name: 'View PC-01 details' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => url.includes('page=1&size=5'))).toBe(true)
    await user.type(screen.getByRole('textbox', { name: 'Search computers' }), 'PC-12')
    await screen.findByRole('button', { name: 'View PC-12 details' })
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })

  it('changes page size without downloading the whole collection', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.selectOptions(screen.getByLabelText('Rows per page'), '10')
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(11))
    expect(fetchMock.mock.calls.some(([url]) => url.includes('size=10'))).toBe(true)
  })

  it('finds a computer by its exact ID and shows that ID in details', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.type(screen.getByLabelText('Find by record ID'), uuid(12))
    await user.click(screen.getByRole('button', { name: 'Find computer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Computer 12' })
    expect(within(dialog).getByText(uuid(12))).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => url === `/api/computers/${uuid(12)}`)).toBe(true)
  })

  it('distinguishes an invalid ID from a missing record', async () => {
    const user = userEvent.setup()
    await loaded()
    const input = screen.getByLabelText('Find by record ID')
    await user.type(input, 'PC-01')
    await user.click(screen.getByRole('button', { name: 'Find computer' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a complete record ID')
    await user.clear(input)
    await user.type(input, uuid(999))
    await user.click(screen.getByRole('button', { name: 'Find computer' }))
    expect(await screen.findByText('No computer has that record ID.')).toBeInTheDocument()
  })

  it('creates through POST and preserves data across frontend remounts', async () => {
    const user = userEvent.setup()
    const first = await loaded()
    await user.click(screen.getByRole('button', { name: 'Add computer' }))
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    await screen.findByRole('button', { name: 'View PC-99 details' })
    const call = fetchMock.mock.calls.find(([, options]) => options.method === 'POST')
    expect(JSON.parse(call[1].body)).toMatchObject({ name: 'QA laptop', cost: 2500 })
    expect(JSON.parse(call[1].body)).not.toHaveProperty('id')
    first.unmount()
    await loaded()
    await user.type(screen.getByLabelText('Find by record ID'), uuid(99))
    await user.click(screen.getByRole('button', { name: 'Find computer' }))
    expect(await screen.findByRole('dialog', { name: 'QA laptop' })).toBeInTheDocument()
  })

  it('updates through PUT while retaining the existing ID', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Edit PC-01' }))
    const name = screen.getByLabelText('Computer name', { exact: false })
    await user.clear(name)
    await user.type(name, 'Renamed computer')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('button', { name: 'View PC-01 details' })).toHaveTextContent(
      'Renamed computer',
    )
    expect(records[0].id).toBe(uuid(1))
    expect(
      fetchMock.mock.calls.some(
        ([url, options]) => url.endsWith(uuid(1)) && options.method === 'PUT',
      ),
    ).toBe(true)
  })

  it('shows duplicate errors returned by the backend, including records on other pages', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Edit PC-01' }))
    const tag = screen.getByLabelText('Asset tag', { exact: false })
    await user.clear(tag)
    await user.type(tag, 'PC-12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('This asset tag already exists.')).toBeInTheDocument()
    expect(tag).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit computer')
  })

  it('cancels deletion without a request, then deletes with confirmation', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.click(screen.getByRole('button', { name: 'Delete PC-01' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(fetchMock.mock.calls.some(([, options]) => options.method === 'DELETE')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Delete PC-01' }))
    await user.click(screen.getByRole('button', { name: 'Delete computer' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'View PC-01 details' })).not.toBeInTheDocument(),
    )
    expect(records).toHaveLength(11)
  })

  it('keeps the delete dialog open when the server rejects deletion', async () => {
    const user = userEvent.setup()
    await loaded()
    fetchMock.mockImplementation((url, options) =>
      options.method === 'DELETE'
        ? Promise.resolve(response({ message: 'Please retry deletion.' }, 500))
        : fakeServer(url, options),
    )
    await user.click(screen.getByRole('button', { name: 'Delete PC-01' }))
    await user.click(screen.getByRole('button', { name: 'Delete computer' }))
    expect(await screen.findByText('Please retry deletion.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(records).toHaveLength(12)
  })

  it('offers a retry after an inventory network failure', async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((url, options) =>
      url.includes('?') ? Promise.reject(new TypeError('offline')) : fakeServer(url, options),
    )
    render(<App />)
    await screen.findByRole('button', { name: 'Retry inventory' })
    expect(screen.getByText(/Cannot reach the server/)).toBeInTheDocument()
    fetchMock.mockImplementation(fakeServer)
    await user.click(screen.getByRole('button', { name: 'Retry inventory' }))
    expect(await screen.findByRole('button', { name: 'View PC-01 details' })).toBeInTheDocument()
  })

  it('does not let an older request replace newer search results', async () => {
    let resolveOld
    const old = new Promise((resolve) => {
      resolveOld = resolve
    })
    fetchMock.mockImplementation((url, options) =>
      url.includes('?') && !new URL(url, 'http://localhost').searchParams.get('q')
        ? old
        : fakeServer(url, options),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('Search computers'), 'PC-12')
    await screen.findByRole('button', { name: 'View PC-12 details' })
    await act(async () =>
      resolveOld(response({ content: [record(1)], totalElements: 1, totalPages: 1 })),
    )
    expect(screen.queryByRole('button', { name: 'View PC-01 details' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View PC-12 details' })).toBeInTheDocument()
  })

  it('shows the current three-person team and moves skip-link focus', async () => {
    const user = userEvent.setup()
    await loaded()
    await user.click(screen.getByRole('link', { name: 'About & team' }))
    expect(document.querySelectorAll('.team-card')).toHaveLength(3)
    for (const id of ['222110432', '222110269', '221110016'])
      expect(screen.getByText(`Student ID · ${id}`)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Skip to content' }))
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('waits for the save response and prevents duplicate form submissions', async () => {
    let resolveSave
    const onSave = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        }),
    )
    const user = userEvent.setup()
    render(<AssetForm asset={record(1)} onSave={onSave} onCancel={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(onSave).toHaveBeenCalledTimes(1)
    await act(async () => resolveSave())
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  })

  it('rejects an empty form and focuses the first invalid field', async () => {
    const user = userEvent.setup()
    render(<AssetForm onSave={vi.fn()} onCancel={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Save computer' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please correct')
    expect(screen.getByLabelText('Asset tag', { exact: false })).toHaveFocus()
  })

  it('retains entered fields after a save network error', async () => {
    const user = userEvent.setup()
    render(
      <AssetForm
        asset={record(1)}
        onSave={() => Promise.reject(new Error('Server unavailable.'))}
        onCancel={() => {}}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Server unavailable.')).toBeInTheDocument()
    expect(screen.getByLabelText('Computer name', { exact: false })).toHaveValue('Computer 1')
  })

  it('reports malformed JSON responses and preserves request cancellation', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.reject(new Error('invalid json')),
    })
    await expect(computerApi.get(uuid(1))).rejects.toBeInstanceOf(ApiError)
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    await expect(computerApi.get(uuid(1))).rejects.toHaveProperty('name', 'AbortError')
  })
})
