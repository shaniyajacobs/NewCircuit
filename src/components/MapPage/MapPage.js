import React, { useState } from "react";
import SearchBar from "./SearchBar";
import Map from "./Map";

const cities = [
  { name: "Atlanta", state: "Georgia", position: [33.749, -84.388] },
  { name: "Chicago", state: "Illinois", position: [41.8781, -87.6298] },
  { name: "Dallas", state: "Texas", position: [32.7767, -96.797] },
  { name: "Houston", state: "Texas", position: [29.7604, -95.3698] },
  { name: "Los Angeles", state: "California", position: [34.0522, -118.2437] },
  { name: "Miami", state: "Florida", position: [25.7617, -80.1918] },
  { name: "New York City", state: "New York", position: [40.7128, -74.006] },
  {
    name: "San Francisco",
    state: "California",
    position: [37.7749, -122.4194],
  },
  { name: "Seattle", state: "Washington", position: [47.6062, -122.3321] },
  {
    name: "Washington D.C.",
    state: "District of Columbia",
    position: [38.9072, -77.0369],
  },
];

const MapPage = () => {
  const [filter, setFilter] = useState("");

  const handleSearch = (query) => {
    setFilter(query);
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "90px", // Reduced height
          backgroundColor: "#85A2F2",
        }}
      >
        <h1
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: "700",
            fontStyle: "normal",
            fontSize: "36px", // Reduced font size
            lineHeight: "40px", // Adjusted line height
            letterSpacing: "-1.5px", // Reduced letter spacing
            color: "#ECECEC",
          }}
        >
          Click on Location to Get Started
        </h1>
      </div>

      <Map cities={cities} filter={filter} />

      <div
        style={{
          position: "absolute",
          top: "90px", // Adjusted position to match the new header height
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
        }}
      >
        <SearchBar cities={cities} onSearch={handleSearch} />
      </div>
    </div>
  );
};

export default MapPage;
