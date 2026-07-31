import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Trash2, 
  UserCheck, 
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { Complaint } from '../types';
import { getStatusColor, getPriorityColor } from '../utils/colors';
import { formatDate } from '../utils/formatters';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ComplaintTableProps {
  complaints: Complaint[];
  onDelete?: (id: string) => void;
  onAssignToggle?: (complaint: Complaint) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({ 
  complaints, 
  onDelete,
  onAssignToggle 
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <tr>
            <th className="px-6 py-4">Grievance ID</th>
            <th className="px-6 py-4">Citizen</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">District</th>
            <th className="px-6 py-4">Date Filed</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {complaints.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">📋</span>
                  <span className="font-bold">No grievances found matching criteria.</span>
                </div>
              </td>
            </tr>
          ) : (
            complaints.map(c => (
              <tr 
                key={c.id} 
                className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
              >
                <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                  {c.id}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.citizenName}</span>
                    <span className="text-[10px] text-slate-400">{c.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-700 dark:text-slate-350">{c.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(c.priority)}`}>
                    {c.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {c.district}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {formatDate(c.date)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    
                    {/* View Details */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/admin/complaints/${c.id}`)}
                      title="View Details"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Eye size={16} />
                    </Button>

                    {/* Assign Officer */}
                    {onAssignToggle && (c.status === 'Submitted' || c.status === 'Assigned') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onAssignToggle(c)}
                        title="Assign Officer"
                        className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:text-amber-700"
                      >
                        <UserCheck size={16} />
                      </Button>
                    )}

                    {/* Delete item */}
                    {onDelete && (
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete complaint ${c.id}?`)) {
                            onDelete(c.id);
                          }
                        }}
                        className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Delete Complaint"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
