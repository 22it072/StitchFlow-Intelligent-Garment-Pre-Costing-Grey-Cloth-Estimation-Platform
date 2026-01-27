import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  MoreVertical,
  Layers,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { yarnAPI } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const YarnLibrary = () => {
  const { settings } = useSettings();
  const [yarns, setYarns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYarn, setEditingYarn] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    denier: '',
    price: '',
    gstPercentage: settings.defaultGstPercentage || 5,
    yarnType: 'all',
    color: '',
    description: '',
  });

  useEffect(() => {
    fetchYarns();
  }, [filterType]);

  const fetchYarns = async () => {
    try {
      setLoading(true);
      const response = await yarnAPI.getAll({ type: filterType, active: true });
      setYarns(response.data);
    } catch (error) {
      console.error('Error fetching yarns:', error);
      toast.error('Failed to fetch yarns');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (yarn = null) => {
    if (yarn) {
      setEditingYarn(yarn);
      setFormData({
        name: yarn.name,
        denier: yarn.denier,
        price: yarn.price,
        gstPercentage: yarn.gstPercentage,
        yarnType: yarn.yarnType,
        color: yarn.color || '',
        description: yarn.description || '',
      });
    } else {
      setEditingYarn(null);
      setFormData({
        name: '',
        denier: '',
        price: '',
        gstPercentage: settings.defaultGstPercentage || 5,
        yarnType: 'all',
        color: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingYarn(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const yarnData = {
        ...formData,
        denier: parseFloat(formData.denier),
        price: parseFloat(formData.price),
        gstPercentage: parseFloat(formData.gstPercentage),
      };

      if (editingYarn) {
        await yarnAPI.update(editingYarn._id, yarnData);
        toast.success('Yarn updated successfully');
      } else {
        await yarnAPI.create(yarnData);
        toast.success('Yarn added successfully');
      }

      handleCloseModal();
      fetchYarns();
    } catch (error) {
      console.error('Error saving yarn:', error);
      toast.error('Failed to save yarn');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this yarn?')) return;

    try {
      await yarnAPI.delete(id);
      toast.success('Yarn deleted successfully');
      fetchYarns();
    } catch (error) {
      console.error('Error deleting yarn:', error);
      toast.error('Failed to delete yarn');
    }
  };

  const filteredYarns = yarns.filter(yarn =>
    yarn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const yarnTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'warp', label: 'Warp' },
    { value: 'weft', label: 'Weft' },
    { value: 'weft-2', label: 'Weft-2' },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'warp': return 'bg-blue-100 text-blue-800';
      case 'weft': return 'bg-green-100 text-green-800';
      case 'weft-2': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yarn Library</h1>
          <p className="text-gray-500 mt-1">Manage your yarn collection</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => handleOpenModal()}
          className="mt-4 md:mt-0"
        >
          Add Yarn
        </Button>
      </div>

      {/* Filters */}
      <Card padding="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search yarns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={yarnTypeOptions}
            />
          </div>
        </div>
      </Card>

      {/* Yarn Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      ) : filteredYarns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredYarns.map((yarn) => (
            <Card key={yarn._id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: yarn.color || '#E5E7EB' }}
                  >
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{yarn.name}</h3>
                    <span className={`badge ${getTypeColor(yarn.yarnType)}`}>
                      {yarn.yarnType === 'all' ? 'All Types' : yarn.yarnType}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenModal(yarn)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(yarn._id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Denier</span>
                  <span className="text-sm font-medium text-gray-900">{yarn.denier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Price</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(yarn.price, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">GST</span>
                  <span className="text-sm font-medium text-gray-900">{yarn.gstPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Price with GST</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {formatCurrency(yarn.priceWithGst, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Used in</span>
                  <span className="text-sm font-medium text-gray-900">
                    {yarn.usageCount} estimates
                  </span>
                </div>
              </div>

              {yarn.description && (
                <p className="mt-4 text-sm text-gray-500 border-t pt-4">
                  {yarn.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No yarns found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first yarn'}
          </p>
          <Button icon={Plus} onClick={() => handleOpenModal()}>
            Add Yarn
          </Button>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingYarn ? 'Edit Yarn' : 'Add New Yarn'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Yarn Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Cotton 40s"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Denier"
              name="denier"
              type="number"
              step="0.01"
              value={formData.denier}
              onChange={handleChange}
              placeholder="e.g., 75"
              required
            />
            <Input
              label="Price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 150"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GST %"
              name="gstPercentage"
              type="number"
              step="0.01"
              value={formData.gstPercentage}
              onChange={handleChange}
              placeholder="e.g., 5"
              required
            />
            <Select
              label="Yarn Type"
              name="yarnType"
              value={formData.yarnType}
              onChange={handleChange}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'warp', label: 'Warp Only' },
                { value: 'weft', label: 'Weft Only' },
                { value: 'weft-2', label: 'Weft-2 Only' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color (Optional)"
              name="color"
              type="color"
              value={formData.color || '#6366F1'}
              onChange={handleChange}
            />
            <div></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 input-focus"
              placeholder="Add notes about this yarn..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingYarn ? 'Update Yarn' : 'Add Yarn'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default YarnLibrary;