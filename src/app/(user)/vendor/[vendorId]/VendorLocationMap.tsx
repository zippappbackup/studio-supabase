
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Define custom icons
const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [23, 37], // 10% smaller than [25, 41]
    iconAnchor: [12, 37], // Adjusted anchor
    popupAnchor: [1, -31], // Adjusted popup anchor
    shadowSize: [37, 37] // Adjusted shadow size
});


interface VendorLocationMapProps {
  vendorLoc: [number, number];
  vendorName: string;
}

export default function VendorLocationMap({ vendorLoc, vendorName }: VendorLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Initialize map only if the ref is available and map isn't already initialized
    if (mapRef.current && !mapInstance.current) {
        const map = L.map(mapRef.current, { 
            attributionControl: false,
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
        }).setView(vendorLoc, 17);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        L.control.attribution({
          position: 'bottomright',
          prefix: ''
        }).addTo(map);

        L.marker(vendorLoc, { icon: redIcon }).addTo(map)
            .bindPopup(`<b>${vendorName}</b>`);

        mapInstance.current = map;
        
        // Use ResizeObserver to invalidate map size when container changes
        const resizeObserver = new ResizeObserver(() => {
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
            }
        });
        
        resizeObserver.observe(mapRef.current);
        resizeObserverRef.current = resizeObserver;
    }

    // Cleanup function: This is crucial to prevent the error.
    return () => {
        // Disconnect the observer
        if (resizeObserverRef.current && mapRef.current) {
            resizeObserverRef.current.unobserve(mapRef.current);
        }
        // Properly destroy the map instance
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, [vendorLoc, vendorName]); 

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>;
}
