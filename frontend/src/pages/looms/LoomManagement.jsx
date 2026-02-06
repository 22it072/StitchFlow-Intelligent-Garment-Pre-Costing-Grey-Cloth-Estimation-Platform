// frontend/src/pages/looms/LoomManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Factory,
  Plus,
  Search,
  Settings,
  Play,
  Pause,
  Wrench,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { loomAPI } from '../../services/api';
import { PermissionGuard } from '../../components/guards/PermissionGuard';

const LoomManagement = () => {
  const navigate = useNavigate();
  
  const [looms, setLooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLoom, setSelectedLoom] = useState(null);
  const [formData, setFormData] = useState({
    loomCode: '',
    loomType: 'powerloom',
    ratedRPM: '',
    standardEfficiency: 85,
    assignedOperator: '',
    notes: '',
  });

  useEffect(() => {
    fetchLooms();
    fetchStats();
  }, [statusFilter, typeFilter]);

  const fetchLooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await loomAPI.getAll(params);
      setLooms(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch looms:', error);
      toast.error('Failed to fetch looms');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await loomAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLooms();
  };

  const handleAddLoom = async (e) => {
    e.preventDefault();
    try {
      await loomAPI.create(formData);
      toast.success('Loom added successfully');
      setShowAddModal(false);
      resetForm();
      fetchLooms();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add loom');
    }
  };

  const handleEditLoom = async (e) => {
    e.preventDefault();
    try {
      await loomAPI.update(selectedLoom._id, formData);
      toast.success('Loom updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchLooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update loom');
    }
  };

  const handleStatusChange = async (status, reason) => {
    try {
      await loomAPI.updateStatus(selectedLoom._id, { status, reason });
      toast.success('Loom status updated');
      setShowStatusModal(false);
      setSelectedLoom(null);
      fetchLooms();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteLoom = async (loom) => {
    if (!window.confirm(`Delete loom ${loom.loomCode}? This cannot be undone.`)) return;
    
    try {
      await loomAPI.delete(loom._id);
      toast.success('Loom deleted successfully');
      fetchLooms();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete loom');
    }
  };

  const openEditModal = (loom) => {
    setSelectedLoom(loom);
    setFormData({
      loomCode: loom.loomCode,
      loomType: loom.loomType,
      ratedRPM: loom.ratedRPM,
      standardEfficiency: loom.standardEfficiency,
      assignedOperator: loom.assignedOperator || '',
      notes: loom.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      loomCode: '',
      loomType: 'powerloom',
      ratedRPM: '',
      standardEfficiency: 85,
      assignedOperator: '',
      notes: '',
    });
    setSelectedLoom(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'idle': return <Pause className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'breakdown': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'idle': return 'gray';
      case 'maintenance': return 'warning';
      case 'breakdown': return 'danger';
      default: return 'gray';
    }
  };

  const loomTypes = [
    { value: 'powerloom', label: 'Power Loom' },
    { value: 'rapier', label: 'Rapier' },
    { value: 'airjet', label: 'Air Jet' },
    { value: 'waterjet', label: 'Water Jet' },
    { value: 'projectile', label: 'Projectile' },
    { value: 'shuttle', label: 'Shuttle' },
  ];

  const statusOptions = [
    { value: 'running', label: 'Running' },
    { value: 'idle', label: 'Idle' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'breakdown', label: 'Breakdown' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-7 h-7 text-indigo-600" />
            Loom Management
          </h1>
          <p className="text-gray-500 mt-1">Manage and monitor your weaving looms</p>
        </div>
        <PermissionGuard permission="looms:create">
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Loom
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <p className="text-indigo-100 text-sm">Total Looms</p>
            <p className="text-3xl font-bold">{stats.summary?.totalLooms || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Running</p>
            <p className="text-3xl font-bold">{stats.summary?.runningLooms || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
            <p className="text-gray-100 text-sm">Idle</p>
            <p className="text-3xl font-bold">{stats.summary?.idleLooms || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <p className="text-yellow-100 text-sm">Maintenance</p>
            <p className="text-3xl font-bold">{stats.summary?.maintenanceLooms || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm">Utilization</p>
            <p className="text-3xl font-bold">{stats.summary?.utilization || 0}%</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <Input
              placeholder="Search by loom code or operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </form>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[{ value: '', label: 'All Status' }, ...statusOptions]}
            className="w-40"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[{ value: '', label: 'All Types' }, ...loomTypes]}
            className="w-40"
          />
          <Button variant="secondary" icon={RefreshCw} onClick={fetchLooms}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Looms Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : looms.length === 0 ? (
        <Card className="text-center py-12">
          <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Looms Found</h3>
          <p className="text-gray-500 mb-4">Add your first loom to get started</p>
          <PermissionGuard permission="looms:create">
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Loom
            </Button>
          </PermissionGuard>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {looms.map((loom) => (
            <Card key={loom._id} hover className="relative">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{loom.loomCode}</h3>
                  <p className="text-sm text-gray-500 capitalize">{loom.loomType}</p>
                </div>
                <Badge variant={getStatusColor(loom.status)}>
                  {getStatusIcon(loom.status)}
                  <span className="ml-1 capitalize">{loom.status}</span>
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rated RPM</span>
                  <span className="font-medium">{loom.ratedRPM}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Std. Efficiency</span>
                  <span className="font-medium">{loom.standardEfficiency}%</span>
                </div>
                {loom.assignedOperator && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Operator</span>
                    <span className="font-medium">{loom.assignedOperator}</span>
                  </div>
                )}
                {loom.currentQualityName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality</span>
                    <span className="font-medium truncate ml-2">{loom.currentQualityName}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/looms/${loom._id}`)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <PermissionGuard permission="looms:manage_status">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedLoom(loom);
                      setShowStatusModal(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="looms:edit">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(loom)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="looms:delete">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteLoom(loom)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </PermissionGuard>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Loom Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Loom"
      >
        <form onSubmit={handleAddLoom} className="space-y-4">
          <Input
            label="Loom Code *"
            placeholder="e.g., L001, LOOM-A1"
            value={formData.loomCode}
            onChange={(e) => setFormData({ ...formData, loomCode: e.target.value })}
            required
          />
          <Select
            label="Loom Type *"
            value={formData.loomType}
            onChange={(e) => setFormData({ ...formData, loomType: e.target.value })}
            options={loomTypes}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rated RPM *"
              type="number"
              placeholder="e.g., 600"
              value={formData.ratedRPM}
              onChange={(e) => setFormData({ ...formData, ratedRPM: e.target.value })}
              required
              min="1"
            />
            <Input
              label="Standard Efficiency (%)"
              type="number"
              value={formData.standardEfficiency}
              onChange={(e) => setFormData({ ...formData, standardEfficiency: e.target.value })}
              min="0"
              max="100"
            />
          </div>
          <Input
            label="Assigned Operator"
            placeholder="Operator name (optional)"
            value={formData.assignedOperator}
            onChange={(e) => setFormData({ ...formData, assignedOperator: e.target.value })}
          />
          <Input
            label="Notes"
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Loom</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Loom Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Loom"
      >
        <form onSubmit={handleEditLoom} className="space-y-4">
          <Input
            label="Loom Code *"
            value={formData.loomCode}
            onChange={(e) => setFormData({ ...formData, loomCode: e.target.value })}
            required
          />
          <Select
            label="Loom Type *"
            value={formData.loomType}
            onChange={(e) => setFormData({ ...formData, loomType: e.target.value })}
            options={loomTypes}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rated RPM *"
              type="number"
              value={formData.ratedRPM}
              onChange={(e) => setFormData({ ...formData, ratedRPM: e.target.value })}
              required
              min="1"
            />
            <Input
              label="Standard Efficiency (%)"
              type="number"
              value={formData.standardEfficiency}
              onChange={(e) => setFormData({ ...formData, standardEfficiency: e.target.value })}
              min="0"
              max="100"
            />
          </div>
          <Input
            label="Assigned Operator"
            value={formData.assignedOperator}
            onChange={(e) => setFormData({ ...formData, assignedOperator: e.target.value })}
          />
          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedLoom(null);
        }}
        title={`Change Status: ${selectedLoom?.loomCode}`}
      >
        <div className="space-y-3">
          <p className="text-gray-600 mb-4">
            Current status: <Badge variant={getStatusColor(selectedLoom?.status)}>
              {selectedLoom?.status}
            </Badge>
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={selectedLoom?.status === option.value}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedLoom?.status === option.value
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(option.value)}
                  <span className="font-medium capitalize">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoomManagement;