export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {status}
    </span>
  )
}
