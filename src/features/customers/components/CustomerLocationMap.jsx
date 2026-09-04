import { useEffect } from 'react'
import { Icon } from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

export const DEFAULT_MAP_CENTER = [41.2995, 69.2401]

const locationMarkerIcon = new Icon({
  iconRetinaUrl: markerIconRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapController({ position, zoom }) {
  const map = useMap()

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 0)
    return () => window.clearTimeout(timer)
  }, [map])

  useEffect(() => {
    if (!position) return
    map.setView(position, Math.max(map.getZoom(), zoom), { animate: true })
  }, [map, position?.[0], position?.[1], zoom])

  return null
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click: (event) => onPick(event.latlng),
  })
  return null
}

export function CustomerLocationMap({ position, onPick, interactive = true, className = '' }) {
  const center = position || DEFAULT_MAP_CENTER
  const zoom = position ? 15 : 12

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      scrollWheelZoom={interactive}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      keyboard={interactive}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController position={position} zoom={15} />
      {interactive && <MapClickHandler onPick={onPick} />}
      {position && (
        <Marker
          position={position}
          icon={locationMarkerIcon}
          draggable={interactive}
          eventHandlers={interactive ? { dragend: (event) => onPick(event.target.getLatLng()) } : undefined}
        />
      )}
    </MapContainer>
  )
}

export default CustomerLocationMap
