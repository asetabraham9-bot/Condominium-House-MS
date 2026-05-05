interface StatusBadgeProps {
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'lottery'
    | 'placed'
    | 'active'
    | 'left'
    | 'verified'
    | 'in_progress'
    | 'resolved';
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    lottery: 'bg-blue-100 text-blue-800',
    placed: 'bg-indigo-100 text-indigo-800',
    active: 'bg-green-100 text-green-800',
    left: 'bg-gray-100 text-gray-800',
    verified: 'bg-green-100 text-green-800',
    in_progress: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status]}`}>
      {displayLabel}
    </span>
  );
}