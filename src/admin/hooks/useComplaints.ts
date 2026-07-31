import { useState, useEffect, useCallback, useMemo } from 'react';
import { Complaint } from '../types';
import { complaintsService } from '../services/complaints';

export function useComplaints(initialFilterAll: boolean = false) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await complaintsService.getAll({ all: initialFilterAll });
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [initialFilterAll]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDept, selectedCategory, selectedPriority, selectedStatus, selectedDistrict]);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = 
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.citizenName.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = !selectedDept || c.category.toLowerCase() === selectedDept.toLowerCase();
      const matchesCategory = !selectedCategory || c.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesPriority = !selectedPriority || c.priority.toLowerCase() === selectedPriority.toLowerCase();
      const matchesStatus = !selectedStatus || c.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDistrict = !selectedDistrict || c.district.toLowerCase() === selectedDistrict.toLowerCase();

      return matchesSearch && matchesDept && matchesCategory && matchesPriority && matchesStatus && matchesDistrict;
    });
  }, [complaints, search, selectedDept, selectedCategory, selectedPriority, selectedStatus, selectedDistrict]);

  // Paginated complaints
  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;

  const handleUpdateStatus = async (id: string, status: Complaint['status'], notes?: string) => {
    try {
      const updated = await complaintsService.updateStatus(id, status, notes);
      setComplaints(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Status update failed');
    }
  };

  const handleAssignOfficer = async (id: string, officerId: string, officerName: string) => {
    try {
      const updated = await complaintsService.assignOfficer(id, officerId, officerName);
      setComplaints(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Assignment failed');
    }
  };

  return {
    complaints: paginatedComplaints,
    allComplaints: filteredComplaints,
    loading,
    error,
    search,
    setSearch,
    selectedDept,
    setSelectedDept,
    selectedCategory,
    setSelectedCategory,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    selectedDistrict,
    setSelectedDistrict,
    currentPage,
    setCurrentPage,
    totalPages,
    refresh: fetchComplaints,
    updateStatus: handleUpdateStatus,
    assignOfficer: handleAssignOfficer
  };
}
