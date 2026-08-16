// Mock data for each time-stamped section of the "day in the life" narrative.
// mockType maps to a component in src/components/MockCard/.
// Every number, batch code, and hospital name here is invented for the demo
// but shaped like the real data model in the PSS04 build docs (Drug, Batch,
// Hospital, Vendor, Order, Shipment).

const timeline = [
  {
    time: '08:00',
    module: 'Module · consumption service → forecast engine',
    heading: 'The overnight sync runs before the wards do',
    paragraph:
      "Every dispense from yesterday's shift gets written to the consumption log overnight — nothing new about that. What's new is what happens next: a moving-average model reads three weeks of Ward 3's insulin draw-down against what's left in the fridge, and it doesn't like the slope. Nobody asked it to check. It checks every morning at eight, for every drug, at every hospital.",
    mock: {
      type: 'alert',
      props: {
        level: 'warning',
        drug: 'Insulin (Human, 40IU)',
        hospital: 'District Hospital, Ward 3',
        detail: 'Consumption up 18% this month · 6 days of stock left at current draw-down',
        eta: 'Predicted shortage: Fri, in 6 days',
      },
    },
  },
  {
    time: '10:15',
    module: 'Module · alert & notification (Socket.io rooms)',
    heading: "The dashboard flags it before the ward does",
    paragraph:
      "By the time the ward pharmacist would normally notice a shelf thinning out, the alert has already reached the admin dashboard — pushed live down a websocket room, not waiting on a page refresh. It doesn't just say low stock. It says why: the trend, the days remaining, the exact batch it's counting down from.",
    mock: {
      type: 'alertFeed',
      props: {
        items: [
          { level: 'critical', text: 'Oxytocin — City Hospital — 2 days left', tag: '🔴' },
          { level: 'warning', text: 'Insulin (40IU) — District Hospital, Ward 3 — 6 days left', tag: '🟡' },
          { level: 'normal', text: 'Paracetamol IV — 4 hospitals — within range', tag: '🟢' },
        ],
        action: 'Review shortage',
      },
    },
  },
  {
    time: '12:30',
    module: 'Module · redistribution optimizer (FEFO engine)',
    heading: 'It looks sideways before it looks outward',
    paragraph:
      "The obvious move is a fresh purchase order. The system checks something else first — whether anyone nearby already has the slack. Turns out Sub-District Hospital B is sitting on 400 spare units of the same batch, ordered for a surge that didn't come. Instead of a new procurement request, the admin gets a transfer suggestion, one tap from becoming real.",
    mock: {
      type: 'transfer',
      props: {
        drug: 'Insulin (Human, 40IU)',
        qty: 400,
        from: 'Sub-District Hospital B',
        to: 'District Hospital, Ward 3',
        batch: 'AX4471',
        reason: 'Idle stock exceeds Hospital B\'s 30-day forecast by 340 units',
      },
    },
  },
  {
    time: '15:00',
    module: 'Module · shipment tracking (webhook-driven)',
    heading: 'A delay upstream gets re-checked downstream',
    paragraph:
      "A vendor marks a shipment of IV fluids as delayed — a two-line status update on their end, nothing dramatic. But that status change is a trigger, not just a log entry: it fires straight back into the alert engine, which re-runs the question it already answered this morning — who was counting on this arriving on time, and are they still fine without it.",
    mock: {
      type: 'shipment',
      props: {
        order: 'ORD-2291',
        drug: 'IV Fluid (Ringer Lactate, 500ml)',
        vendor: 'MedSupply Distributors',
        steps: ['Order Placed', 'Packed', 'Dispatched', 'In Transit', 'Delivered'],
        currentStep: 3,
        delayDays: 2,
        etaOriginal: '16 Aug',
        etaNow: '18 Aug',
      },
    },
  },
  {
    time: '18:45',
    module: 'Module · FEFO expiry engine',
    heading: 'The batch that\'s about to expire jumps the queue',
    paragraph:
      "A nurse logging a routine dispense doesn't need to remember which batch is oldest — the system already sorted that. Batch AX4108 has eleven days left on the shelf and a newer batch sitting behind it with six months to spare. The dispense screen suggests the older one first, quietly, the way it should have worked on paper all along.",
    mock: {
      type: 'register',
      props: {
        title: 'Dispense log — Ward 3',
        rows: [
          { batch: 'AX4108', drug: 'Insulin (Human, 40IU)', expiry: '27 Aug', qty: '12', flag: 'Dispense first — FEFO' },
          { batch: 'AX4471', drug: 'Insulin (Human, 40IU)', expiry: '14 Feb', qty: '400', flag: '' },
          { batch: 'RL-0092', drug: 'IV Fluid (Ringer Lactate)', expiry: '02 Nov', qty: '85', flag: '' },
        ],
      },
    },
  },
  {
    time: '21:30',
    module: 'Module · aggregation & reporting (health-score banner)',
    heading: 'Four numbers before the admin closes the laptop',
    paragraph:
      "Nothing new gets typed at this hour. The rollup that's been running every fifteen minutes since morning just settles into its end-of-day shape: how healthy the stock position is across every hospital, how many shortages were caught before anyone rang the admin office, and what's already on a truck for tomorrow.",
    mock: {
      type: 'endOfDay',
      props: {
        healthScore: 91,
        shortagesPrevented: 3,
        activeShipments: 7,
        arrivingTomorrow: 2,
      },
    },
  },
]

export default timeline
