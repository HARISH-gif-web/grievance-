import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types';
import { usersService } from '../services/users';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filters
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.district.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // Paginate
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  const handleUpdateRole = async (id: string, role: User['role']) => {
    try {
      const updated = await usersService.updateRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch (err: any) {
      throw new Error(err.message || 'Role update failed');
    }
  };

  const handleUpdateDepartment = async (id: string, department: string) => {
    try {
      const updated = await usersService.updateDepartment(id, department);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch (err: any) {
      throw new Error(err.message || 'Department assignment failed');
    }
  };

  const handleToggleStatus = async (id: string, status: User['status']) => {
    try {
      const updated = await usersService.toggleStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch (err: any) {
      throw new Error(err.message || 'Status update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await usersService.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'User deletion failed');
    }
  };

  return {
    users: paginatedUsers,
    allUsers: filteredUsers,
    loading,
    error,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    refresh: fetchUsers,
    updateRole: handleUpdateRole,
    updateDepartment: handleUpdateDepartment,
    toggleStatus: handleToggleStatus,
    deleteUser: handleDelete
  };
}
