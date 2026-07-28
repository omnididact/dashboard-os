"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { CommutePayload } from "@/app/api/commute/route";
import "leaflet/dist/leaflet.css";

function FitBounds({ data }: { data: CommutePayload }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[data.home.lat, data.home.lon]];
    for (const r of data.routes) {
      points.push(...r.geometry);
    }
    if (points.length < 2) {
      map.setView([data.home.lat, data.home.lon], 11);
      return;
    }
    const lats = points.map((p) => p[0]);
    const lons = points.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ],
      { padding: [24, 24] }
    );
  }, [data, map]);
  return null;
}

const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export function CommuteMap({ data }: { data: CommutePayload }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      setLight(
        root.classList.contains("light") || !root.classList.contains("dark")
      );
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <MapContainer
      center={[data.home.lat, data.home.lon]}
      zoom={11}
      className="h-full w-full rounded-xl [&_.leaflet-control-attribution]:hidden"
      zoomControl
      attributionControl={false}
      dragging
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom
    >
      <TileLayer url={light ? LIGHT_TILES : DARK_TILES} />
      <FitBounds data={data} />
      <CircleMarker
        center={[data.home.lat, data.home.lon]}
        radius={7}
        pathOptions={{
          color: light ? "#0f172a" : "#fff",
          fillColor: "#22d3ee",
          fillOpacity: 1,
          weight: 2,
        }}
      >
        <Popup>{data.home.label}</Popup>
      </CircleMarker>
      {data.routes.map((route) =>
        route.geometry.length > 1 ? (
          <Polyline
            key={`line-${route.id}`}
            positions={route.geometry}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.85,
            }}
          />
        ) : null
      )}
      {data.routes.map((route) =>
        route.geometry.length > 0 ? (
          <CircleMarker
            key={`end-${route.id}`}
            center={route.geometry[route.geometry.length - 1]}
            radius={6}
            pathOptions={{
              color: light ? "#fff" : "#0b1017",
              fillColor: route.color,
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              {route.name} → {route.destLabel}
            </Popup>
          </CircleMarker>
        ) : null
      )}
    </MapContainer>
  );
}
