import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from './ui/input';

interface FiltersProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedPriority: string;
  setSelectedPriority: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (val: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedPriority,
  setSelectedPriority,
  selectedStatus,
  setSelectedStatus,
  selectedDistrict,
  setSelectedDistrict
}) => {

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'Food', label: 'Food' },
    { value: 'Education', label: 'Education' },
    { value: 'Civic', label: 'Civic Infrastructure' },
    { value: 'Health', label: 'Health' },
    { value: 'Other', label: 'Other' }
  ];

  const priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'Investigation', label: 'Investigation' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const districts = [
    { value: '', label: 'All Districts' },
    { value: 'Guntur', label: 'Guntur' },
    { value: 'Krishna', label: 'Krishna' },
    { value: 'NTR', label: 'NTR' },
    { value: 'Prakasam', label: 'Prakasam' },
    { value: 'Nellore', label: 'Nellore' }
  ];

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedDistrict('');
  };

  return (
    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
      
      {/* Top Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <Input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Grievance ID, Title, Description, or Citizen Name..."
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      {/* Grid of filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none text-slate-700 focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-350"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="h-10 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none text-slate-700 focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-350"
        >
          {priorities.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-10 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none text-slate-700 focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-350"
        >
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* District */}
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="h-10 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none text-slate-700 focus:ring-2 focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-350"
        >
          {districts.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="h-10 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center gap-1.5 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750"
        >
          <RotateCcw size={14} />
          Reset Filters
        </button>
      </div>

    </div>
  );
};
