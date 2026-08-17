function scoreVendorsForDrug(drugId, allVendors, allBatches, allShipments) {
  const relevantBatches = allBatches.filter(
    (batch) => String(batch.drug) === String(drugId)
  );

  const vendorIds = [
    ...new Set(relevantBatches.map((batch) => String(batch.vendor))),
  ];

  const vendors = allVendors.filter(
    (vendor) => vendorIds.includes(String(vendor._id))
  );

  const results = vendors.map((vendor) => {
    const vendorBatches = relevantBatches.filter(
      (batch) => String(batch.vendor) === String(vendor._id)
    );

    const vendorShipments = allShipments.filter(
      (shipment) =>
        String(shipment.from) === String(vendor._id) &&
        shipment.status === "delivered" &&
        shipment.batches.some((batchId) =>
          vendorBatches.some(
            (batch) => String(batch._id) === String(batchId)
          )
        )
    );

    const lastSuppliedDate = vendorShipments.reduce((latest, shipment) => {
      if (!shipment.deliveredAt) return latest;

      if (!latest || shipment.deliveredAt > latest) {
        return shipment.deliveredAt;
      }

      return latest;
    }, null);

    const reliabilityScore = vendor.reliabilityScore ?? 0;

let recencyScore = 0;

if (lastSuppliedDate) {
  const daysSinceSupply =
    (Date.now() - new Date(lastSuppliedDate).getTime()) /
    (1000 * 60 * 60 * 24);

  recencyScore = Math.max(0, 100 - daysSinceSupply);
}

const score = reliabilityScore * 0.7 + recencyScore * 0.3;

return {
  vendor,
  score: Number(score.toFixed(2)),
  reliabilityScore,
  lastSuppliedDate,
};
  });

  return results.sort((a, b) => b.score - a.score);
}

module.exports = {
  scoreVendorsForDrug,
};