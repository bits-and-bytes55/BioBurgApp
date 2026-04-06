export const FRANCHISE_OPEN_ORDER_STATUSES = [
  "PRESCRIPTION_UPLOADED",
  "UNDER_REVIEW",
  "APPROVED",
  "PLACED",
  "ACCEPTED",
  "PACKED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
];

const DEFAULT_COMMISSION_RATE = 12;
const DEFAULT_SETTLEMENT_HOLD_DAYS = 7;
const DEFAULT_MINIMUM_PAYOUT_AMOUNT = 0;

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const toPositiveNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
};

export const normalizeFranchiseSettlementConfig = (config = {}) => ({
  commissionRate: Math.min(
    100,
    toPositiveNumber(config.commissionRate, DEFAULT_COMMISSION_RATE),
  ),
  settlementHoldDays: Math.round(
    Math.min(90, toPositiveNumber(config.settlementHoldDays, DEFAULT_SETTLEMENT_HOLD_DAYS)),
  ),
  minimumPayoutAmount: roundCurrency(
    toPositiveNumber(config.minimumPayoutAmount, DEFAULT_MINIMUM_PAYOUT_AMOUNT),
  ),
  settlementNotes: String(config.settlementNotes || "").trim(),
});

export const computeFranchiseSettlementMetrics = (
  orders = [],
  settlementConfig = {},
  options = {},
) => {
  const rules = normalizeFranchiseSettlementConfig(settlementConfig);
  const now = options.now ? new Date(options.now) : new Date();
  const holdCutoff = new Date(now);
  holdCutoff.setHours(23, 59, 59, 999);
  holdCutoff.setDate(holdCutoff.getDate() - rules.settlementHoldDays);

  const metrics = {
    totalOrders: 0,
    deliveredOrders: 0,
    deliveredPaidOrders: 0,
    deliveredPendingCollectionOrders: 0,
    openOrders: 0,
    cancelledOrders: 0,
    grossSales: 0,
    paidAmount: 0,
    onlineCollected: 0,
    codOrderValue: 0,
    deliveredValue: 0,
    deliveredPaidValue: 0,
    deliveredPendingCollection: 0,
    openOrderValue: 0,
    cancelledValue: 0,
    settlementEligibleOrders: 0,
    settlementEligibleAmount: 0,
    settlementInHoldOrders: 0,
    settlementInHoldAmount: 0,
    commissionAmount: 0,
    projectedCommissionAmount: 0,
    netPayoutDue: 0,
    projectedNetSettlement: 0,
    belowThresholdAmount: 0,
    holdCutoffDate: holdCutoff.toISOString(),
    rules,
  };

  for (const order of orders) {
    const totalAmount = Number(order?.totalAmount || 0);
    const orderStatus = String(order?.orderStatus || "");
    const paymentMode = String(order?.paymentMode || "");
    const paymentStatus = String(order?.paymentStatus || "");
    const deliveredAtValue = order?.deliveredAt || order?.createdAt || null;
    const deliveredAt = deliveredAtValue ? new Date(deliveredAtValue) : null;

    metrics.totalOrders += 1;
    metrics.grossSales += totalAmount;

    if (paymentStatus === "PAID") {
      metrics.paidAmount += totalAmount;
    }

    if (paymentMode === "ONLINE" && paymentStatus === "PAID") {
      metrics.onlineCollected += totalAmount;
    }

    if (paymentMode === "COD") {
      metrics.codOrderValue += totalAmount;
    }

    if (orderStatus === "DELIVERED") {
      metrics.deliveredOrders += 1;
      metrics.deliveredValue += totalAmount;

      if (paymentStatus === "PAID") {
        metrics.deliveredPaidOrders += 1;
        metrics.deliveredPaidValue += totalAmount;

        if (deliveredAt && deliveredAt <= holdCutoff) {
          metrics.settlementEligibleOrders += 1;
          metrics.settlementEligibleAmount += totalAmount;
        } else {
          metrics.settlementInHoldOrders += 1;
          metrics.settlementInHoldAmount += totalAmount;
        }
      } else {
        metrics.deliveredPendingCollectionOrders += 1;
        metrics.deliveredPendingCollection += totalAmount;
      }
    }

    if (FRANCHISE_OPEN_ORDER_STATUSES.includes(orderStatus)) {
      metrics.openOrders += 1;
      metrics.openOrderValue += totalAmount;
    }

    if (["CANCELLED", "REJECTED"].includes(orderStatus)) {
      metrics.cancelledOrders += 1;
      metrics.cancelledValue += totalAmount;
    }
  }

  metrics.commissionAmount = roundCurrency(
    (metrics.settlementEligibleAmount * rules.commissionRate) / 100,
  );
  metrics.projectedCommissionAmount = roundCurrency(
    (metrics.deliveredPaidValue * rules.commissionRate) / 100,
  );

  const eligibleNetPayout = roundCurrency(
    metrics.settlementEligibleAmount - metrics.commissionAmount,
  );
  const projectedNetSettlement = roundCurrency(
    metrics.deliveredPaidValue - metrics.projectedCommissionAmount,
  );

  metrics.netPayoutDue =
    eligibleNetPayout >= rules.minimumPayoutAmount ? eligibleNetPayout : 0;
  metrics.belowThresholdAmount =
    eligibleNetPayout > 0 && eligibleNetPayout < rules.minimumPayoutAmount
      ? eligibleNetPayout
      : 0;
  metrics.projectedNetSettlement = projectedNetSettlement > 0 ? projectedNetSettlement : 0;

  Object.keys(metrics).forEach((key) => {
    if (typeof metrics[key] === "number") {
      metrics[key] = roundCurrency(metrics[key]);
    }
  });

  return metrics;
};
