// backend/utils/loomCalculations.js

/**
 * Calculate actual efficiency from production data
 * Formula: (Actual Production / Theoretical Production) × 100
 * Theoretical = (RPM × 60 × Hours) / (PPI × 39.37)
 */
const calculateActualEfficiency = (metersProduced, rpm, hours, ppi) => {
  if (!rpm || !hours || !ppi || rpm <= 0 || hours <= 0 || ppi <= 0) {
    return null;
  }
  
  const theoreticalProduction = (rpm * 60 * hours) / (ppi * 39.37);
  const efficiency = (metersProduced / theoreticalProduction) * 100;
  
  return Math.min(100, Math.max(0, Number(efficiency.toFixed(2))));
};

/**
 * Calculate theoretical production for a loom
 */
const calculateTheoreticalProduction = (rpm, hours, ppi, efficiency = 100) => {
  if (!rpm || !hours || !ppi) return 0;
  
  const theoretical = (rpm * 60 * hours * (efficiency / 100)) / (ppi * 39.37);
  return Number(theoretical.toFixed(2));
};

/**
 * Format loom status for display
 */
const formatLoomStatus = (status) => {
  const statusMap = {
    running: { label: 'Running', color: 'green' },
    idle: { label: 'Idle', color: 'gray' },
    maintenance: { label: 'Maintenance', color: 'yellow' },
    breakdown: { label: 'Breakdown', color: 'red' }
  };
  return statusMap[status] || { label: status, color: 'gray' };
};

/**
 * Calculate loom utilization percentage
 */
const calculateLoomUtilization = (runningLooms, totalLooms) => {
  if (totalLooms === 0) return 0;
  return Number(((runningLooms / totalLooms) * 100).toFixed(1));
};

/**
 * Get loom availability status
 */
const getLoomAvailability = (loom) => {
  if (loom.status === 'running') {
    return { available: false, reason: 'Currently running' };
  }
  if (loom.status === 'maintenance') {
    return { available: false, reason: 'Under maintenance' };
  }
  if (loom.status === 'breakdown') {
    return { available: false, reason: 'Breakdown - needs repair' };
  }
  if (!loom.isActive) {
    return { available: false, reason: 'Loom is deactivated' };
  }
  return { available: true, reason: 'Available for production' };
};

/**
 * Validate production log entry
 */
const validateProductionLogEntry = (data) => {
  const errors = [];
  
  if (!data.loom) {
    errors.push('Loom is required');
  }
  
  if (!data.qualityName || !data.qualityName.trim()) {
    errors.push('Quality name is required');
  }
  
  if (!data.date) {
    errors.push('Production date is required');
  }
  
  if (!data.shift) {
    errors.push('Shift is required');
  }
  
  if (data.metersProduced === undefined || data.metersProduced === null) {
    errors.push('Meters produced is required');
  } else if (data.metersProduced < 0) {
    errors.push('Meters produced cannot be negative');
  }
  
  if (data.actualRPM !== undefined && data.actualRPM !== null && data.actualRPM < 0) {
    errors.push('RPM cannot be negative');
  }
  
  if (data.actualEfficiency !== undefined && data.actualEfficiency !== null) {
    if (data.actualEfficiency < 0 || data.actualEfficiency > 100) {
      errors.push('Efficiency must be between 0 and 100');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  calculateActualEfficiency,
  calculateTheoreticalProduction,
  formatLoomStatus,
  calculateLoomUtilization,
  getLoomAvailability,
  validateProductionLogEntry
};