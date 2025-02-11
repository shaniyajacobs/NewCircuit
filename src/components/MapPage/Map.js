import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const Map = ({ cities, filter }) => {
  const filteredCities = filter
    ? cities.filter((city) =>
        city.name.toLowerCase().includes(filter.toLowerCase())
      )
    : cities;

  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={2}
      minZoom={4}
      maxZoom={18}
      scrollWheelZoom={false}
      style={{ height: "calc(100vh - 115px)", width: "100%" }}
      maxBounds={[[20.396308, -125.0], [49.384358, -66.93457]]}
      maxBoundsViscosity={0.5}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
    
      {filteredCities.map((city, index) => ( //need to add nav here
        <Marker key={index} position={city.position} icon={customIcon}>
          <Popup>{city.name}</Popup> 
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
