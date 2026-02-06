// frontend/src/pages/warp-beams/WarpBeamManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Disc,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Link,
  Unlink,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Factory,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { warpBeamAPI, loomAPI, yarnAPI, estimateAPI } from '../../services/api';
import { PermissionGuard } from '../../components/guards/PermissionGuard';

const WarpBeamManagement = () => {
  const navigate = useNavigate();
  
  const [beams, setBeams] = useState([]);
  const [looms, setLooms] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBeam, setSelectedBeam] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    beamNumber: '',
    yarnId: '',
    yarnDetails: '',
    totalLength: '',
    totalEnds: '',
    reedSpace: '',
    qualityName: '',
    alertThreshold: 100,
    notes: '',
  });
  
  const [assignData, setAssignData] = useState({
    loomId: '',
    qualityId: '',
    qualityName: '',
  });

  useEffect(() => {
    fetchAllData();
  }, [statusFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchBeams(),
      fetchLooms(),
      fetchYarns(),
      fetchQualities(),
      fetchStats(),
    ]);
    setLoading(false);
  };

  const fetchBeams = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await warpBeamAPI.getAll(params);
      console.log('Beams response:', response.data);
      setBeams(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch warp beams:', error);
      toast.error('Failed to fetch warp beams');
      setBeams([]);
    }
  };

  const fetchLooms = async () => {
    try {
      const response = await loomAPI.getAll();
      console.log('Looms response:', response.data);
      setLooms(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch looms:', error);
      setLooms([]);
    }
  };

  const fetchYarns = async () => {
    try {
      const response = await yarnAPI.getAll({ type: 'warp' });
      console.log('Yarns response:', response.data);
      setYarns(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch yarns:', error);
      setYarns([]);
    }
  };

  const fetchQualities = async () => {
    try {
      const response = await estimateAPI.getAll({ limit: 100 });
      console.log('Qualities response:', response.data);
      setQualities(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch qualities:', error);
      setQualities([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await warpBeamAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAddBeam = async (e) => {
    e.preventDefault();
    
    if (!formData.totalLength || parseFloat(formData.totalLength) <= 0) {
      toast.error('Please enter a valid total length');
      return;
    }
    
    try {
      const payload = {
        beamNumber: formData.beamNumber || undefined, // Let backend auto-generate if empty
        yarnId: formData.yarnId || null,
        yarnDetails: formData.yarnDetails || null,
        totalLength: parseFloat(formData.totalLength),
        totalEnds: formData.totalEnds ? parseInt(formData.totalEnds) : null,
        reedSpace: formData.reedSpace ? parseFloat(formData.reedSpace) : null,
        qualityName: formData.qualityName || null,
        alertThreshold: parseInt(formData.alertThreshold) || 100,
        notes: formData.notes || null,
      };
      
      console.log('Creating beam with payload:', payload);
      
      await warpBeamAPI.create(payload);
      toast.success('Warp beam added successfully');
      setShowAddModal(false);
      resetForm();
      fetchBeams();
      fetchStats();
    } catch (error) {
      console.error('Failed to add beam:', error);
      toast.error(error.response?.data?.message || 'Failed to add beam');
    }
  };

  const handleAssignBeam = async (e) => {
    e.preventDefault();
    
    if (!assignData.loomId) {
      toast.error('Please select a loom');
      return;
    }
    
    try {
      setAssignLoading(true);
      
      const payload = {
        loomId: assignData.loomId,
        qualityId: assignData.qualityId || null,
        qualityName: assignData.qualityName || null,
      };
      
      console.log('Assigning beam:', selectedBeam._id, 'with payload:', payload);
      
      const response = await warpBeamAPI.assign(selectedBeam._id, payload);
      console.log('Assign response:', response.data);
      
      toast.success('Beam assigned to loom successfully');
      setShowAssignModal(false);
      setSelectedBeam(null);
      resetAssignData();
      
      // Refresh data
      await Promise.all([fetchBeams(), fetchLooms(), fetchStats()]);
    } catch (error) {
      console.error('Failed to assign beam:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to assign beam');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveBeam = async (beam, markAsFinished = false) => {
    const message = markAsFinished 
      ? `Mark beam ${beam.beamNumber} as finished and remove from loom?`
      : `Remove beam ${beam.beamNumber} from loom?`;
    
    if (!window.confirm(message)) return;
    
    try {
      await warpBeamAPI.remove(beam._id, { markAsFinished });
      toast.success('Beam removed from loom');
      await Promise.all([fetchBeams(), fetchLooms(), fetchStats()]);
    } catch (error) {
      console.error('Failed to remove beam:', error);
      toast.error(error.response?.data?.message || 'Failed to remove beam');
    }
  };

  const handleDeleteBeam = async (beam) => {
    if (!window.confirm(`Delete beam ${beam.beamNumber}? This cannot be undone.`)) return;
    
    try {
      await warpBeamAPI.delete(beam._id);
      toast.success('Beam deleted successfully');
      await Promise.all([fetchBeams(), fetchStats()]);
    } catch (error) {
      console.error('Failed to delete beam:', error);
      toast.error(error.response?.data?.message || 'Failed to delete beam');
    }
  };

  const openAssignModal = (beam) => {
    setSelectedBeam(beam);
    setAssignData({
      loomId: '',
      qualityId: '',
      qualityName: beam.qualityName || '',
    });
    setShowAssignModal(true);
  };

  const resetForm = () => {
    setFormData({
      beamNumber: '',
      yarnId: '',
      yarnDetails: '',
      totalLength: '',
      totalEnds: '',
      reedSpace: '',
      qualityName: '',
      alertThreshold: 100,
      notes: '',
    });
  };

  const resetAssignData = () => {
    setAssignData({
      loomId: '',
      qualityId: '',
      qualityName: '',
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ready': return { color: 'success', icon: CheckCircle, label: 'Ready' };
      case 'in_use': return { color: 'info', icon: Clock, label: 'In Use' };
      case 'finished': return { color: 'gray', icon: CheckCircle, label: 'Finished' };
      case 'removed': return { color: 'warning', icon: Unlink, label: 'Removed' };
      case 'damaged': return { color: 'danger', icon: XCircle, label: 'Damaged' };
      default: return { color: 'gray', icon: Clock, label: status };
    }
  };

  // Get looms that don't have a warp beam assigned
  const availableLooms = looms.filter(l => {
    const hasNoBeam = !l.currentWarpBeam;
    const isNotMaintenance = l.status !== 'maintenance' && l.status !== 'breakdown';
    const isActive = l.isActive !== false;
    return hasNoBeam && isNotMaintenance && isActive;
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ready', label: 'Ready' },
    { value: 'in_use', label: 'In Use' },
    { value: 'finished', label: 'Finished' },
    { value: 'removed', label: 'Removed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Disc className="w-7 h-7 text-indigo-600" />
            Warp Beam Management
          </h1>
          <p className="text-gray-500 mt-1">Track and manage warp beams for production</p>
        </div>
        <PermissionGuard permission="warpBeams:create">
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Warp Beam
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <p className="text-indigo-100 text-sm">Total Beams</p>
            <p className="text-2xl font-bold">{stats.summary?.totalBeams || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Ready</p>
            <p className="text-2xl font-bold">{stats.summary?.readyBeams || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm">In Use</p>
            <p className="text-2xl font-bold">{stats.summary?.inUseBeams || 0}</p>
          </Card>
          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
            <p className="text-gray-100 text-sm">Finished</p>
            <p className="text-2xl font-bold">{stats.summary?.finishedBeams || 0}</p>
          </Card>
          <Card className={`bg-gradient-to-br ${(stats.nearFinishCount || 0) > 0 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} text-white`}>
            <p className="text-orange-100 text-sm">Near Finish</p>
            <p className="text-2xl font-bold">{stats.nearFinishCount || 0}</p>
          </Card>
        </div>
      )}

      {/* Near Finish Alerts */}
      {stats?.nearFinishBeams?.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-800 mb-2">Beams Near Finish - Action Required</h3>
              <div className="space-y-1">
                {stats.nearFinishBeams.map(beam => (
                  <p key={beam._id} className="text-sm text-orange-700">
                    <span className="font-medium">{beam.beamNumber}</span> on {beam.loom?.loomCode || 'Unknown'} - 
                    Only <span className="font-medium">{beam.remainingLength?.toFixed(0)}m</span> remaining
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-48"
          />
          <Button variant="secondary" icon={RefreshCw} onClick={fetchAllData}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Beams Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : beams.length === 0 ? (
        <Card className="text-center py-12">
          <Disc className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Warp Beams Found</h3>
          <p className="text-gray-500 mb-4">Add your first warp beam</p>
          <PermissionGuard permission="warpBeams:create">
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Warp Beam
            </Button>
          </PermissionGuard>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {beams.map((beam) => {
            const statusConfig = getStatusConfig(beam.status);
            const StatusIcon = statusConfig.icon;
            const progress = beam.totalLength > 0 ? ((beam.lengthConsumed || 0) / beam.totalLength) * 100 : 0;
            
            return (
              <Card key={beam._id} hover className="relative">
                {beam.isNearFinish && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="warning" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Low
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{beam.beamNumber}</h3>
                    {beam.qualityName && (
                      <p className="text-sm text-gray-500">{beam.qualityName}</p>
                    )}
                  </div>
                  <Badge variant={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Consumed: {(beam.lengthConsumed || 0).toFixed(0)}m</span>
                    <span>Remaining: {(beam.remainingLength || beam.totalLength || 0).toFixed(0)}m</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-right text-gray-500 mt-1">
                    Total: {(beam.totalLength || 0).toFixed(0)}m ({progress.toFixed(1)}% used)
                  </p>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  {beam.yarn && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Yarn</span>
                      <span className="font-medium">{beam.yarn.displayName || beam.yarn.name}</span>
                    </div>
                  )}
                  {beam.yarnDetails && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Yarn Details</span>
                      <span className="font-medium">{beam.yarnDetails}</span>
                    </div>
                  )}
                  {beam.loom && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Loom</span>
                      <span className="font-medium text-indigo-600">{beam.loom.loomCode}</span>
                    </div>
                  )}
                  {beam.totalEnds && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Ends</span>
                      <span className="font-medium">{beam.totalEnds}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {beam.status === 'ready' && (
                    <PermissionGuard permission="warpBeams:assign">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => openAssignModal(beam)}
                      >
                        <Link className="w-4 h-4 mr-1" />
                        Assign to Loom
                      </Button>
                    </PermissionGuard>
                  )}
                  {beam.status === 'in_use' && (
                    <PermissionGuard permission="warpBeams:assign">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRemoveBeam(beam, false)}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </PermissionGuard>
                  )}
                  {beam.status !== 'in_use' && (
                    <PermissionGuard permission="warpBeams:delete">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteBeam(beam)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </PermissionGuard>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Beam Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add Warp Beam"
      >
        <form onSubmit={handleAddBeam} className="space-y-4">
          <Input
            label="Beam Number"
            value={formData.beamNumber}
            onChange={(e) => setFormData({ ...formData, beamNumber: e.target.value })}
            placeholder="Leave empty for auto-generate"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warp Yarn (Optional)
            </label>
            <select
              value={formData.yarnId}
              onChange={(e) => setFormData({ ...formData, yarnId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Yarn (Optional)</option>
              {yarns.map(y => (
                <option key={y._id} value={y._id}>
                  {y.displayName || y.name}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Yarn Details"
            value={formData.yarnDetails}
            onChange={(e) => setFormData({ ...formData, yarnDetails: e.target.value })}
            placeholder="e.g., 80D/36F TPM 800"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Length (meters) *"
              type="number"
              value={formData.totalLength}
              onChange={(e) => setFormData({ ...formData, totalLength: e.target.value })}
              placeholder="e.g., 5000"
              required
              min="1"
            />
            <Input
              label="Alert Threshold (m)"
              type="number"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
              placeholder="100"
              min="0"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Ends"
              type="number"
              value={formData.totalEnds}
              onChange={(e) => setFormData({ ...formData, totalEnds: e.target.value })}
              placeholder="e.g., 3200"
            />
            <Input
              label="Reed Space (inches)"
              type="number"
              step="0.1"
              value={formData.reedSpace}
              onChange={(e) => setFormData({ ...formData, reedSpace: e.target.value })}
              placeholder="e.g., 54.5"
            />
          </div>
          
          <Input
            label="Quality Name"
            value={formData.qualityName}
            onChange={(e) => setFormData({ ...formData, qualityName: e.target.value })}
            placeholder="e.g., Plain 60x60"
          />
          
          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Beam</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Beam Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedBeam(null);
          resetAssignData();
        }}
        title={`Assign Beam: ${selectedBeam?.beamNumber || ''}`}
      >
        <form onSubmit={handleAssignBeam} className="space-y-4">
          {selectedBeam && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Disc className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">{selectedBeam.beamNumber}</span>
              </div>
              <p className="text-sm text-gray-500">
                Length: {selectedBeam.totalLength}m | 
                Remaining: {(selectedBeam.remainingLength || selectedBeam.totalLength)?.toFixed(0)}m
              </p>
              {selectedBeam.yarnDetails && (
                <p className="text-sm text-gray-500">Yarn: {selectedBeam.yarnDetails}</p>
              )}
            </div>
          )}
          
          {/* Loom Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Loom *
            </label>
            {availableLooms.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">No available looms</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  All looms either have beams assigned or are under maintenance.
                </p>
                <Button 
                  type="button"
                  variant="secondary" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate('/looms')}
                >
                  <Factory className="w-4 h-4 mr-1" />
                  Manage Looms
                </Button>
              </div>
            ) : (
              <select
                value={assignData.loomId}
                onChange={(e) => setAssignData({ ...assignData, loomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Loom</option>
                {availableLooms.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.loomCode} ({l.loomType}) - {l.status}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Show all looms info */}
          {looms.length > 0 && availableLooms.length === 0 && (
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">All looms status:</p>
              {looms.map(l => (
                <p key={l._id}>
                  {l.loomCode}: {l.status} 
                  {l.currentWarpBeam && ' (has beam)'}
                </p>
              ))}
            </div>
          )}
          
          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quality (Optional)
            </label>
            <select
              value={assignData.qualityId}
              onChange={(e) => {
                const quality = qualities.find(q => q._id === e.target.value);
                setAssignData({
                  ...assignData,
                  qualityId: e.target.value,
                  qualityName: quality?.qualityName || assignData.qualityName
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Quality</option>
              {qualities.map(q => (
                <option key={q._id} value={q._id}>
                  {q.qualityName}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Quality Name"
            value={assignData.qualityName}
            onChange={(e) => setAssignData({ ...assignData, qualityName: e.target.value })}
            placeholder="Enter quality name"
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowAssignModal(false);
                setSelectedBeam(null);
                resetAssignData();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!assignData.loomId || assignLoading}
              loading={assignLoading}
            >
              {assignLoading ? 'Assigning...' : 'Assign to Loom'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WarpBeamManagement;