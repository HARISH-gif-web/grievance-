export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'assigned':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'investigation':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'low':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    case 'medium':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400';
    case 'critical':
      return 'bg-red-100 text-red-800 animate-pulse border border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
