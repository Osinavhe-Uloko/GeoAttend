import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeofenceMapPreviewProps {
  zoneLat: number;
  zoneLon: number;
  radiusMeters: number;
  userLat?: number;
  userLon?: number;
}

export const GeofenceMapPreview: React.FC<GeofenceMapPreviewProps> = ({
  zoneLat,
  zoneLon,
  radiusMeters,
  userLat,
  userLon,
}) => {
  return (
    <div className="h-full w-full min-h-[250px] sm:min-h-[300px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer center={[zoneLat, zoneLon]} zoom={16} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Circle
          center={[zoneLat, zoneLon]}
          radius={radiusMeters}
          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
        >
          <Popup>Geofence Zone ({radiusMeters}m radius)</Popup>
        </Circle>
        {userLat && userLon && (
          <Marker position={[userLat, userLon]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
