const STATUS_COLORS = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  BOOKED: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
};

/**
 * Colored status badge component
 * @param {{ status: string }} props
 */
export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`} data-testid="status-badge">
      {status.replace('_', ' ')}
    </span>
  );
}
