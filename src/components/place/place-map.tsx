"use client";

import type { Coordinates, MapPoint } from "@/types/place";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const pointColors: Record<MapPoint["type"], string> = {
  attraction: "#fb7185",
  hotel: "#fbbf24",
  airport: "#38bdf8",
  rail: "#a78bfa",
  metro: "#818cf8",
  tram: "#34d399",
  bus: "#2dd4bf",
};

interface PlaceMapProps {
  center: Coordinates;
  placeName: string;
  points: MapPoint[];
}

export function PlaceMap({ center, placeName, points }: PlaceMapProps) {
  const centreIcon = L.divIcon({
    className: "place-map-marker-wrap",
    html: '<span class="place-map-marker place-map-marker-center"><span></span></span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  return (
    <MapContainer
      key={`${center.lat}-${center.lon}`}
      center={[center.lat, center.lon]}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full min-h-[420px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[center.lat, center.lon]} icon={centreIcon}>
        <Popup><strong>{placeName}</strong><br />Explorer centre point</Popup>
      </Marker>
      {points.slice(0, 45).map((point) => {
        const color = pointColors[point.type];
        const icon = L.divIcon({
          className: "place-map-marker-wrap",
          html: `<span class="place-map-marker" style="--marker-color:${color}"><span></span></span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        return (
          <Marker
            key={point.id}
            position={[point.coordinates.lat, point.coordinates.lon]}
            icon={icon}
          >
            <Popup><strong>{point.name}</strong><br /><span className="capitalize">{point.type}</span></Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
