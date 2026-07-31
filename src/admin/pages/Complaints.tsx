import React, { useState, useEffect } from 'react';
import { 
  FilePieChart, 
  Download, 
  UserCheck, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';
import { useComplaints } from '../hooks/useComplaints';
import { officersService } from '../services/officers';
import { Officer, Complaint } from '../types';
import { Filters } from '../components/Filters';
import { ComplaintTable } from '../components/ComplaintTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui/dialog';
import { exportToCSV } from '../utils/formatters';

export const Complaints: React.FC = () => {
  const {
    complaints,
    allComplaints,
    loading,
    error,
    search,
    setSearch,
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
    refresh,
    assignOfficer
  } = useComplaints(true);

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [targetOfficerId, setTargetOfficerId] = useState('');

  // Load officers for select
  useEffect(() => {
    officersService.getAll().then(setOfficers);
  }, []);

  const handleOpenAssign = (c: Complaint) => {
    setSelectedComplaint(c);
    setTargetOfficerId(c.assignedOfficerId || '');
    setAssignOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedComplaint) return;
    const officer = officers.find(o => o.id === targetOfficerId);
    if (!officer) {
      alert('Please select a valid officer.');
      return;
    }
    
    try {
      await assignOfficer(selectedComplaint.id, officer.id, officer.name);
      alert(`Successfully assigned grievance ${selectedComplaint.id} to officer ${officer.name}`);
      setAssignOpen(false);
    } catch (err: any) {
      alert('Assignment failed: ' + err.message);
    }
  };

  const exportCurrentTable = () => {
    const formatted = allComplaints.map(c => ({
      ID: c.id,
      Citizen: c.citizenName,
      Category: c.category,
      Subcategory: c.subcategory,
      Priority: c.priority,
      Status: c.status,
      District: c.district,
      Village: c.village,
      Officer: c.assignedOfficerName || 'Not Assigned',
      Date: c.date
    }));
    exportToCSV(formatted, 'PrajaMitra_Grievances_Report');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight dark:text-white">
            Grievances Master Database
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Triage public complaints, assign responsibilities, and generate audits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportCurrentTable}
            className="flex items-center gap-2 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <Download size={16} />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refresh()}
            className="rounded-xl"
          >
            Reload Records
          </Button>
        </div>
      </div>

      {/* Filter Component */}
      <Filters 
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
      />

      {/* Master Data Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800">
          <CardTitle>Grievance Records ({allComplaints.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <span className="animate-spin text-2xl inline-block mr-2">⚙️</span> Loading database entries...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 font-bold">
              {error}
            </div>
          ) : (
            <>
              <ComplaintTable 
                complaints={complaints}
                onAssignToggle={handleOpenAssign}
              />
              
              {/* Pagination controls */}
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

      {/* Assign Officer Dialog Popup */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)}>
        <DialogHeader>
          <DialogTitle>Assign Department Officer</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Available Officer</label>
              <select
                value={targetOfficerId}
                onChange={(e) => setTargetOfficerId(e.target.value)}
                className="w-full h-11 px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-350"
              >
                <option value="">-- Choose Officer --</option>
                {officers.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} - {o.department} ({o.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignOpen(false)} className="rounded-xl">Cancel</Button>
          <Button variant="primary" onClick={handleConfirmAssign} className="rounded-xl bg-gov-navy">Assign Task</Button>
        </DialogFooter>
      </Dialog>

    </div>
  );
};
