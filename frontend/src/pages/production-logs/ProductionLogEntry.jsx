// frontend/src/pages/production-logs/ProductionLogEntry.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  Plus,
  Factory,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { loomAPI, productionLogAPI, estimateAPI } from '../../services/api';

const ProductionLogEntry = () => {
  const navigate = useNavigate();
  
  const [looms, setLooms] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loomsLoading, setLoomsLoading] = useState(true);
  const [qualitiesLoading, setQualitiesLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    loom: '',
    quality: '',
    qualityName: '',
    date: new Date().toISOString().split('T')[0],
    shift: 'day',
    metersProduced: '',
    picks: '',
    actualRPM: '',
    actualEfficiency: '',
    operator: '',
    breakdownOccurred: false,
    breakdownMinutes: '',
    breakdownReason: '',
    remarks: '',
  });

  useEffect(() => {
    fetchLooms();
    fetchQualities();
  }, []);

  const fetchLooms = async () => {
    try {
      setLoomsLoading(true);
      // Fetch ALL looms, not just running ones
      const response = await loomAPI.getAll();
      
      console.log('Looms API Response:', response.data); // Debug log
      
      const loomData = response.data.data || response.data || [];
      setLooms(Array.isArray(loomData) ? loomData : []);
      
      if (loomData.length === 0) {
        toast.error('No looms found. Please add looms first.', { duration: 5000 });
      }
    } catch (error) {
      console.error('Failed to fetch looms:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch looms');
      setLooms([]);
    } finally {
      setLoomsLoading(false);
    }
  };

  const fetchQualities = async () => {
    try {
      setQualitiesLoading(true);
      const response = await estimateAPI.getAll({ limit: 100 });
      
      console.log('Qualities API Response:', response.data); // Debug log
      
      const qualityData = response.data.data || response.data || [];
      setQualities(Array.isArray(qualityData) ? qualityData : []);
    } catch (error) {
      console.error('Failed to fetch qualities:', error);
      console.error('Error details:', error.response?.data);
      // Don't show error for qualities as they are optional
      setQualities([]);
    } finally {
      setQualitiesLoading(false);
    }
  };

  const handleLoomChange = (loomId) => {
    const selectedLoom = looms.find(l => l._id === loomId);
    setFormData({
      ...formData,
      loom: loomId,
      operator: selectedLoom?.assignedOperator || formData.operator,
      qualityName: selectedLoom?.currentQualityName || formData.qualityName,
    });
  };

  const handleQualityChange = (qualityId) => {
    const selectedQuality = qualities.find(q => q._id === qualityId);
    setFormData({
      ...formData,
      quality: qualityId,
      qualityName: selectedQuality?.qualityName || formData.qualityName,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.loom) {
      toast.error('Please select a loom');
      return;
    }
    
    if (!formData.qualityName || !formData.qualityName.trim()) {
      toast.error('Please enter a quality name');
      return;
    }
    
    if (!formData.metersProduced || parseFloat(formData.metersProduced) <= 0) {
      toast.error('Please enter meters produced (must be greater than 0)');
      return;
    }
    
    try {
      setLoading(true);
      
      const payload = {
        loom: formData.loom,
        quality: formData.quality || null,
        qualityName: formData.qualityName.trim(),
        date: formData.date,
        shift: formData.shift,
        metersProduced: parseFloat(formData.metersProduced),
        picks: formData.picks ? parseInt(formData.picks) : null,
        actualRPM: formData.actualRPM ? parseInt(formData.actualRPM) : null,
        actualEfficiency: formData.actualEfficiency ? parseFloat(formData.actualEfficiency) : null,
        operator: formData.operator || null,
        breakdownOccurred: formData.breakdownOccurred,
        breakdownMinutes: formData.breakdownMinutes ? parseInt(formData.breakdownMinutes) : 0,
        breakdownReason: formData.breakdownReason || null,
        remarks: formData.remarks || null,
      };
      
      console.log('Submitting payload:', payload); // Debug log
      
      await productionLogAPI.create(payload);
      
      toast.success('Production log saved successfully');
      navigate('/production-logs');
    } catch (error) {
      console.error('Failed to save production log:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save production log');
    } finally {
      setLoading(false);
    }
  };

  const shiftOptions = [
    { value: 'day', label: 'Day Shift' },
    { value: 'night', label: 'Night Shift' },
    { value: 'morning', label: 'Morning Shift' },
    { value: 'evening', label: 'Evening Shift' },
    { value: 'general', label: 'General' },
  ];

  // Filter looms that can be used for production (not in maintenance or breakdown)
  const availableLooms = looms.filter(l => 
    l.status !== 'maintenance' && l.status !== 'breakdown' && l.isActive !== false
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/production-logs')}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              Daily Production Entry
            </h1>
            <p className="text-gray-500 mt-1">Record actual daily production for a loom</p>
          </div>
        </div>
      </div>

      {/* No Looms Warning */}
      {!loomsLoading && looms.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">No Looms Available</h3>
                <p className="text-yellow-700 text-sm">
                  You need to add looms before you can log production.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/looms')} icon={Plus}>
              Add Loom
            </Button>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card title="Production Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loom Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loom *
                  </label>
                  {loomsLoading ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="spinner-sm"></div>
                      <span className="text-gray-500">Loading looms...</span>
                    </div>
                  ) : looms.length === 0 ? (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-yellow-700 text-sm">No looms found</span>
                      <Button size="sm" variant="secondary" onClick={() => navigate('/looms')}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={formData.loom}
                        onChange={(e) => handleLoomChange(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Select Loom</option>
                        {looms.map(l => (
                          <option key={l._id} value={l._id}>
                            {l.loomCode} ({l.loomType}) - {l.status}
                          </option>
                        ))}
                      </select>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={fetchLooms}
                        title="Refresh looms"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality (Optional)
                  </label>
                  {qualitiesLoading ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="spinner-sm"></div>
                      <span className="text-gray-500">Loading...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.quality}
                      onChange={(e) => handleQualityChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Quality (Optional)</option>
                      {qualities.map(q => (
                        <option key={q._id} value={q._id}>
                          {q.qualityName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <Input
                  label="Quality Name *"
                  value={formData.qualityName}
                  onChange={(e) => setFormData({ ...formData, qualityName: e.target.value })}
                  placeholder="Enter quality name (e.g., Plain 60x60)"
                  required
                />
                
                <Input
                  label="Date *"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  icon={Calendar}
                />
                
                <Select
                  label="Shift *"
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  options={shiftOptions}
                  required
                />
                
                <Input
                  label="Operator"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  placeholder="Operator name"
                />
              </div>
            </Card>

            {/* Production Numbers */}
            <Card title="Production Numbers">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Meters Produced *"
                  type="number"
                  step="0.01"
                  value={formData.metersProduced}
                  onChange={(e) => setFormData({ ...formData, metersProduced: e.target.value })}
                  placeholder="e.g., 150.5"
                  required
                  min="0.01"
                />
                
                <Input
                  label="Picks (PPI)"
                  type="number"
                  value={formData.picks}
                  onChange={(e) => setFormData({ ...formData, picks: e.target.value })}
                  placeholder="e.g., 52"
                  min="1"
                />
                
                <Input
                  label="Actual RPM"
                  type="number"
                  value={formData.actualRPM}
                  onChange={(e) => setFormData({ ...formData, actualRPM: e.target.value })}
                  placeholder="e.g., 580"
                  min="1"
                />
                
                <Input
                  label="Actual Efficiency (%)"
                  type="number"
                  step="0.1"
                  value={formData.actualEfficiency}
                  onChange={(e) => setFormData({ ...formData, actualEfficiency: e.target.value })}
                  placeholder="e.g., 82.5"
                  min="0"
                  max="100"
                />
              </div>
            </Card>

            {/* Breakdown Info */}
            <Card title="Breakdown Information">
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.breakdownOccurred}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      breakdownOccurred: e.target.checked,
                      breakdownMinutes: e.target.checked ? formData.breakdownMinutes : '',
                      breakdownReason: e.target.checked ? formData.breakdownReason : ''
                    })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">Breakdown occurred during shift</span>
                </label>
                
                {formData.breakdownOccurred && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pl-6 border-l-2 border-red-200">
                    <Input
                      label="Breakdown Duration (minutes) *"
                      type="number"
                      value={formData.breakdownMinutes}
                      onChange={(e) => setFormData({ ...formData, breakdownMinutes: e.target.value })}
                      placeholder="e.g., 45"
                      min="1"
                      required={formData.breakdownOccurred}
                      icon={Clock}
                    />
                    
                    <Input
                      label="Breakdown Reason"
                      value={formData.breakdownReason}
                      onChange={(e) => setFormData({ ...formData, breakdownReason: e.target.value })}
                      placeholder="e.g., Warp breakage, Motor issue"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Remarks */}
            <Card title="Additional Notes">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                placeholder="Any additional remarks or observations..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <Button
                type="submit"
                className="w-full"
                icon={Save}
                loading={loading}
                disabled={looms.length === 0 || loading}
              >
                {loading ? 'Saving...' : 'Save Production Log'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full mt-3"
                onClick={() => navigate('/production-logs')}
                disabled={loading}
              >
                Cancel
              </Button>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>One entry per loom per shift per day</li>
                    <li>Historical data cannot be modified</li>
                    <li>Warp beam consumption is auto-calculated</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Selected Loom Info */}
            {formData.loom && (
              <Card title="Selected Loom">
                {(() => {
                  const loom = looms.find(l => l._id === formData.loom);
                  if (!loom) return <p className="text-gray-500">Loom not found</p>;
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Code</span>
                        <span className="font-medium">{loom.loomCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium capitalize">{loom.loomType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-medium capitalize ${
                          loom.status === 'running' ? 'text-green-600' :
                          loom.status === 'idle' ? 'text-gray-600' :
                          loom.status === 'maintenance' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {loom.status}
                        </span>
                      </div>
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
                          <span className="text-gray-500">Current Quality</span>
                          <span className="font-medium text-indigo-600">{loom.currentQualityName}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* Quick Links */}
            <Card title="Quick Links">
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/looms')}
                >
                  <Factory className="w-4 h-4 mr-2" />
                  Manage Looms
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/production-logs')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Production Logs
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductionLogEntry;