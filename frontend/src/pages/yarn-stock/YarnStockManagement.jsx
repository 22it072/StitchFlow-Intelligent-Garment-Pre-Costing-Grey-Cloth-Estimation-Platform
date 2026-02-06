
// frontend/src/pages/yarn-stock/YarnStockManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  AlertTriangle,
  Search,
  RefreshCw,
  TrendingDown,
  Eye,
  History,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { yarnStockAPI, yarnAPI, loomAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { formatDate } from '../../utils/formatters';

const YarnStockManagement = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotifications();
  
  const [stocks, setStocks] = useState([]);
  const [yarns, setYarns] = useState([]);
  const [looms, setLooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactionType, setTransactionType] = useState('receive');
  const [selectedStock, setSelectedStock] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    yarnId: '',
    openingStock: '',
    minStockLevel: '',
    location: 'Main Store',
  });
  
  const [transactionData, setTransactionData] = useState({
    quantity: '',
    supplier: '',
    invoiceNumber: '',
    rate: '',
    loomId: '',
    remarks: '',
  });

  useEffect(() => {
    fetchStocks();
    fetchYarns();
    fetchLooms();
    fetchStats();
  }, [showLowStock]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const params = { lowStock: showLowStock };
      if (searchTerm) params.search = searchTerm;
      
      const response = await yarnStockAPI.getAll(params);
      setStocks(response.data.data);
    } catch (error) {
      notifyError('Failed to fetch yarn stocks');
    } finally {
      setLoading(false);
    }
  };

  const fetchYarns = async () => {
    try {
      const response = await yarnAPI.getAll({ active: true });
      setYarns(response.data);
    } catch (error) {
      console.error('Failed to fetch yarns:', error);
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

  const fetchStats = async () => {
    try {
      const response = await yarnStockAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTransactions = async (stockId) => {
    try {
      setTransactionsLoading(true);
      const response = await yarnStockAPI.getTransactions(stockId, { limit: 50 });
      setTransactions(response.data.data);
    } catch (error) {
      notifyError('Failed to fetch transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await yarnStockAPI.create({
        ...formData,
        openingStock: parseFloat(formData.openingStock) || 0,
        minStockLevel: parseFloat(formData.minStockLevel) || 0,
      });
      notifySuccess('Yarn stock initialized successfully');
      setShowAddModal(false);
      resetForm();
      fetchStocks();
      fetchStats();
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to add stock');
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      const data = {
        quantity: parseFloat(transactionData.quantity),
        remarks: transactionData.remarks,
      };
      
      if (transactionType === 'receive') {
        data.supplier = transactionData.supplier;
        data.invoiceNumber = transactionData.invoiceNumber;
        data.rate = parseFloat(transactionData.rate) || null;
        await yarnStockAPI.receive(selectedStock._id, data);
        notifySuccess('Stock received successfully');
      } else if (transactionType === 'issue') {
        data.loomId = transactionData.loomId || null;
        await yarnStockAPI.issue(selectedStock._id, data);
        notifySuccess('Stock issued successfully');
      } else if (transactionType === 'return') {
        data.loomId = transactionData.loomId || null;
        await yarnStockAPI.return(selectedStock._id, data);
        notifySuccess('Stock returned successfully');
      }
      
      setShowTransactionModal(false);
      resetTransactionForm();
      fetchStocks();
      fetchStats();
    } catch (error) {
      notifyError(error.response?.data?.message || 'Transaction failed');
    }
  };

  const openTransactionModal = (stock, type) => {
    setSelectedStock(stock);
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const openHistoryModal = (stock) => {
    setSelectedStock(stock);
    fetchTransactions(stock._id);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setFormData({
      yarnId: '',
      openingStock: '',
      minStockLevel: '',
      location: 'Main Store',
    });
  };

  const resetTransactionForm = () => {
    setTransactionData({
      quantity: '',
      supplier: '',
      invoiceNumber: '',
      rate: '',
      loomId: '',
      remarks: '',
    });
    setSelectedStock(null);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'received': return 'success';
      case 'issued': return 'warning';
      case 'returned': return 'info';
      case 'wastage': return 'danger';
      case 'opening': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            Yarn Stock Management
          </h1>
          <p className="text-gray-500 mt-1">Track yarn inventory and movements</p>
        </div>
        <PermissionGuard permission="yarnStock:create">
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Yarn Stock
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <p className="text-indigo-100 text-sm">Total Stock (kg)</p>
            <p className="text-2xl font-bold">{stats.summary.totalClosingStock?.toFixed(2)}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Received (kg)</p>
            <p className="text-2xl font-bold">{stats.summary.totalReceived?.toFixed(2)}</p>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-orange-100 text-sm">Issued (kg)</p>
            <p className="text-2xl font-bold">{stats.summary.totalIssued?.toFixed(2)}</p>
          </Card>
          <Card className={`bg-gradient-to-br ${stats.lowStockCount > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} text-white`}>
            <p className="text-gray-100 text-sm">Low Stock Items</p>
            <p className="text-2xl font-bold">{stats.lowStockCount}</p>
          </Card>
        </div>
      )}

      {/* Wastage Alert */}
      {stats?.wastage && stats.wastage.totalEntries > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-4">
            <TrendingDown className="w-8 h-8 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Wastage Summary</h3>
              <p className="text-yellow-700">
                Total: {stats.wastage.totalWastageKg?.toFixed(2)} kg | 
                Avg: {stats.wastage.avgWastagePercent?.toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by yarn name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              onKeyPress={(e) => e.key === 'Enter' && fetchStocks()}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <span className="text-gray-700">Low Stock Only</span>
          </label>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchStocks}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Stock List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : stocks.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Yarn Stocks Found</h3>
          <p className="text-gray-500 mb-4">Initialize stock for your yarns</p>
          <PermissionGuard permission="yarnStock:create">
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Yarn Stock
            </Button>
          </PermissionGuard>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => (
            <Card key={stock._id} hover className="relative">
              {stock.isLowStock && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Low
                  </Badge>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-bold text-lg text-gray-900">
                  {stock.yarn?.displayName || stock.yarn?.name}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {stock.yarn?.yarnType} | {stock.yarn?.yarnCategory}
                </p>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Opening</span>
                  <span className="font-medium">{stock.openingStock?.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>+ Received</span>
                  <span className="font-medium">{stock.receivedStock?.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>- Issued</span>
                  <span className="font-medium">{stock.issuedStock?.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>+ Returned</span>
                  <span className="font-medium">{stock.returnedStock?.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Closing</span>
                  <span className={`font-bold text-lg ${stock.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {stock.closingStock?.toFixed(2)} kg
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <PermissionGuard permission="yarnStock:receive">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openTransactionModal(stock, 'receive')}
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-1" />
                    Receive
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="yarnStock:issue">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openTransactionModal(stock, 'issue')}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                    Issue
                  </Button>
                </PermissionGuard>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openHistoryModal(stock)}
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Stock Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Initialize Yarn Stock"
      >
        <form onSubmit={handleAddStock} className="space-y-4">
          <Select
            label="Select Yarn *"
            value={formData.yarnId}
            onChange={(e) => setFormData({ ...formData, yarnId: e.target.value })}
            options={[
              { value: '', label: 'Select a yarn' },
              ...yarns.map(y => ({
                value: y._id,
                label: y.displayName || y.name
              }))
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Opening Stock (kg)"
              type="number"
              step="0.01"
              value={formData.openingStock}
              onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
              placeholder="0.00"
              min="0"
            />
            <Input
              label="Min Stock Level (kg)"
              type="number"
              step="0.01"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              placeholder="Alert threshold"
              min="0"
            />
          </div>
          <Input
            label="Storage Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Main Store, Warehouse A"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Initialize Stock</Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          resetTransactionForm();
        }}
        title={`${transactionType === 'receive' ? 'Receive' : transactionType === 'issue' ? 'Issue' : 'Return'} Yarn`}
      >
        <form onSubmit={handleTransaction} className="space-y-4">
          {selectedStock && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="font-medium">{selectedStock.yarn?.displayName}</p>
              <p className="text-sm text-gray-500">
                Current Stock: <span className="font-medium">{selectedStock.closingStock?.toFixed(2)} kg</span>
              </p>
            </div>
          )}
          
          <Input
            label="Quantity (kg) *"
            type="number"
            step="0.01"
            value={transactionData.quantity}
            onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
            placeholder="Enter quantity"
            required
            min="0.001"
          />
          
          {transactionType === 'receive' && (
            <>
              <Input
                label="Supplier"
                value={transactionData.supplier}
                onChange={(e) => setTransactionData({ ...transactionData, supplier: e.target.value })}
                placeholder="Supplier name"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Invoice Number"
                  value={transactionData.invoiceNumber}
                  onChange={(e) => setTransactionData({ ...transactionData, invoiceNumber: e.target.value })}
                  placeholder="INV-001"
                />
                <Input
                  label="Rate (₹/kg)"
                  type="number"
                  step="0.01"
                  value={transactionData.rate}
                  onChange={(e) => setTransactionData({ ...transactionData, rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </>
          )}
          
          {(transactionType === 'issue' || transactionType === 'return') && (
            <Select
              label="Loom (Optional)"
              value={transactionData.loomId}
              onChange={(e) => setTransactionData({ ...transactionData, loomId: e.target.value })}
              options={[
                { value: '', label: 'Select Loom' },
                ...looms.map(l => ({ value: l._id, label: l.loomCode }))
              ]}
            />
          )}
          
          <Input
            label="Remarks"
            value={transactionData.remarks}
            onChange={(e) => setTransactionData({ ...transactionData, remarks: e.target.value })}
            placeholder="Additional notes..."
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowTransactionModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {transactionType === 'receive' ? 'Receive Stock' : transactionType === 'issue' ? 'Issue Stock' : 'Return Stock'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedStock(null);
          setTransactions([]);
        }}
        title={`Transaction History: ${selectedStock?.yarn?.displayName || ''}`}
        size="lg"
      >
        {transactionsLoading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Qty (kg)</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Balance</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn._id} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-sm">{formatDate(txn.date)}</td>
                    <td className="py-2 px-3">
                      <Badge variant={getTransactionTypeColor(txn.transactionType)} className="capitalize">
                        {txn.transactionType}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      <span className={
                        txn.transactionType === 'received' || txn.transactionType === 'returned' || txn.transactionType === 'opening'
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }>
                        {txn.transactionType === 'issued' || txn.transactionType === 'wastage' ? '-' : '+'}
                        {txn.quantity?.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-sm">{txn.balanceAfter?.toFixed(2)}</td>
                    <td className="py-2 px-3 text-sm text-gray-500 truncate max-w-32">
                      {txn.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default YarnStockManagement;
