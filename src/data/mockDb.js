// A single mock "database" every page reads from and writes to via AppContext.
// Shaped after the six core entities in the PSS04 build docs: Drug, Batch,
// Hospital, Vendor, Order, Shipment — plus derived Alert / TransferSuggestion
// records that stand in for what the forecast + alert engine would produce.

export const hospitals = [
  { id: 'H1', name: 'District Hospital, Ward 3', location: 'Sector 12' },
  { id: 'H2', name: 'Sub-District Hospital B', location: 'Sector 7' },
  { id: 'H3', name: 'City Hospital', location: 'Sector 3' },
]

export const vendors = [
  { id: 'V1', name: 'MedSupply Distributors', reliability: 92, avgDelayDays: 0.8 },
  { id: 'V2', name: 'PharmaCare Logistics', reliability: 78, avgDelayDays: 2.3 },
]

export const drugs = [
  { id: 'D1', name: 'Insulin (Human, 40IU)', unit: 'vials', reorderThreshold: 50 },
  { id: 'D2', name: 'Oxytocin', unit: 'ampoules', reorderThreshold: 30 },
  { id: 'D3', name: 'IV Fluid (Ringer Lactate, 500ml)', unit: 'bottles', reorderThreshold: 100 },
  { id: 'D4', name: 'Paracetamol IV', unit: 'bottles', reorderThreshold: 80 },
]

export const batches = [
  { id: 'B1', drugId: 'D1', batchNo: 'AX4108', hospitalId: 'H1', expiry: '2026-08-27', qty: 12 },
  { id: 'B2', drugId: 'D1', batchNo: 'AX4471', hospitalId: 'H2', expiry: '2027-02-14', qty: 400 },
  { id: 'B3', drugId: 'D3', batchNo: 'RL-0092', hospitalId: 'H1', expiry: '2026-11-02', qty: 85 },
  { id: 'B4', drugId: 'D2', batchNo: 'OX-2210', hospitalId: 'H3', expiry: '2026-09-10', qty: 6 },
  { id: 'B5', drugId: 'D4', batchNo: 'PC-1187', hospitalId: 'H1', expiry: '2027-01-20', qty: 210 },
  { id: 'B6', drugId: 'D4', batchNo: 'PC-1190', hospitalId: 'H3', expiry: '2027-03-05', qty: 140 },
]

export const initialOrders = [
  { id: 'ORD-2291', hospitalId: 'H1', drugId: 'D3', qty: 150, vendorId: 'V1', status: 'accepted' },
  { id: 'ORD-2295', hospitalId: 'H3', drugId: 'D2', qty: 60, vendorId: 'V2', status: 'pending' },
]

// Shipment status steps, shared by every shipment.
export const shipmentSteps = ['Order Placed', 'Packed', 'Dispatched', 'In Transit', 'Delivered']

export const initialShipments = [
  {
    id: 'SH-1',
    orderId: 'ORD-2291',
    currentStep: 3,
    delayDays: 2,
    etaOriginal: '16 Aug',
    etaNow: '18 Aug',
  },
]

export const initialAlerts = [
  {
    id: 'A1',
    level: 'critical',
    drugId: 'D2',
    hospitalId: 'H3',
    text: 'Oxytocin — City Hospital — 2 days left',
  },
  {
    id: 'A2',
    level: 'warning',
    drugId: 'D1',
    hospitalId: 'H1',
    text: 'Insulin (40IU) — District Hospital, Ward 3 — 6 days left',
    detail: 'Consumption up 18% this month · 6 days of stock left at current draw-down',
  },
  {
    id: 'A3',
    level: 'normal',
    text: 'Paracetamol IV — 4 hospitals — within range',
  },
]

export const initialTransferSuggestions = [
  {
    id: 'T1',
    drugId: 'D1',
    qty: 400,
    fromId: 'H2',
    toId: 'H1',
    batchNo: 'AX4471',
    reason: "Idle stock exceeds Hospital B's 30-day forecast by 340 units",
  },
]

export const consumptionLog = [
  { hospitalId: 'H1', drugId: 'D1', avgDailyUnits: 2, trend: '+18%' },
  { hospitalId: 'H1', drugId: 'D3', avgDailyUnits: 9, trend: '+4%' },
  { hospitalId: 'H1', drugId: 'D4', avgDailyUnits: 14, trend: '-2%' },
]

export const drugById = (id) => drugs.find((d) => d.id === id)
export const hospitalById = (id) => hospitals.find((h) => h.id === id)
export const vendorById = (id) => vendors.find((v) => v.id === id)
