// frontend/src/pages/weaving/WeavingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Factory,
  FileText,
  Package,
  Disc,
  Scroll,
  AlertTriangle,
  ArrowRight,
  Play,
  Pause,
  Wrench,
  Activity,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { loomAPI, productionLogAPI, yarnStockAPI, warpBeamAPI, fabricRollAPI } from '../../services/api';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { formatDate } from '../../utils/formatters';

const WeavingDashboard = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [loomStats, setLoomStats] = useState(null);
  const [productionStats, setProductionStats] = useState(null);
  const [yarnStats, setYarnStats] = useState(null);
  const [beamStats, setBeamStats] = useState(null);
  const [rollStats, setRollStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel, handling errors individually
      const results = await Promise.allSettled([
        loomAPI.getStats(),
        productionLogAPI.getStats(),
        yarnStockAPI.getStats(),
        warpBeamAPI.getStats(),
        fabricRollAPI.getStats(),
        productionLogAPI.getAll({ limit: 5 }),
      ]);
      
      // Set data from successful requests
      if (results[0].status === 'fulfilled') setLoomStats(results[0].value.data.data);
      if (results[1].status === 'fulfilled') setProductionStats(results[1].value.data.data);
      if (results[2].status === 'fulfilled') setYarnStats(results[2].value.data.data);
      if (results[3].status === 'fulfilled') setBeamStats(results[3].value.data.data);
      if (results[4].status === 'fulfilled') setRollStats(results[4].value.data.data);
      if (results[5].status === 'fulfilled') setRecentLogs(results[5].value.data.data || []);
      
      // Check if all failed
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  // Build alerts array
  const alerts = [];
  
  if (yarnStats?.lowStockCount > 0) {
    alerts.push({
      type: 'warning',
      icon: Package,
      message: `${yarnStats.lowStockCount} yarn(s) running low on stock`,
      action: () => navigate('/yarn-stocks'),
    });
  }
  
  if (beamStats?.nearFinishCount > 0) {
    alerts.push({
      type: 'warning',
      icon: Disc,
      message: `${beamStats.nearFinishCount} warp beam(s) near finish`,
      action: () => navigate('/warp-beams'),
    });
  }
  
  if (loomStats?.summary?.breakdownLooms > 0) {
    alerts.push({
      type: 'danger',
      icon: AlertTriangle,
      message: `${loomStats.summary.breakdownLooms} loom(s) in breakdown`,
      action: () => navigate('/looms'),
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-7 h-7 text-indigo-600" />
            Weaving Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Overview of weaving operations</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <PermissionGuard permission="productionLogs:create">
            <Button onClick={() => navigate('/production-logs/new')}>
              Log Production
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                  alert.type === 'danger' 
                    ? 'bg-red-50 border border-red-200 hover:bg-red-100' 
                    : 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100'
                }`}
                onClick={alert.action}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${alert.type === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <span className={alert.type === 'danger' ? 'text-red-800' : 'text-yellow-800'}>
                    {alert.message}
                  </span>
                </div>
                <ArrowRight className={`w-4 h-4 ${alert.type === 'danger' ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Loom Status Overview */}
      {loomStats && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Factory className="w-5 h-5 text-indigo-600" />
              Loom Status
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/looms')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-gray-900">{loomStats.summary?.totalLooms || 0}</p>
              <p className="text-sm text-gray-500">Total Looms</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{loomStats.summary?.runningLooms || 0}</p>
              </div>
              <p className="text-sm text-green-600">Running</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <Pause className="w-5 h-5 text-gray-600" />
                <p className="text-3xl font-bold text-gray-600">{loomStats.summary?.idleLooms || 0}</p>
              </div>
              <p className="text-sm text-gray-600">Idle</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <Wrench className="w-5 h-5 text-yellow-600" />
                <p className="text-3xl font-bold text-yellow-600">{loomStats.summary?.maintenanceLooms || 0}</p>
              </div>
              <p className="text-sm text-yellow-600">Maintenance</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <p className="text-3xl font-bold text-indigo-600">{loomStats.summary?.utilization || 0}%</p>
              </div>
              <p className="text-sm text-indigo-600">Utilization</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production Stats */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/production-logs')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Production</p>
              <p className="text-2xl font-bold text-gray-900">
                {productionStats?.summary?.totalMeters?.toFixed(0) || 0}m
              </p>
              <p className="text-xs text-gray-400">
                {productionStats?.summary?.totalEntries || 0} entries
              </p>
            </div>
          </div>
        </Card>

        {/* Yarn Stock */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/yarn-stocks')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Yarn Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {yarnStats?.summary?.totalClosingStock?.toFixed(0) || 0} kg
              </p>
              <p className="text-xs text-gray-400">
                {yarnStats?.summary?.totalItems || 0} items
              </p>
            </div>
          </div>
        </Card>

        {/* Warp Beams */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/warp-beams')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Disc className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Beams</p>
              <p className="text-2xl font-bold text-gray-900">
                {beamStats?.summary?.inUseBeams || 0}
              </p>
              <p className="text-xs text-gray-400">
                {beamStats?.summary?.readyBeams || 0} ready
              </p>
            </div>
          </div>
        </Card>

        {/* Fabric Rolls */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/fabric-rolls')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Scroll className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rolls in Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {rollStats?.summary?.storedRolls || 0}
              </p>
              <p className="text-xs text-gray-400">
                {rollStats?.summary?.totalLength?.toFixed(0) || 0}m total
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Production Logs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Recent Production
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/production-logs')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No production logs yet. Start recording production!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Loom</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Quality</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Shift</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Meters</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr 
                    key={log._id} 
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/production-logs/${log._id}`)}
                  >
                    <td className="py-2 px-3 text-sm">{formatDate(log.date)}</td>
                    <td className="py-2 px-3">
                      <span className="font-medium text-indigo-600">{log.loom?.loomCode}</span>
                    </td>
                    <td className="py-2 px-3 text-sm text-gray-600">{log.qualityName}</td>
                    <td className="py-2 px-3">
                      <Badge variant="gray" className="capitalize text-xs">{log.shift}</Badge>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{log.metersProduced?.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">
                      {log.actualEfficiency ? (
                        <span className={log.actualEfficiency >= 80 ? 'text-green-600' : 'text-orange-600'}>
                          {log.actualEfficiency.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <PermissionGuard permission="productionLogs:create">
          <button
            onClick={() => navigate('/production-logs/new')}
            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-600">Log Production</span>
          </button>
        </PermissionGuard>
        
        <PermissionGuard permission="looms:view">
          <button
            onClick={() => navigate('/looms')}
            className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <Factory className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-indigo-600">Manage Looms</span>
          </button>
        </PermissionGuard>
        
        <PermissionGuard permission="yarnStock:view">
          <button
            onClick={() => navigate('/yarn-stocks')}
            className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <Package className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-600">Yarn Stock</span>
          </button>
        </PermissionGuard>
        
        <PermissionGuard permission="warpBeams:view">
          <button
            onClick={() => navigate('/warp-beams')}
            className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            <Disc className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-600">Warp Beams</span>
          </button>
        </PermissionGuard>
        
        <PermissionGuard permission="fabricRolls:view">
          <button
            onClick={() => navigate('/fabric-rolls')}
            className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
          >
            <Scroll className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-600">Fabric Rolls</span>
          </button>
        </PermissionGuard>
      </div>
    </div>
  );
};

export default WeavingDashboard;