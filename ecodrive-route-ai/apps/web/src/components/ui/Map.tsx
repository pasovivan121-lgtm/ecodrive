import * as React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type Center = [number, number]

const defaultCenter: Center = [42.7, 23.3]

export const DriveMap: React.FC<{
  center?: Center
  zoom?: number
} > = ({ center = defaultCenter, zoom = 6 }) => {
  return (
    <div className="h-[400px] w-full rounded-md overflow-border" style={{ height: "400px" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Marker position={center}>
          <Popup>Current Location</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

DriveMap.displayName = "DriveMap"