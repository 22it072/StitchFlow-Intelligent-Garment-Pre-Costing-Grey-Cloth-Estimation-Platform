// backend/utils/weavingCalculations.js

/**
 * Calculate yarn wastage
 * Wastage (kg) = Issued Yarn − Actual Consumption
 * Wastage (%) = (Wastage / Issued Yarn) × 100
 */
const calculateYarnWastage = (issuedQuantity, actualConsumption) => {
  const wastageQuantity = issuedQuantity - actualConsumption;
  const wastagePercentage = issuedQuantity > 0 
    ? (wastageQuantity / issuedQuantity) * 100 
    : 0;
  
  return {
    wastageQuantity: Number(wastageQuantity.toFixed(4)),
    wastagePercentage: Number(wastagePercentage.toFixed(2))
  };
};

/**
 * Calculate warp consumption based on meters produced
 * This is a simplified calculation - actual consumption may vary
 */
const calculateWarpConsumption = (metersProduced, crimpPercentage = 5) => {
  // Add crimp percentage to get actual warp consumed
  const consumption = metersProduced * (1 + (crimpPercentage / 100));
  return Number(consumption.toFixed(2));
};

/**
 * Calculate theoretical yarn consumption
 * For warp: Based on total ends, meters, and denier
 * For weft: Based on picks, panna, and denier
 */
const calculateTheoreticalYarnConsumption = (type, params) => {
  if (type === 'warp') {
    const { totalEnds, meters, denier, wastagePercent = 3 } = params;
    if (!totalEnds || !meters || !denier) return null;
    
    // Weight = (Ends × Meters × Denier × (1 + Wastage%)) / 9000
    const weight = (totalEnds * meters * denier * (1 + wastagePercent / 100)) / 9000;
    return Number(weight.toFixed(4));
  }
  
  if (type === 'weft') {
    const { picks, panna, meters, denier, wastagePercent = 3 } = params;
    if (!picks || !panna || !meters || !denier) return null;
    
    // Weight = (Picks × Panna × Meters × Denier × (1 + Wastage%)) / (9000 × 39.37)
    const weight = (picks * panna * meters * denier * (1 + wastagePercent / 100)) / (9000 * 39.37);
    return Number(weight.toFixed(4));
  }
  
  return null;
};

/**
 * Format meters for display
 */
const formatMeters = (value, precision = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return Number(value).toFixed(precision);
};

/**
 * Format weight (kg) for display
 */
const formatWeight = (value, precision = 4) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0000';
  }
  return Number(value).toFixed(precision);
};

/**
 * Generate roll number
 * Format: COMPANY-YYYYMMDD-XXXX
 */
const generateRollNumber = (companyCode, sequence) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(sequence).padStart(4, '0');
  return `${companyCode}-${dateStr}-${seqStr}`;
};

/**
 * Generate beam number
 * Format: BM-YYYYMM-XXXX
 */
const generateBeamNumber = (sequence) => {
  const date = new Date();
  const monthStr = date.toISOString().slice(0, 7).replace(/-/g, '');
  const seqStr = String(sequence).padStart(4, '0');
  return `BM-${monthStr}-${seqStr}`;
};

/**
 * Validate yarn stock transaction
 */
const validateYarnStockTransaction = (type, quantity, currentStock) => {
  const errors = [];
  
  if (!quantity || quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (type === 'issued' && quantity > currentStock) {
    errors.push(`Insufficient stock. Available: ${currentStock} kg`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate GSM from weight, length, and width
 * GSM = (Weight in grams) / (Length in meters × Width in meters)
 */
const calculateGSM = (weightKg, lengthMeters, widthMeters) => {
  if (!weightKg || !lengthMeters || !widthMeters) return null;
  
  const weightGrams = weightKg * 1000;
  const areaSquareMeters = lengthMeters * widthMeters;
  const gsm = weightGrams / areaSquareMeters;
  
  return Number(gsm.toFixed(2));
};

module.exports = {
  calculateYarnWastage,
  calculateWarpConsumption,
  calculateTheoreticalYarnConsumption,
  formatMeters,
  formatWeight,
  generateRollNumber,
  generateBeamNumber,
  validateYarnStockTransaction,
  calculateGSM
};