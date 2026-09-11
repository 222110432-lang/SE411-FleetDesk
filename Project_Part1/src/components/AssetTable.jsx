import { Laptop, Monitor, Pencil, Trash2 } from 'lucide-react'
import { formatMoney } from '../domain/assets'
import StatusBadge from './StatusBadge'

export default function AssetTable({ assets, onView, onEdit, onDelete }) {
  return (
    <div className="table-scroll" role="region" aria-label="Computer inventory table" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th scope="col">Computer</th>
            <th scope="col">Status</th>
            <th scope="col">Assigned to</th>
            <th scope="col">Department</th>
            <th scope="col" className="money-cell">
              Purchase cost
            </th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>
                <div className="computer-cell">
                  <div className={`device-icon ${asset.type === 'Laptop' ? 'laptop' : ''}`}>
                    {asset.type === 'Laptop' ? <Laptop size={22} /> : <Monitor size={22} />}
                  </div>
                  <div>
                    <button
                      className="asset-name"
                      onClick={() => onView(asset)}
                      aria-label={`View ${asset.tag} details`}
                    >
                      {asset.name}
                    </button>
                    <span className="asset-meta">
                      {asset.tag}
                      <span>·</span>
                      {asset.type}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <StatusBadge status={asset.status} />
              </td>
              <td className={!asset.assignedTo ? 'muted' : ''}>
                {asset.assignedTo || 'Unassigned'}
              </td>
              <td>{asset.department}</td>
              <td className="money-cell">{formatMoney(asset.cost)}</td>
              <td>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${asset.tag}`}
                    title={`Edit ${asset.tag}`}
                    onClick={() => onEdit(asset)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button delete-action"
                    aria-label={`Delete ${asset.tag}`}
                    title={`Delete ${asset.tag}`}
                    onClick={() => onDelete(asset)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
