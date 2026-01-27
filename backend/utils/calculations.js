const { formatWeight, formatCost } = require('./formatters');

/**
 * Calculate Warp Raw Weight
 * Formula: (Tar × Denier × Wastage) / 9
 */
function calculateWarpRawWeight(tar, denier, wastagePercent) {
  const wastageMultiplier = 1 + (wastagePercent / 100);
  return (tar * denier * wastageMultiplier) / 9;
}

/**
 * Calculate Weft Raw Weight
 * Formula: (Peek × Panna × Denier × Wastage) / 9
 */
function calculateWeftRawWeight(peek, panna, denier, wastagePercent) {
  const wastageMultiplier = 1 + (wastagePercent / 100);
  return (peek * panna * denier * wastageMultiplier) / 9;
}

/**
 * Calculate Raw Cost
 * Formula: Formatted Weight × (Yarn Price + GST Amount)
 */
function calculateRawCost(formattedWeight, yarnPrice, gstPercentage) {
  const gstAmount = (yarnPrice * gstPercentage) / 100;
  const priceWithGst = yarnPrice + gstAmount;
  return formattedWeight * priceWithGst;
}

/**
 * Perform complete estimate calculation
 */
function calculateEstimate(inputs) {
  const {
    warp,
    weft,
    weft2Enabled,
    weft2,
    otherCostPerMeter,
    weightPrecision = 4,
    costPrecision = 2,
  } = inputs;

  const results = {
    warp: {},
    weft: {},
    weft2: null,
    totals: {},
  };

  // === WARP CALCULATIONS ===
  // Step 1: Calculate raw weight
  results.warp.rawWeight = calculateWarpRawWeight(
    warp.tar,
    warp.denier,
    warp.wastage
  );
  
  // Step 2: Format weight using function (NOT division)
  results.warp.formattedWeight = formatWeight(results.warp.rawWeight, weightPrecision);
  
  // Step 3: Calculate raw cost using formatted weight
  results.warp.rawCost = calculateRawCost(
    results.warp.formattedWeight,
    warp.yarnPrice,
    warp.yarnGst
  );
  
  // Step 4: Format cost using function (NOT division)
  results.warp.formattedCost = formatCost(results.warp.rawCost, costPrecision);

  // === WEFT CALCULATIONS ===
  // Step 1: Calculate raw weight
  results.weft.rawWeight = calculateWeftRawWeight(
    weft.peek,
    weft.panna,
    weft.denier,
    weft.wastage
  );
  
  // Step 2: Format weight
  results.weft.formattedWeight = formatWeight(results.weft.rawWeight, weightPrecision);
  
  // Step 3: Calculate raw cost using formatted weight
  results.weft.rawCost = calculateRawCost(
    results.weft.formattedWeight,
    weft.yarnPrice,
    weft.yarnGst
  );
  
  // Step 4: Format cost
  results.weft.formattedCost = formatCost(results.weft.rawCost, costPrecision);

  // === WEFT-2 CALCULATIONS (if enabled) ===
  if (weft2Enabled && weft2) {
    results.weft2 = {};
    
    // Step 1: Calculate raw weight
    results.weft2.rawWeight = calculateWeftRawWeight(
      weft2.peek,
      weft2.panna,
      weft2.denier,
      weft2.wastage
    );
    
    // Step 2: Format weight
    results.weft2.formattedWeight = formatWeight(results.weft2.rawWeight, weightPrecision);
    
    // Step 3: Calculate raw cost
    results.weft2.rawCost = calculateRawCost(
      results.weft2.formattedWeight,
      weft2.yarnPrice,
      weft2.yarnGst
    );
    
    // Step 4: Format cost
    results.weft2.formattedCost = formatCost(results.weft2.rawCost, costPrecision);
  }

  // === TOTAL CALCULATIONS ===
  // Total Weight = Sum of formatted weights
  results.totals.totalWeight = 
    results.warp.formattedWeight + 
    results.weft.formattedWeight + 
    (results.weft2 ? results.weft2.formattedWeight : 0);

  // Total Cost = Sum of formatted costs + Other Cost per Meter
  results.totals.totalCost = 
    results.warp.formattedCost + 
    results.weft.formattedCost + 
    (results.weft2 ? results.weft2.formattedCost : 0) + 
    (otherCostPerMeter || 0);

  // Round totals
  results.totals.totalWeight = Number(results.totals.totalWeight.toFixed(weightPrecision));
  results.totals.totalCost = Number(results.totals.totalCost.toFixed(costPrecision));

  return results;
}

module.exports = {
  calculateWarpRawWeight,
  calculateWeftRawWeight,
  calculateRawCost,
  calculateEstimate,
};