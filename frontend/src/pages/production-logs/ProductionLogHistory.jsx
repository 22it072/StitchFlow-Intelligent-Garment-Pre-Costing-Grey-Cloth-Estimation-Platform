// frontend/src/pages/production-logs/ProductionLogHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Search,
  Factory,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import { productionLogAPI, loomAPI } from '../../services/api';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { formatDate } from '../../utils/formatters';

const ProductionLogHistory = () => {
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [looms, setLooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  const [filters, setFilters] = useState({
    loom: '',
    shift: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLooms();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await productionLogAPI.getAll(params);
      setLogs(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch production logs:', error);
      toast.error('Failed to fetch production logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await productionLogAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchLooms = async () => {
    try {
      const response = await loomAPI.getAll();
      setLooms(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch looms:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const shiftOptions = [
    { value: '', label: 'All Shifts' },
    { value: 'day', label: 'Day Shift' },
    { value: 'night', label: 'Night Shift' },
    { value: 'morning', label: 'Morning Shift' },
    { value: 'evening', label: 'Evening Shift' },
    { value: 'general', label: 'General' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Production Log History
          </h1>
          <p className="text-gray-500 mt-1">View and track daily production records</p>
        </div>
        <PermissionGuard permission="productionLogs:create">
          <Button icon={Plus} onClick={() => navigate('/production-logs/new')}>
            New Entry
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total Entries</p>
                <p className="text-2xl font-bold">{stats.summary?.totalEntries || 0}</p>
              </div>
              <FileText className="w-8 h-8 opacity-50" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Meters</p>
                <p className="text-2xl font-bold">{stats.summary?.totalMeters?.toFixed(0) || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-50" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Avg Efficiency</p>
                <p className="text-2xl font-bold">{stats.summary?.avgEfficiency?.toFixed(1) || 0}%</p>
              </div>
              <Factory className="w-8 h-8 opacity-50" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Breakdown Hrs</p>
                <p className="text-2xl font-bold">
                  {((stats.summary?.totalBreakdownMinutes || 0) / 60).toFixed(1)}
                </p>
              </div>
              <XCircle className="w-8 h-8 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            value={filters.loom}
            onChange={(e) => handleFilterChange('loom', e.target.value)}
            options={[
              { value: '', label: 'All Looms' },
              ...looms.map(l => ({ value: l._id, label: l.loomCode }))
            ]}
          />
          <Select
            value={filters.shift}
            onChange={(e) => handleFilterChange('shift', e.target.value)}
            options={shiftOptions}
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
          <Button variant="secondary" icon={Search} onClick={fetchLogs}>
            Search
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Production Logs Found</h3>
            <p className="text-gray-500 mb-4">Start recording daily production</p>
            <PermissionGuard permission="productionLogs:create">
              <Button icon={Plus} onClick={() => navigate('/production-logs/new')}>
                New Entry
              </Button>
            </PermissionGuard>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Loom</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quality</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Shift</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Meters</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Efficiency</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Breakdown</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/production-logs/${log._id}`)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium">{formatDate(log.date)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-indigo-600">
                          {log.loom?.loomCode || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.qualityName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="gray" className="capitalize">{log.shift}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {log.metersProduced?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.actualEfficiency ? (
                          <span className={log.actualEfficiency >= 80 ? 'text-green-600' : 'text-orange-600'}>
                            {log.actualEfficiency.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.breakdownOccurred ? (
                          <Badge variant="danger">{log.breakdownMinutes}m</Badge>
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.operator || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Showing {logs.length} of {pagination.total} entries
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
    </div>
  );
};

export default ProductionLogHistory;