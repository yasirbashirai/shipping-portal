/**
 * Website source badge — CD (blue) or NV (teal)
 * @param {{ source: string }} props
 */
export default function WebsiteBadge({ source }) {
  const isCD = source === 'CABINETS_DEALS';
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${
        isCD ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
      }`}
      data-testid="website-badge"
      title={isCD ? 'cabinets.deals' : 'northvillecabinetry.com'}
    >
      {isCD ? 'CD' : 'NV'}
    </span>
  );
}
