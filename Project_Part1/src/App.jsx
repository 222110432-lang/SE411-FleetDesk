import { useEffect, useMemo, useState } from 'react'
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
import { seedAssets } from './data/seedAssets'
import { teamMembers } from './data/team'
import {
  addAsset,
  deleteAsset,
  filterAssets,
  getSummary,
  updateAsset,
  STATUSES,
  DEPARTMENTS,
  formatMoney,
} from './domain/assets'
import AssetForm from './components/AssetForm'
import AssetTable from './components/AssetTable'
import Modal from './components/Modal'
import StatusBadge from './components/StatusBadge'

const pages = ['computers', 'overview', 'add', 'about']
const readPage = () =>
  pages.includes(window.location.hash.slice(2)) ? window.location.hash.slice(2) : 'computers'

export default function App() {
  const [assets, setAssets] = useState(() => seedAssets.map((asset) => ({ ...asset })))
  const [page, setPage] = useState(readPage)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [department, setDepartment] = useState('All departments')
  const [sort, setSort] = useState('tag')
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [notice, setNotice] = useState('')
  const summary = useMemo(() => getSummary(assets), [assets])
  const filtered = useMemo(
    () => filterAssets(assets, { query, status, department, sort }),
    [assets, query, status, department, sort],
  )

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

  function saveComputer(values) {
    if (editing) {
      setAssets(updateAsset(assets, editing.id, values))
      setNotice(`${values.tag.trim().toUpperCase()} updated successfully.`)
    } else {
      setAssets(addAsset(assets, values))
      setNotice(`${values.tag.trim().toUpperCase()} added successfully.`)
    }
    setQuery('')
    setStatus('All statuses')
    setDepartment('All departments')
    navigate('computers')
  }

  function confirmDelete() {
    setAssets(deleteAsset(assets, deleting.id))
    setNotice(`${deleting.tag} removed from the inventory.`)
    setDeleting(null)
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
              {key === 'computers' && <span className="nav-count">{assets.length}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <CircleHelp size={18} />
          <div>
            <strong>Demo workspace</strong>
            <p>Changes last until you refresh this page.</p>
          </div>
        </div>
        <div className="sidebar-footer">
          FLEETDESK <span>SE411 · PART 1</span>
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
              assets={assets}
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
                    <span className="number-badge">{assets.length}</span>
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
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>All statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option>All departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="results-bar">
                  <p role="status">
                    {filtered.length} {filtered.length === 1 ? 'computer' : 'computers'}
                    {filtered.length !== assets.length && ` of ${assets.length}`}
                  </p>
                  <label>
                    Sort by{' '}
                    <select
                      aria-label="Sort computers"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="tag">Asset tag</option>
                      <option value="name">Name</option>
                      <option value="cost">Highest cost</option>
                      <option value="purchaseDate">Newest purchase</option>
                    </select>
                  </label>
                </div>
                {filtered.length ? (
                  <AssetTable
                    assets={filtered}
                    onView={setSelected}
                    onEdit={editComputer}
                    onDelete={setDeleting}
                  />
                ) : (
                  <div className="empty-state">
                    <Monitor size={36} />
                    <h3>{assets.length ? 'No matching computers' : 'Your inventory is empty'}</h3>
                    <p>
                      {assets.length
                        ? 'Try another search or clear your filters.'
                        : 'Add your first computer to start keeping track.'}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() =>
                        assets.length
                          ? (setQuery(''),
                            setStatus('All statuses'),
                            setDepartment('All departments'))
                          : navigate('add')
                      }
                    >
                      {assets.length ? 'Clear filters' : 'Add computer'}
                    </button>
                  </div>
                )}
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
                        <strong>{assets.filter((a) => a.department === d).length}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <section className="card maintenance-card">
                <div>
                  <h2>Maintenance queue</h2>
                  <p className="card-subtitle">Computers waiting to return to service</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setQuery('')
                    setDepartment('All departments')
                    setStatus('Maintenance')
                    navigate('computers')
                  }}
                >
                  View computers <ArrowRight size={17} />
                </button>
                {summary.Maintenance ? (
                  <ul>
                    {assets
                      .filter((a) => a.status === 'Maintenance')
                      .map((a) => (
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
            <span>Sample data · Session only</span>
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
        <Modal title="Delete computer?" onClose={() => setDeleting(null)}>
          <p className="delete-copy">
            This will remove <strong>{deleting.name}</strong> ({deleting.tag}) from the current
            inventory. You cannot undo this action.
          </p>
          <div className="form-actions">
            <button autoFocus className="button secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button className="button danger" onClick={confirmDelete}>
              Delete computer
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
          <span className="panel-meta">Fall 2026–27 · Part 1</span>
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
