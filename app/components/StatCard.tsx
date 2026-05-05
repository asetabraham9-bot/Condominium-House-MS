import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ icon: Icon, iconColor, title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${iconColor}`} />
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-gray-600 text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
