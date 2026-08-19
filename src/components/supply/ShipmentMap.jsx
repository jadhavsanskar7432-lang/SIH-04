import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation } from 'lucide-react'

// Leaflet's default marker icons reference image paths that don't resolve
// correctly under Vite's bundler — fix once, globally, on import.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const originIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'shipment-map-origin-marker',
})

// Real coordinates only: vendor (from) and hospital (to) both carry
// optional latitude/longitude (see models/User.js). If either is missing we
// don't fabricate a position — the fallback panel below is shown instead.
function hasCoords(u) {
  return u && typeof u.latitude === 'number' && typeof u.longitude === 'number'
}

export default function ShipmentMap({ shipment }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [ready, setReady] = useState(false)

  const origin = shipment?.from
  const destination = shipment?.to
  const originOk = hasCoords(origin)
  const destOk = hasCoords(destination)

  useEffect(() => {
    if (!originOk || !destOk || !mapContainerRef.current) return

    const originPos = [origin.latitude, origin.longitude]
    const destPos = [destination.latitude, destination.longitude]

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    })
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    L.marker(originPos, { icon: originIcon })
      .addTo(map)
      .bindPopup(`<b>${origin.name}</b><br/>Vendor (origin)`)

    L.marker(destPos)
      .addTo(map)
      .bindPopup(`<b>${destination.name}</b><br/>Hospital (destination)`)

    L.polyline([originPos, destPos], {
      color: '#1F4B3D',
      weight: 3,
      opacity: 0.8,
      dashArray: '6 6',
    }).addTo(map)

    // In-transit shipments: show an estimated position along the route,
    // derived from real timestamps (dispatchedAt → expectedDelivery),
    // clearly labeled as an estimate rather than live GPS.
    if (shipment.status === 'in_transit' && shipment.dispatchedAt && shipment.expectedDelivery) {
      const start = new Date(shipment.dispatchedAt).getTime()
      const end = new Date(shipment.expectedDelivery).getTime()
      const now = Date.now()
      let frac = end > start ? (now - start) / (end - start) : 0
      frac = Math.min(0.95, Math.max(0.05, frac))

      const estPos = [
        originPos[0] + (destPos[0] - originPos[0]) * frac,
        originPos[1] + (destPos[1] - originPos[1]) * frac,
      ]

      L.circleMarker(estPos, {
        radius: 7,
        color: '#F59E0B',
        fillColor: '#F59E0B',
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup('Estimated position (based on dispatch/ETA time, not live GPS)')
    }

    map.fitBounds([originPos, destPos], { padding: [40, 40] })
    setReady(true)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [shipment?._id, shipment?.status, originOk, destOk])

  if (!originOk || !destOk) {
    return (
      <FallbackPanel
        origin={origin}
        destination={destination}
        note="Coordinates missing for vendor or hospital — showing locations only."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-card transition-shadow duration-200 hover:shadow-popover">
      <div ref={mapContainerRef} className="h-64 w-full bg-slate-100" />
      {!ready && (
        <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-brand-900" />
          <p className="text-xs text-slate-400">Loading map…</p>
        </div>
      )}
    </div>
  )
}

function FallbackPanel({ origin, destination, note }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-slate-400" />
        <span className="font-medium">Origin:</span> {origin?.name || 'Unknown vendor'}
        {origin?.location ? ` · ${origin.location}` : ''}
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <Navigation size={12} className="text-slate-400" />
        <span className="font-medium">Destination:</span> {destination?.name || 'Unknown hospital'}
        {destination?.location ? ` · ${destination.location}` : ''}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{note}</p>
    </div>
  )
}