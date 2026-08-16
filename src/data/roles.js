const roles = [
  {
    key: 'admin',
    label: 'Admin / Govt',
    strap: 'Sees the whole system, decides what moves',
    description:
      "One screen rolling up every hospital and every drug — stock totals, expiring counts, active and delayed shipments. This is where the shortage alerts land first, where a transfer gets approved with a click instead of a phone call, and where a supply order gets raised against a vendor comparison instead of a hunch.",
    gets: [
      'Live stock & expiry overview across all hospitals',
      'Shortage alerts with the reasoning attached, not just a badge',
      'Vendor comparison by price, delay history, and reliability score',
      'One-tap approval on redistribution suggestions',
    ],
  },
  {
    key: 'hospital',
    label: 'Hospital',
    strap: 'Logs what actually happened on the ward',
    description:
      "The hospital side is deliberately unglamorous: current stock, daily consumption, and a request form for when something's genuinely running out. Every dispense logged here is what feeds the forecast engine — this screen is the reason the prediction is worth trusting.",
    gets: [
      'Stock and daily consumption for their own site only',
      'A raise-request form that goes straight into the order pipeline',
      'Offline-safe entry — logs locally, syncs once the connection returns',
      'Visibility into what\'s already been approved and is on the way',
    ],
  },
  {
    key: 'vendor',
    label: 'Vendor',
    strap: 'Accepts orders, updates status, builds a track record',
    description:
      "A vendor sees incoming supply orders and a straightforward status stepper — Packed, Dispatched, In Transit, Delivered. Nothing clever required of them. But every status update they make, and every delay, quietly writes to a reliability score that shapes who gets picked next time.",
    gets: [
      'Incoming orders with an Accept action',
      'A status stepper instead of a support ticket for updates',
      'A visible on-time percentage that follows them across orders',
      'No manual paperwork once a shipment reaches the hospital',
    ],
  },
]

export default roles
