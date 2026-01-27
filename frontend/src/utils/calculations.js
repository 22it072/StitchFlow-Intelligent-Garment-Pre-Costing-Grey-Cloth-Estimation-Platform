import { formatWeight, formatCost } from './formatters';

/**
 * Calculate Warp Raw Weight
 * Formula: (Tar × Denier × Wastage) / 9
 */
export function calculateWarpRawWeight(tar, denier, wastagePercent) {
  const wastageMultiplier = 1 + (wastagePercent / 100);
  return (tar * denier * wastageMultiplier) / 9;
}

/**
 * Calculate Weft Raw Weight
 * Formula: (Peek × Panna × Denier × Wastage) / 9
 */
export function calculateWeftRawWeight(peek, panna, denier, wastagePercent) {
  const wastageMultiplier = 1 + (wastagePercent / 100);
  return (peek * panna * denier * wastageMultiplier) / 9;
}

/**
 * Calculate Raw Cost
 * Formula: Formatted Weight × (Yarn Price + GST Amount)
 */
export function calculateRawCost(formattedWeight, yarnPrice, gstPercentage) {
  const gstAmount = (yarnPrice * gstPercentage) / 100;
  const priceWithGst = yarnPrice + gstAmount;
  return formattedWeight * priceWithGst;
}

/**
 * Perform complete estimate calculation
 */
export function calculateEstimate(inputs, weightPrecision = 4, costPrecision = 2) {
  const {
    warp,
    weft,
    weft2Enabled,
    weft2,
    otherCostPerMeter,
  } = inputs;

  const results = {
    warp: {},
    weft: {},
    weft2: null,
    totals: {},
  };

  // === WARP CALCULATIONS ===
  results.warp.rawWeight = calculateWarpRawWeight(
    warp.tar,
    warp.denier,
    warp.wastage
  );
  results.warp.formattedWeight = formatWeight(results.warp.rawWeight, weightPrecision);
  results.warp.rawCost = calculateRawCost(
    results.warp.formattedWeight,
    warp.yarnPrice,
    warp.yarnGst
  );
  results.warp.formattedCost = formatCost(results.warp.rawCost, costPrecision);

  // === WEFT CALCULATIONS ===
  results.weft.rawWeight = calculateWeftRawWeight(
    weft.peek,
    weft.panna,
    weft.denier,
    weft.wastage
  );
  results.weft.formattedWeight = formatWeight(results.weft.rawWeight, weightPrecision);
  results.weft.rawCost = calculateRawCost(
    results.weft.formattedWeight,
    weft.yarnPrice,
    weft.yarnGst
  );
  results.weft.formattedCost = formatCost(results.weft.rawCost, costPrecision);

  // === WEFT-2 CALCULATIONS ===
  if (weft2Enabled && weft2) {
    results.weft2 = {};
    results.weft2.rawWeight = calculateWeftRawWeight(
      weft2.peek,
      weft2.panna,
      weft2.denier,
      weft2.wastage
    );
    results.weft2.formattedWeight = formatWeight(results.weft2.rawWeight, weightPrecision);
    results.weft2.rawCost = calculateRawCost(
      results.weft2.formattedWeight,
      weft2.yarnPrice,
      weft2.yarnGst
    );
    results.weft2.formattedCost = formatCost(results.weft2.rawCost, costPrecision);
  }

  // === TOTALS ===
  results.totals.totalWeight = 
    results.warp.formattedWeight + 
    results.weft.formattedWeight + 
    (results.weft2 ? results.weft2.formattedWeight : 0);

  results.totals.totalCost = 
    results.warp.formattedCost + 
    results.weft.formattedCost + 
    (results.weft2 ? results.weft2.formattedCost : 0) + 
    (otherCostPerMeter || 0);

  results.totals.totalWeight = Number(results.totals.totalWeight.toFixed(weightPrecision));
  results.totals.totalCost = Number(results.totals.totalCost.toFixed(costPrecision));

  return results;
}