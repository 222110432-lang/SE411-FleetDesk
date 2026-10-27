import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Cpu,
  LayoutDashboard,
  Laptop,
  Monitor,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { computerApi } from './api/computers'
import { teamMembers } from './data/team'
import { STATUSES, DEPARTMENTS, formatMoney } from './domain/assets'
import AssetForm from './components/AssetForm'
import AssetTable from './components/AssetTable'
import Modal from './components/Modal'
import StatusBadge from './components/StatusBadge'

const pages = ['computers', 'overview', 'add', 'about']
const readPage = () =>
  pages.includes(window.location.hash.slice(2)) ? window.location.hash.slice(2) : 'computers'

export default function App() {
  const [assets, setAssets] = useState([])
  const [page, setPage] = useState(readPage)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [department, setDepartment] = useState('All departments')
  const [sort, setSort] = useState('tag')
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [notice, setNotice] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [result, setResult] = useState({ totalElements: 0, totalPages: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [summary, setSummary] = useState({
    total: 0,
    value: 0,
    Assigned: 0,
    Available: 0,
    Maintenance: 0,
    Retired: 0,
    assignmentRate: 0,
    departments: {},
    maintenance: [],
  })
  const [lookupId, setLookupId] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletePending, setDeletePending] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(query)
      setPageIndex(0)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setLoadError('')
    computerApi
      .list(
        { page: pageIndex, size: pageSize, query: searchQuery, status, department, sort },
        controller.signal,
      )
      .then((data) => {
        if (!active) return
        const lastPage = Math.max(0, data.totalPages - 1)
        if (pageIndex > lastPage) {
          setPageIndex(lastPage)
          return
        }
        setAssets(data.content)
        setResult(data)
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setLoadError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [pageIndex, pageSize, searchQuery, status, department, sort, revision])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setSummaryError('')
    computerApi
      .summary(controller.signal)
      .then((data) => {
        if (active) setSummary({ ...data, ...data.statusCounts })
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setSummaryError(error.message)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [revision])

  function changeFilter(setter, value) {
    setter(value)
    setPageIndex(0)
  }
  function clearFilters() {
    setQuery('')
    setSearchQuery('')
    setStatus('All statuses')
    setDepartment('All departments')
    setPageIndex(0)
  }

  useEffect(() => {
    const handleHash = () => {
      setPage(readPage())
      setEditing(null)
      setSelected(null)
      setDeleting(null)
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  function navigate(next) {
    setEditing(null)
    setPage(next)
    window.location.hash = `/${next}`
  }

  async function saveComputer(values) {
    const saved = editing
      ? await computerApi.update(editing.id, values)
      : await computerApi.create(values)
    setNotice(`${saved.tag} ${editing ? 'updated' : 'added'} successfully. Record ID: ${saved.id}`)
    setQuery(saved.tag)
    setSearchQuery(saved.tag)
    setStatus('All statuses')
    setDepartment('All departments')
    setPageIndex(0)
    setRevision((value) => value + 1)
    navigate('computers')
  }

  async function confirmDelete() {
    if (deletePending) return
    setDeletePending(true)
    setDeleteError('')
    try {
      await computerApi.remove(deleting.id)
      setNotice(`${deleting.tag} removed from the inventory.`)
      setDeleting(null)
      if (assets.length === 1 && pageIndex > 0) setPageIndex(pageIndex - 1)
      setRevision((value) => value + 1)
    } catch (error) {
      setDeleteError(error.message)
    } finally {
      setDeletePending(false)
    }
  }

  async function findById(id) {
    setLookupError('')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim())) {
      setLookupError('Enter a complete record ID from a computer’s details.')
      return
    }
    setLookingUp(true)
    try {
      setSelected(await computerApi.get(id))
    } catch (error) {
      setLookupError(error.status === 404 ? 'No computer has that record ID.' : error.message)
    } finally {
      setLookingUp(false)
    }
  }

  function editComputer(asset) {
    setSelected(null)
    setEditing(asset)
    setPage('computers')
  }

  const pageTitle = editing
    ? 'Edit computer'
    : {
        computers: 'Computer inventory',
        overview: 'Overview',
        add: 'Add computer',
        about: 'About FleetDesk',
      }[page]

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content').focus()
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          href="#/computers"
          className="brand"
          onClick={() => navigate('computers')}
          aria-label="FleetDesk home"
        >
          <span className="brand-mark">
            <Cpu size={23} />
          </span>
          <span>
            fleetdesk<span className="brand-period">.</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">FD</span>
          <div>
            <strong>Company workspace</strong>
            <span>Computer assets</span>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {[
            ['overview', LayoutDashboard, 'Overview'],
            ['computers', Monitor, 'Computers'],
            ['add', Plus, 'Add computer'],
            ['about', Users, 'About & team'],
          ].map(([key, Icon, label]) => (
            <a
              key={key}
              href={`#/${key}`}
              onClick={() => {
                setPage(key)
                setEditing(null)
              }}
              className={`nav-item ${page === key ? 'active' : ''}`}
              aria-current={page === key ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === 'computers' && <span className="nav-count">{summary.total}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <CircleHelp size={18} />
          <div>
            <strong>Demo workspace</strong>
            <p>Your saved changes stay in the inventory.</p>
          </div>
        </div>
        <div className="sidebar-footer">
          FLEETDESK <span>SE411 · PART 2</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace <ChevronRight size={14} />
            <strong>
              {editing
                ? 'Edit computer'
                : page === 'computers'
                  ? 'Computers'
                  : page === 'add'
                    ? 'Add computer'
                    : page === 'about'
                      ? 'About & team'
                      : 'Overview'}
            </strong>
          </span>
          <span className="workspace-label">Computer asset management</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {notice && (
            <div role="status" className="notice">
              <Check size={18} />
              <span>{notice}</span>
              <button
                className="icon-button"
                onClick={() => setNotice('')}
                aria-label="Dismiss notification"
              >
                <X size={17} />
              </button>
            </div>
          )}
          {summaryError && page !== 'about' && (
            <div role="alert" className="request-error">
              <span>Overview could not be refreshed. {summaryError}</span>
              <button
                className="button secondary"
                onClick={() => setRevision((value) => value + 1)}
              >
                Retry overview
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACE, IN ORDER</p>
              <h1>{pageTitle}</h1>
              <p className="subtitle">
                {editing
                  ? `Update the record for ${editing.tag}.`
                  : page === 'computers'
                    ? 'A clear view of every computer and where it belongs.'
                    : page === 'overview'
                      ? 'Track availability, assignments, and your equipment investment.'
                      : page === 'add'
                        ? 'Register a computer in your company inventory.'
                        : 'The project and the people behind it.'}
              </p>
            </div>
            {page === 'computers' && !editing && (
              <button className="button primary" onClick={() => navigate('add')}>
                <Plus size={19} />
                Add computer
              </button>
            )}
          </div>
          {editing || page === 'add' ? (
            <AssetForm
              key={editing?.id || 'new'}
              asset={editing}
              onSave={saveComputer}
              onCancel={() => navigate('computers')}
            />
          ) : page === 'computers' ? (
            <>
              <section className="stats-grid" aria-label="Inventory summary">
                <Stat
                  label="Total computers"
                  value={summary.total}
                  note="Across your company"
                  Icon={Monitor}
                />
                <Stat
                  label="Assigned"
                  value={summary.Assigned}
                  note="Currently with a team"
                  Icon={Users}
                />
                <Stat
                  label="Available"
                  value={summary.Available}
                  note="Ready for the next person"
                  Icon={Laptop}
                  accent
                />
                <Stat
                  label="In maintenance"
                  value={summary.Maintenance}
                  note="Being serviced or repaired"
                  Icon={Cpu}
                />
              </section>
              <section className="inventory-panel" aria-labelledby="inventory-heading">
                <div className="panel-heading">
                  <div className="section-title">
                    <h2 id="inventory-heading">All computers</h2>
                    <span className="number-badge">{summary.total}</span>
                  </div>
                  <span className="panel-meta">One inventory. Every computer.</span>
                </div>
                <div className="toolbar">
                  <div className="search-wrap">
                    <Search size={18} />
                    <input
                      aria-label="Search computers"
                      placeholder="Search name, asset tag, serial or person…"
                      value={query}
                      maxLength={200}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery('')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(e) => changeFilter(setStatus, e.target.value)}
                  >
                    <option>All statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by department"
                    value={department}
                    onChange={(e) => changeFilter(setDepartment, e.target.value)}
                  >
                    <option>All departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <form
                  className="id-lookup"
                  onSubmit={(event) => {
                    event.preventDefault()
                    findById(lookupId)
                  }}
                >
                  <label htmlFor="record-id">Find by record ID</label>
                  <input
                    id="record-id"
                    value={lookupId}
                    onChange={(event) => setLookupId(event.target.value)}
                    placeholder="Paste a record ID from computer details"
                    maxLength={36}
                  />
                  <button className="button secondary" disabled={lookingUp || !lookupId.trim()}>
                    {lookingUp ? 'Finding…' : 'Find computer'}
                  </button>
                </form>
                {lookupError && (
                  <p role="alert" className="lookup-error">
                    {lookupError}
                  </p>
                )}
                <div className="results-bar">
                  <p role="status">
                    {loading
                      ? 'Loading computers…'
                      : `${result.totalElements} matching ${result.totalElements === 1 ? 'computer' : 'computers'}`}
                  </p>
                  <label>
                    Sort by{' '}
                    <select
                      aria-label="Sort computers"
                      value={sort}
                      onChange={(e) => changeFilter(setSort, e.target.value)}
                    >
                      <option value="tag">Asset tag</option>
                      <option value="name">Name</option>
                      <option value="cost">Highest cost</option>
                      <option value="purchaseDate">Newest purchase</option>
                    </select>
                  </label>
                </div>
                {loadError ? (
                  <div role="alert" className="request-error">
                    <span>{loadError}</span>
                    <button
                      className="button secondary"
                      onClick={() => setRevision((value) => value + 1)}
                    >
                      Retry inventory
                    </button>
                  </div>
                ) : loading ? (
                  <div className="empty-state" aria-busy="true">
                    Getting your inventory…
                  </div>
                ) : assets.length ? (
                  <AssetTable
                    assets={assets}
                    onView={(asset) => findById(asset.id)}
                    onEdit={editComputer}
                    onDelete={(asset) => {
                      setDeleteError('')
                      setDeleting(asset)
                    }}
                  />
                ) : (
                  <div className="empty-state">
                    <Monitor size={36} />
                    <h3>{summary.total ? 'No matching computers' : 'Your inventory is empty'}</h3>
                    <p>
                      {summary.total
                        ? 'Try another search or clear your filters.'
                        : 'Add your first computer to start keeping track.'}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => (summary.total ? clearFilters() : navigate('add'))}
                    >
                      {summary.total ? 'Clear filters' : 'Add computer'}
                    </button>
                  </div>
                )}
                <nav className="pagination" aria-label="Inventory pagination">
                  <label>
                    Rows per page{' '}
                    <select
                      aria-label="Rows per page"
                      value={pageSize}
                      onChange={(event) => changeFilter(setPageSize, Number(event.target.value))}
                    >
                      {[5, 10, 20].map((size) => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                  <span>
                    Page {pageIndex + 1} of {Math.max(1, result.totalPages)}
                  </span>
                  <div>
                    <button
                      className="button secondary"
                      disabled={loading || !!loadError || pageIndex === 0}
                      onClick={() => setPageIndex(pageIndex - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="button secondary"
                      disabled={loading || !!loadError || pageIndex + 1 >= result.totalPages}
                      onClick={() => setPageIndex(pageIndex + 1)}
                    >
                      Next
                    </button>
                  </div>
                </nav>
                <div className="table-footer">
                  <span>Asset records · All amounts in SAR</span>
                  <span>{summary.Retired} retired</span>
                </div>
              </section>
            </>
          ) : page === 'overview' ? (
            <>
              <section className="stats-grid" aria-label="Fleet overview">
                <Stat
                  label="Total computers"
                  value={summary.total}
                  note="Tracked in this workspace"
                  Icon={Monitor}
                />
                <Stat
                  label="Purchase value"
                  value={formatMoney(summary.value)}
                  note="Historical cost, including retired assets"
                  Icon={Cpu}
                />
                <Stat
                  label="Assignment rate"
                  value={`${summary.assignmentRate}%`}
                  note="Assigned / non-retired computers"
                  Icon={Users}
                />
                <Stat
                  label="Available"
                  value={summary.Available}
                  note="Ready to assign"
                  Icon={Laptop}
                  accent
                />
              </section>
              <div className="overview-grid">
                <section className="card">
                  <h2>Computer status</h2>
                  <p className="card-subtitle">How your fleet is being used</p>
                  <div className="status-chart">
                    {STATUSES.map((s) => (
                      <div className="bar-row" key={s}>
                        <div>
                          <StatusBadge status={s} />
                          <strong>{summary[s]}</strong>
                        </div>
                        <div className="bar-track">
                          <span
                            className={`bar-fill ${s.toLowerCase()}`}
                            style={{
                              width: `${summary.total ? (summary[s] / summary.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="card">
                  <h2>By department</h2>
                  <p className="card-subtitle">Computer allocation across the company</p>
                  <div className="department-list">
                    {DEPARTMENTS.map((d) => (
                      <div key={d}>
                        <span>{d}</span>
                        <strong>{summary.departments[d] || 0}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <section className="card maintenance-card">
                <div>
                  <h2>Maintenance queue</h2>
                  <p className="card-subtitle">Up to five computers waiting to return to service</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setQuery('')
                    setDepartment('All departments')
                    setStatus('Maintenance')
                    setPageIndex(0)
                    navigate('computers')
                  }}
                >
                  View computers <ArrowRight size={17} />
                </button>
                {summary.Maintenance ? (
                  <ul>
                    {summary.maintenance.map((a) => (
                      <li key={a.id}>
                        <Monitor size={22} />
                        <div>
                          <strong>{a.name}</strong>
                          <span>
                            {a.tag} · {a.location}
                          </span>
                        </div>
                        <StatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="all-clear">No computers are currently in maintenance.</p>
                )}
              </section>
            </>
          ) : (
            <About />
          )}
          <footer className="page-footer">
            <span>FleetDesk · Computer inventory</span>
            <span>Computer asset workspace</span>
          </footer>
        </main>
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="detail-heading">
            <span className="asset-tag">{selected.tag}</span>
            <StatusBadge status={selected.status} />
          </div>
          <dl className="detail-grid">
            {[
              ['Record ID', selected.id],
              ['Serial number', selected.serial],
              ['Computer type', selected.type],
              ['Department', selected.department],
              ['Assigned to', selected.assignedTo || 'Unassigned'],
              ['Location', selected.location],
              ['Purchase date', selected.purchaseDate],
              ['Purchase cost', formatMoney(selected.cost)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="detail-notes">
            <h3>Notes</h3>
            <p>{selected.notes || 'No notes added.'}</p>
          </div>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setSelected(null)}>
              Close
            </button>
            <button className="button primary" onClick={() => editComputer(selected)}>
              Edit computer
            </button>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete computer?"
          onClose={() => {
            if (!deletePending) setDeleting(null)
          }}
        >
          <p className="delete-copy">
            This will remove <strong>{deleting.name}</strong> ({deleting.tag}) from the current
            inventory. You cannot undo this action.
          </p>
          {deleteError && (
            <p role="alert" className="form-error">
              {deleteError}
            </p>
          )}
          <div className="form-actions">
            <button
              autoFocus
              className="button secondary"
              onClick={() => setDeleting(null)}
              disabled={deletePending}
            >
              Cancel
            </button>
            <button className="button danger" onClick={confirmDelete} disabled={deletePending}>
              {deletePending ? 'Deleting…' : 'Delete computer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value, note, Icon, accent = false }) {
  return (
    <article className={`stat-card ${accent ? 'stat-accent' : ''}`}>
      <div className="stat-label">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <strong className="stat-value">{value}</strong>
      <p>{note}</p>
    </article>
  )
}

function About() {
  return (
    <div className="about-content">
      <section className="about-intro">
        <div className="about-icon">
          <Cpu size={34} />
        </div>
        <div>
          <p className="eyebrow">SE411 SOFTWARE CONSTRUCTION</p>
          <h2>A home for your company’s computers.</h2>
          <p>
            FleetDesk helps a company organize its computer assets, see who uses each device, and
            keep records up to date. It brings inventory, search, and equipment status into one
            workspace.
          </p>
        </div>
      </section>
      <section className="team-section">
        <div className="panel-heading">
          <h2>Meet the team</h2>
          <span className="panel-meta">Fall 2026–27 · Part 2</span>
        </div>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <article className="team-card" key={index}>
              <div className="team-avatar">
                {member.name
                  ? member.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : String(index + 1).padStart(2, '0')}
              </div>
              <h3>{member.name || `Team member ${index + 1}`}</h3>
              <p>
                {member.studentId
                  ? `Student ID · ${member.studentId}`
                  : 'Name and student ID pending'}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="card about-scope">
        <h2>What you can do</h2>
        <div>
          <p>
            <strong>Keep records current</strong>Add, view, edit, and remove computer records.
          </p>
          <p>
            <strong>Find the right device</strong>Search across asset tags, serials, people, and
            departments.
          </p>
          <p>
            <strong>See the big picture</strong>Track availability, maintenance, and purchase value.
          </p>
        </div>
      </section>
    </div>
  )
}
