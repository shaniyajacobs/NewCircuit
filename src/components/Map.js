import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const cities = [
  { name: 'Atlanta', position: [33.7490, -84.3880], link: 'https://example.com/atlanta' },
  { name: 'Chicago', position: [41.8781, -87.6298], link: 'https://example.com/chicago' },
  { name: 'Dallas', position: [32.7767, -96.7970], link: 'https://example.com/dallas' },
  { name: 'Houston', position: [29.7604, -95.3698], link: 'https://example.com/houston' },
  { name: 'Los Angeles', position: [34.0522, -118.2437], link: 'https://example.com/losangeles' }
];

const Map = () => {
  return (
    <MapContainer center={[37.0902, -95.7129]} zoom={1} style={{ width: '100%', height: '500px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      {cities.map((city, index) => (
        <Marker key={index} position={city.position} icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })}>
          <Popup>
            <a href={city.link} target="_blank" rel="noopener noreferrer">{city.name}</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
