
// frontend/src/pages/fabric-rolls/FabricRollManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scroll,
  Plus,
  Search,
  RefreshCw,
  Truck,
  Package,
  Filter,
  Calendar,
  Eye,
  Download,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { fabricRollAPI, loomAPI, estimateAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FabricRollManagement = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotifications();
  
  const [rolls, setRolls] = useState([]);
  const [looms, setLooms] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  const [filters, setFilters] = useState({
    status: '',
    loom: '',
    grade: '',
    startDate: '',
    endDate: '',
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState(null);
  
  const [formData, setFormData] = useState({
    qualityId: '',
    qualityName: '',
    loomId: '',
    length: '',
    weight: '',
    width: '',
    dateProduced: new Date().toISOString().split('T')[0],
    shift: 'general',
    grade: 'A',
    storageLocation: 'Main Godown',
    remarks: '',
  });
  
  const [dispatchData, setDispatchData] = useState({
    buyer: '',
    invoiceNumber: '',
    vehicleNumber: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    fetchRolls();
    fetchLooms();
    fetchQualities();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchRolls = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };
      
      const response = await fabricRollAPI.getAll(params);
      setRolls(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      notifyError('Failed to fetch fabric rolls');
    } finally {
      setLoading(false);
    }
  };

  const fetchLooms = async () => {
    try {
      const response = await loomAPI.getAll();
      setLooms(response.data.data);
    } catch (error) {
      console.error('Failed to fetch looms:', error);
    }
  };

  const fetchQualities = async () => {
    try {
      const response = await estimateAPI.getAll({ limit: 100 });
      setQualities(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch qualities:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fabricRollAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAddRoll = async (e) => {
    e.preventDefault();
    try {
      await fabricRollAPI.create({
        ...formData,
        length: parseFloat(formData.length),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        width: formData.width ? parseFloat(formData.width) : null,
      });
      notifySuccess('Fabric roll created successfully');
      setShowAddModal(false);
      resetForm();
      fetchRolls();
      fetchStats();
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to create roll');
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      await fabricRollAPI.dispatch(selectedRoll._id, dispatchData);
      notifySuccess('Roll dispatched successfully');
      setShowDispatchModal(false);
      setSelectedRoll(null);
      resetDispatchForm();
      fetchRolls();
      fetchStats();
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to dispatch roll');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetForm = () => {
    setFormData({
      qualityId: '',
      qualityName: '',
      loomId: '',
      length: '',
      weight: '',
      width: '',
      dateProduced: new Date().toISOString().split('T')[0],
      shift: 'general',
      grade: 'A',
      storageLocation: 'Main Godown',
      remarks: '',
    });
  };

  const resetDispatchForm = () => {
    setDispatchData({
      buyer: '',
      invoiceNumber: '',
      vehicleNumber: '',
      dispatchDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'stored': return 'info';
      case 'dispatched': return 'success';
      case 'rejected': return 'danger';
      case 'processing': return 'warning';
      default: return 'gray';
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'warning';
      case 'C': return 'gray';
      case 'Reject': return 'danger';
      default: return 'gray';
    }
  };

  const shiftOptions = [
    { value: 'general', label: 'General' },
    { value: 'day', label: 'Day' },
    { value: 'night', label: 'Night' },
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
  ];

  const gradeOptions = [
    { value: 'A', label: 'Grade A' },
    { value: 'B', label: 'Grade B' },
    { value: 'C', label: 'Grade C' },
    { value: 'Reject', label: 'Reject' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scroll className="w-7 h-7 text-indigo-600" />
            Fabric Roll Management
          </h1>
          <p className="text-gray-500 mt-1">Track grey cloth rolls and dispatch</p>
        </div>
        <PermissionGuard permission="fabricRolls:create">
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Roll
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total Rolls</p>
                <p className="text-2xl font-bold">{stats.summary.totalRolls}</p>
              </div>
              <Scroll className="w-8 h-8 opacity-50" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Length (m)</p>
                <p className="text-2xl font-bold">{stats.summary.totalLength?.toFixed(0)}</p>
              </div>
              <Package className="w-8 h-8 opacity-50" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">In Stock</p>
                <p className="text-2xl font-bold">{stats.summary.storedRolls}</p>
              </div>
              <Package className="w-8 h-8 opacity-50" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Dispatched</p>
                <p className="text-2xl font-bold">{stats.summary.dispatchedRolls}</p>
              </div>
              <Truck className="w-8 h-8 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'stored', label: 'Stored' },
              { value: 'dispatched', label: 'Dispatched' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select
            value={filters.loom}
            onChange={(e) => handleFilterChange('loom', e.target.value)}
            options={[
              { value: '', label: 'All Looms' },
              ...looms.map(l => ({ value: l._id, label: l.loomCode }))
            ]}
          />
          <Select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            options={[
              { value: '', label: 'All Grades' },
              ...gradeOptions
            ]}
          />
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            placeholder="Start Date"
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            placeholder="End Date"
          />
          <Button variant="secondary" icon={RefreshCw} onClick={fetchRolls}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Rolls Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : rolls.length === 0 ? (
          <div className="text-center py-12">
            <Scroll className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fabric Rolls Found</h3>
            <p className="text-gray-500 mb-4">Create your first fabric roll</p>
            <PermissionGuard permission="fabricRolls:create">
              <Button icon={Plus} onClick={() => setShowAddModal(true)}>
                Add Roll
              </Button>
            </PermissionGuard>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Roll No.</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quality</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Loom</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Length (m)</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Weight (kg)</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Grade</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rolls.map((roll) => (
                    <tr key={roll._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-indigo-600">{roll.rollNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{roll.qualityName}</td>
                      <td className="py-3 px-4 text-gray-600">{roll.loom?.loomCode || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {formatDate(roll.dateProduced)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{roll.length?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {roll.weight?.toFixed(2) || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={getGradeColor(roll.grade)}>{roll.grade}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={getStatusColor(roll.status)} className="capitalize">
                          {roll.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          {roll.status === 'stored' && (
                            <PermissionGuard permission="fabricRolls:dispatch">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedRoll(roll);
                                  setShowDispatchModal(true);
                                }}
                              >
                                <Truck className="w-4 h-4" />
                              </Button>
                            </PermissionGuard>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/fabric-rolls/${roll._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Showing {rolls.length} of {pagination.total} rolls
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Add Roll Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Create Fabric Roll"
        size="lg"
      >
        <form onSubmit={handleAddRoll} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Loom *"
              value={formData.loomId}
              onChange={(e) => {
                const loom = looms.find(l => l._id === e.target.value);
                setFormData({
                  ...formData,
                  loomId: e.target.value,
                  qualityName: loom?.currentQualityName || formData.qualityName
                });
              }}
              options={[
                { value: '', label: 'Select Loom' },
                ...looms.map(l => ({ value: l._id, label: l.loomCode }))
              ]}
              required
            />
            <Select
              label="Quality"
              value={formData.qualityId}
              onChange={(e) => {
                const quality = qualities.find(q => q._id === e.target.value);
                setFormData({
                  ...formData,
                  qualityId: e.target.value,
                  qualityName: quality?.qualityName || ''
                });
              }}
              options={[
                { value: '', label: 'Select Quality' },
                ...qualities.map(q => ({ value: q._id, label: q.qualityName }))
              ]}
            />
          </div>
          
          <Input
            label="Quality Name *"
            value={formData.qualityName}
            onChange={(e) => setFormData({ ...formData, qualityName: e.target.value })}
            placeholder="Enter quality name"
            required
          />
          
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Length (meters) *"
              type="number"
              step="0.01"
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              placeholder="e.g., 120.5"
              required
              min="0.1"
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="e.g., 45.2"
            />
            <Input
              label="Width (meters)"
              type="number"
              step="0.01"
              value={formData.width}
              onChange={(e) => setFormData({ ...formData, width: e.target.value })}
              placeholder="e.g., 1.5"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date Produced"
              type="date"
              value={formData.dateProduced}
              onChange={(e) => setFormData({ ...formData, dateProduced: e.target.value })}
            />
            <Select
              label="Shift"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              options={shiftOptions}
            />
            <Select
              label="Grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              options={gradeOptions}
            />
          </div>
          
          <Input
            label="Storage Location"
            value={formData.storageLocation}
            onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
            placeholder="e.g., Main Godown, Rack A1"
          />
          
          <Input
            label="Remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Additional notes..."
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Roll</Button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Modal */}
      <Modal
        isOpen={showDispatchModal}
        onClose={() => {
          setShowDispatchModal(false);
          setSelectedRoll(null);
          resetDispatchForm();
        }}
        title={`Dispatch Roll: ${selectedRoll?.rollNumber}`}
      >
        <form onSubmit={handleDispatch} className="space-y-4">
          {selectedRoll && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="font-medium">{selectedRoll.rollNumber}</p>
              <p className="text-sm text-gray-500">
                {selectedRoll.qualityName} | {selectedRoll.length?.toFixed(2)}m | Grade {selectedRoll.grade}
              </p>
            </div>
          )}
          
          <Input
            label="Buyer Name *"
            value={dispatchData.buyer}
            onChange={(e) => setDispatchData({ ...dispatchData, buyer: e.target.value })}
            placeholder="Enter buyer name"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              value={dispatchData.invoiceNumber}
              onChange={(e) => setDispatchData({ ...dispatchData, invoiceNumber: e.target.value })}
              placeholder="INV-001"
            />
            <Input
              label="Vehicle Number"
              value={dispatchData.vehicleNumber}
              onChange={(e) => setDispatchData({ ...dispatchData, vehicleNumber: e.target.value })}
              placeholder="GJ-01-XX-1234"
            />
          </div>
          
          <Input
            label="Dispatch Date"
            type="date"
            value={dispatchData.dispatchDate}
            onChange={(e) => setDispatchData({ ...dispatchData, dispatchDate: e.target.value })}
          />
          
          <Input
            label="Remarks"
            value={dispatchData.remarks}
            onChange={(e) => setDispatchData({ ...dispatchData, remarks: e.target.value })}
            placeholder="Additional dispatch notes..."
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowDispatchModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={Truck}>Dispatch Roll</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FabricRollManagement;
