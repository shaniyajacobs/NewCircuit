import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { FaMapMarkerAlt } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import styles from "./SearchBar.module.css";

const SearchBar = ({ cities, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  // Filter cities based on the input 
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredResults([]);
    } else {
      const results = cities.filter((city) =>
        city.name.toLowerCase().includes(query.toLowerCase()) ||
        city.state.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(results);
    }
    onSearch(query.trim());
  };

  const handleCitySelect = (cityName) => {
    setSearchQuery(cityName);
    setFilteredResults([]); 
    onSearch(cityName);
    navigate('/create-account');
  };

  const handleCantFindCity = () => {
    alert("Redirecting to city request page..."); //need to update this
  };

  return (
    <div style={{ position: "relative", width: "292px" }} className="search-bar-container">
      <form
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          width: "292px",
          height: "46px",
          background: "var(--Mindaro_Light, #FAFFE7)",
          padding: "8px 10px",
          borderTop: searchQuery.trim() ? "none" : "0.5px solid #000000",
          border: searchQuery.trim() ? "0.5px solid #000000" : "none", 
          boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
          borderRadius: searchQuery.trim() ? "4px 4px 0px 0px" : "4px",
        }}
        className={searchQuery.trim() ? "rounded-t-[4px] sm:rounded-t-[6px] md:rounded-t-[8px]" : "rounded-[4px] sm:rounded-[6px] md:rounded-[8px]"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
      >
        <FiSearch size={20} color="#211F20" />
        <input
          type="text"
          placeholder="Search for your city"
          value={searchQuery}
          onChange={handleInputChange}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontSize: "18px",
            outline: "none",
            padding: "8px 0",
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
        />
      </form>

      {/* Dropdown always appears below input, never replaces it */}
      {searchQuery.trim() && isFocused && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "46px",
            left: "0",
            width: "292px",
            background: filteredResults.length > 0 ? "var(--Mindaro_Light, #FAFFE7)" : "transparent",
            border: filteredResults.length > 0 ? "0.5px solid #000000" : "none", 
            borderTop: "none",
            borderRadius: "0 0 8px 8px", 
            maxHeight: "250px", 
            overflow: "hidden", 
            zIndex: 1000,
            alignItems: "center"
          }}
        >
          {filteredResults.length > 0 && (
            <div
              style={{
                flex: "1", 
                overflowY: "auto", 
                width: "100%"
              }}
            >
              {[...new Set(filteredResults.map((city) => city.state))].map((state) => (
                <div
                  key={state}
                  style={{
                    width: "100%",
                    background: "var(--Mindaro_Light, #FAFFE7)",
                  }}
                >
                  <div
                    style={{
                      padding: "5px 16px",
                      fontWeight: "bold",
                      background: "var(--Mindaro_Light, #FAFFE7)",
                      fontFamily: '"Bricolage Grotesque", sans-serif',
                      fontSize: "16px"
                    }}
                  >
                    {state}
                  </div>

                  {filteredResults
                    .filter((city) => city.state === state)
                    .map((city) => (
                      <div
                        key={city.name}
                        onClick={() => handleCitySelect(city.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px", 
                          padding: "8px 16px",
                          cursor: "pointer",
                          fontFamily: '"Bricolage Grotesque", sans-serif',
                          fontSize: "14px"
                        }}
                      >
                        <FaMapMarkerAlt size={14} color="#211F20" /> 
                        {city.name}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleCantFindCity}
            className={styles.cantFindCityButton}
          >
            <span className={styles.cantFindCityText}>I can't find my city</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
