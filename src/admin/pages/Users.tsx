import React from 'react';
import { useUsers } from '../hooks/useUsers';
import { User } from '../types';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Search } from 'lucide-react';

export const Users: React.FC = () => {
  const {
    users,
    allUsers,
    loading,
    error,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalPages,
    updateRole,
    updateDepartment,
    toggleStatus,
    deleteUser
  } = useUsers();

  const handleToggleActive = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await toggleStatus(user.id, nextStatus);
      alert(`User profile status updated to ${nextStatus}.`);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleRoleToggle = async (user: User) => {
    const nextRole = user.role === 'Citizen' ? 'Authority' : 'Citizen';
    try {
      await updateRole(user.id, nextRole);
      alert(`User role assigned to ${nextRole}.`);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-white">
          Citizen Registry
        </h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Manage system users access, suspend accounts, and review profiles.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </span>
        <Input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search citizens by name, email, phone, or district..."
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      {/* Main card */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Users ({allUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              ⚙️ Loading registered profiles...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 font-bold">{error}</div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 tracking-wider dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">District</th>
                      <th className="px-6 py-4">System Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          No users registered.
                        </td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {u.name}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {u.phone}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {u.district}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleRoleToggle(u)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${u.role === 'Authority' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                            >
                              {u.role}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={u.status === 'Active' ? 'success' : 'destructive'}>
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleToggleActive(u)}
                                className={`rounded-lg ${u.status === 'Active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                              >
                                {u.status === 'Active' ? 'Suspend' : 'Activate'}
                              </Button>
                              <button 
                                onClick={() => {
                                  if (confirm('Delete this user profile permanantly?')) {
                                    deleteUser(u.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                title="Delete User"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-50 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="rounded-lg"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
