const loop = [
  { step: 'Monitor', detail: 'consumption logged, stock rolled up' },
  { step: 'Predict', detail: 'forecast + severity per drug, per hospital' },
  { step: 'Decide', detail: 'transfer suggested, or a new order raised' },
  { step: 'Procure / Redistribute', detail: 'vendor picked, or stock moved sideways' },
  { step: 'Track', detail: 'shipment status, delay re-triggers the check' },
  { step: 'Deliver', detail: 'stock goes live the moment it lands' },
  { step: 'Monitor again', detail: 'the cycle never actually ends' },
]

export default loop
