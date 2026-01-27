import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Copy,
  Trash2,
  Clock,
  RotateCcw,
  FileText,
  Tag,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { estimateAPI } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const EstimateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [versionModal, setVersionModal] = useState(false);

  useEffect(() => {
    fetchEstimate();
  }, [id]);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const response = await estimateAPI.getOne(id);
      setEstimate(response.data);
    } catch (error) {
      console.error('Error fetching estimate:', error);
      toast.error('Failed to load estimate');
      navigate('/estimates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this estimate?')) return;

    try {
      await estimateAPI.delete(id);
      toast.success('Estimate deleted successfully');
      navigate('/estimates');
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast.error('Failed to delete estimate');
    }
  };

  const handleDuplicate = async () => {
    try {
      await estimateAPI.duplicate(id, {});
      toast.success('Estimate duplicated successfully');
      navigate('/estimates');
    } catch (error) {
      console.error('Error duplicating estimate:', error);
      toast.error('Failed to duplicate estimate');
    }
  };

  const handleRevert = async (versionNumber) => {
    if (!window.confirm(`Revert to version ${versionNumber}? This will create a new version.`)) return;

    try {
      await estimateAPI.revert(id, versionNumber);
      toast.success(`Reverted to version ${versionNumber}`);
      fetchEstimate();
      setVersionModal(false);
    } catch (error) {
      console.error('Error reverting:', error);
      toast.error('Failed to revert');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!estimate) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/estimates')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{estimate.qualityName}</h1>
            <p className="text-gray-500 mt-1">
              Version {estimate.currentVersion} • Created {formatDate(estimate.createdAt, settings.dateFormat)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {estimate.versions?.length > 0 && (
            <Button
              variant="secondary"
              icon={Clock}
              onClick={() => setVersionModal(true)}
            >
              History ({estimate.versions.length})
            </Button>
          )}
          <Button
            variant="secondary"
            icon={Copy}
            onClick={handleDuplicate}
          >
            Duplicate
          </Button>
          <Button
            variant="secondary"
            icon={Edit2}
            onClick={() => navigate(`/estimates/edit/${id}`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tags */}
      {estimate.tags?.length > 0 && (
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {estimate.tags.map((tag, idx) => (
              <span key={idx} className="badge badge-info">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-2">Total Weight</p>
          <p className="text-3xl font-bold text-gray-900">
            {estimate.totalWeight?.toFixed(4)}
          </p>
          <p className="text-sm text-gray-500">grams</p>
        </Card>
        <Card className="text-center bg-indigo-600 text-white">
          <p className="text-sm text-indigo-200 mb-2">Total Cost</p>
          <p className="text-3xl font-bold">
            {formatCurrency(estimate.totalCost, settings.currencySymbol)}
          </p>
          <p className="text-sm text-indigo-200">per meter</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-2">Other Cost</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(estimate.otherCostPerMeter || 0, settings.currencySymbol)}
          </p>
          <p className="text-sm text-gray-500">per meter</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-2">Weft-2</p>
          <p className="text-3xl font-bold text-gray-900">
            {estimate.weft2Enabled ? 'Enabled' : 'Disabled'}
          </p>
        </Card>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warp Details */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Warp Details</h3>
            <span className="badge badge-info">Warp</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Yarn</span>
              <span className="font-medium">{estimate.warp.yarnName || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Tar</span>
              <span className="font-medium">{estimate.warp.tar}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Denier</span>
              <span className="font-medium">{estimate.warp.denier}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Wastage</span>
              <span className="font-medium">{estimate.warp.wastage}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Yarn Price</span>
              <span className="font-medium">
                {formatCurrency(estimate.warp.yarnPrice, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">GST</span>
              <span className="font-medium">{estimate.warp.yarnGst}%</span>
            </div>
            <div className="pt-4 space-y-2 bg-blue-50 -mx-6 px-6 py-4 -mb-6 rounded-b-2xl">
              <div className="flex justify-between">
                <span className="text-blue-600">Raw Weight</span>
                <span className="font-medium text-blue-900">{estimate.warp.rawWeight?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Formatted Weight</span>
                <span className="font-bold text-blue-900">{estimate.warp.formattedWeight?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Raw Cost</span>
                <span className="font-medium text-blue-900">{estimate.warp.rawCost?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Formatted Cost</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(estimate.warp.formattedCost, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Weft Details */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weft Details</h3>
            <span className="badge badge-success">Weft</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Yarn</span>
              <span className="font-medium">{estimate.weft.yarnName || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Peek</span>
              <span className="font-medium">{estimate.weft.peek}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Panna</span>
              <span className="font-medium">{estimate.weft.panna}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Denier</span>
              <span className="font-medium">{estimate.weft.denier}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Wastage</span>
              <span className="font-medium">{estimate.weft.wastage}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Yarn Price</span>
              <span className="font-medium">
                {formatCurrency(estimate.weft.yarnPrice, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">GST</span>
              <span className="font-medium">{estimate.weft.yarnGst}%</span>
            </div>
            <div className="pt-4 space-y-2 bg-green-50 -mx-6 px-6 py-4 -mb-6 rounded-b-2xl">
              <div className="flex justify-between">
                <span className="text-green-600">Raw Weight</span>
                <span className="font-medium text-green-900">{estimate.weft.rawWeight?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Formatted Weight</span>
                <span className="font-bold text-green-900">{estimate.weft.formattedWeight?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Raw Cost</span>
                <span className="font-medium text-green-900">{estimate.weft.rawCost?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Formatted Cost</span>
                <span className="font-bold text-green-900">
                  {formatCurrency(estimate.weft.formattedCost, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Weft-2 Details */}
        {estimate.weft2Enabled && estimate.weft2 ? (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weft-2 Details</h3>
              <span className="badge bg-purple-100 text-purple-800">Weft-2</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Yarn</span>
                <span className="font-medium">{estimate.weft2.yarnName || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Peek</span>
                <span className="font-medium">{estimate.weft2.peek}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Panna</span>
                <span className="font-medium">{estimate.weft2.panna}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Denier</span>
                <span className="font-medium">{estimate.weft2.denier}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Wastage</span>
                <span className="font-medium">{estimate.weft2.wastage}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Yarn Price</span>
                <span className="font-medium">
                  {formatCurrency(estimate.weft2.yarnPrice, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">GST</span>
                <span className="font-medium">{estimate.weft2.yarnGst}%</span>
              </div>
              <div className="pt-4 space-y-2 bg-purple-50 -mx-6 px-6 py-4 -mb-6 rounded-b-2xl">
                <div className="flex justify-between">
                  <span className="text-purple-600">Raw Weight</span>
                  <span className="font-medium text-purple-900">{estimate.weft2.rawWeight?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Formatted Weight</span>
                  <span className="font-bold text-purple-900">{estimate.weft2.formattedWeight?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Raw Cost</span>
                  <span className="font-medium text-purple-900">{estimate.weft2.rawCost?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Formatted Cost</span>
                  <span className="font-bold text-purple-900">
                    {formatCurrency(estimate.weft2.formattedCost, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center text-center">
            <div>
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Weft-2 not enabled for this estimate</p>
            </div>
          </Card>
        )}
      </div>

      {/* Notes */}
      {estimate.notes && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{estimate.notes}</p>
        </Card>
      )}

      {/* Version History Modal */}
      <Modal
        isOpen={versionModal}
        onClose={() => setVersionModal(false)}
        title="Version History"
        size="lg"
      >
        <div className="space-y-4">
          {estimate.versions?.length > 0 ? (
            <div className="space-y-3">
              {estimate.versions.slice().reverse().map((version) => (
                <div
                  key={version.versionNumber}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Version {version.versionNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(version.editedAt, settings.dateFormat)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Quality: {version.data?.qualityName} • 
                      Cost: {formatCurrency(version.data?.totalCost, settings.currencySymbol)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => handleRevert(version.versionNumber)}
                  >
                    Revert
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No version history available</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EstimateDetail;