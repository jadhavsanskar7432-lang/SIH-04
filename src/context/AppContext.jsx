import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  hospitals,
  vendors,
  drugs,
  batches as initialBatches,
  initialOrders,
  initialShipments,
  initialAlerts,
  initialTransferSuggestions,
  consumptionLog,
  shipmentSteps,
} from '../data/mockDb.js'

const AppContext = createContext(null)

// Demo convenience: which hospital/vendor a logged-in hospital/vendor role
// is "looking at". A real build would derive this from the JWT, not a const.
const DEMO_HOSPITAL_ID = 'H1'
const DEMO_VENDOR_ID = 'V1'

export function AppProvider({ children }) {
  const [role, setRole] = useState(() => sessionStorage.getItem('pss04-role') || null)

  const [orders, setOrders] = useState(initialOrders)
  const [shipments, setShipments] = useState(initialShipments)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [transferSuggestions, setTransferSuggestions] = useState(initialTransferSuggestions)
  const [batches, setBatches] = useState(initialBatches)
  const [toast, setToast] = useState(null)

  const login = useCallback((nextRole) => {
    sessionStorage.setItem('pss04-role', nextRole)
    setRole(nextRole)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('pss04-role')
    setRole(null)
  }, [])

  const notify = useCallback((message) => {
    setToast(message)
    window.clearTimeout(notify._t)
    notify._t = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const acceptOrder = useCallback(
    (orderId) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'accepted' } : o)))
      setShipments((prev) => {
        if (prev.some((s) => s.orderId === orderId)) return prev
        return [
          ...prev,
          {
            id: `SH-${prev.length + 2}`,
            orderId,
            currentStep: 1,
            delayDays: 0,
            etaOriginal: 'TBD',
            etaNow: 'TBD',
          },
        ]
      })
      notify(`${orderId} accepted — shipment created`)
    },
    [notify],
  )

  const advanceShipment = useCallback(
    (shipmentId) => {
      setShipments((prev) =>
        prev.map((s) =>
          s.id === shipmentId
            ? { ...s, currentStep: Math.min(s.currentStep + 1, shipmentSteps.length - 1) }
            : s,
        ),
      )
      notify(`${shipmentId} moved forward`)
    },
    [notify],
  )

  const submitRequest = useCallback(
    ({ hospitalId, drugId, qty }) => {
      const id = `ORD-${2300 + orders.length}`
      setOrders((prev) => [...prev, { id, hospitalId, drugId, qty, vendorId: null, status: 'pending' }])
      notify(`Request ${id} raised`)
      return id
    },
    [orders.length, notify],
  )

  const approveTransfer = useCallback(
    (transferId) => {
      const t = transferSuggestions.find((x) => x.id === transferId)
      if (!t) return
      setBatches((prev) =>
        prev.map((b) => {
          if (b.batchNo === t.batchNo && b.hospitalId === t.fromId) {
            return { ...b, qty: Math.max(0, b.qty - t.qty) }
          }
          return b
        }),
      )
      setBatches((prev) => {
        const existing = prev.find((b) => b.batchNo === t.batchNo && b.hospitalId === t.toId)
        if (existing) {
          return prev.map((b) => (b === existing ? { ...b, qty: b.qty + t.qty } : b))
        }
        const source = prev.find((b) => b.batchNo === t.batchNo)
        return [
          ...prev,
          {
            id: `B${prev.length + 1}`,
            drugId: t.drugId,
            batchNo: t.batchNo,
            hospitalId: t.toId,
            expiry: source?.expiry ?? '2027-01-01',
            qty: t.qty,
          },
        ]
      })
      setTransferSuggestions((prev) => prev.filter((x) => x.id !== transferId))
      notify(`Transfer approved — ${t.qty} units moving to destination`)
    },
    [transferSuggestions, notify],
  )

  const value = useMemo(
    () => ({
      role,
      login,
      logout,
      demoHospitalId: DEMO_HOSPITAL_ID,
      demoVendorId: DEMO_VENDOR_ID,
      hospitals,
      vendors,
      drugs,
      batches,
      orders,
      shipments,
      alerts,
      transferSuggestions,
      consumptionLog,
      shipmentSteps,
      acceptOrder,
      advanceShipment,
      submitRequest,
      approveTransfer,
      toast,
    }),
    [
      role,
      login,
      logout,
      batches,
      orders,
      shipments,
      alerts,
      transferSuggestions,
      acceptOrder,
      advanceShipment,
      submitRequest,
      approveTransfer,
      toast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
