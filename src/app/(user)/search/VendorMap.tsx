
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Vendor, Landmark } from "@/lib/types";

// Fix for default Leaflet icon issue with Webpack / define custom icons
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


interface VendorMapProps {
  center: [number, number];
  vendors: Vendor[];
  landmark: Landmark | null;
}

export function VendorMap({ center, vendors, landmark }: VendorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const vendorMarkers = useRef<L.Marker[]>([]);
  const centerMarker = useRef<L.Marker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Effect for initializing the map and handling resizing
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
        const map = L.map(mapRef.current, { attributionControl: false }).setView(center, 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.control.attribution({
          position: 'bottomright',
          prefix: ''
        }).addTo(map);

        mapInstance.current = map;

        const resizeObserver = new ResizeObserver(() => {
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
            }
        });

        resizeObserver.observe(mapRef.current);
        resizeObserverRef.current = resizeObserver;
    }

    return () => {
        if (resizeObserverRef.current && mapRef.current) {
            resizeObserverRef.current.unobserve(mapRef.current);
        }
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Effect for updating markers and view, runs when data changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.setView(center, 14);

    if (centerMarker.current) {
      centerMarker.current.removeFrom(map);
      centerMarker.current = null;
    }
    vendorMarkers.current.forEach(marker => marker.removeFrom(map));
    vendorMarkers.current = [];
    
    if (landmark) {
        centerMarker.current = L.marker(center, { icon: blueIcon }).addTo(map);
    } else {
         centerMarker.current = L.marker(center, { icon: defaultIcon }).addTo(map);
    }

    vendors.forEach(v => {
        if (v.lat && v.lng) {
            const latLng: L.LatLngExpression = [v.lat, v.lng];
            const popupContent = `<a href="/vendor/${v.id}" style="text-decoration: none; color: #000000;"><b>${v.name}</b><br/>${v.distance?.toFixed(2)} km away</a>`;
            const marker = L.marker(latLng, { icon: redIcon }).addTo(map)
                .bindPopup(popupContent);
            vendorMarkers.current.push(marker);
        }
    });

  }, [center, vendors, landmark]);


  return <div id="map" ref={mapRef} style={{ height: "100%", width: "100%" }}></div>;
}
