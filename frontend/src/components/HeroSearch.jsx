import React, { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (onSearch) onSearch(query);
    console.log("Searching for:", query);
  };

  return (
    <div style={styles.wrapper}>
      <input
        type="text"
        placeholder="Search for Brand Medicine, Injections, Health Products and More…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.input}
      />
      <button onClick={handleSearch} style={styles.button}>
        Search
      </button>
    </div>
  );
};

const styles = {
  wrapper: {
    // backgroundColor: "#1E73D1", // SAME BLUE as your navbar
    width: "100%",
    padding: "14px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  },
  input: {
    width: "55%",
    padding: "12px",
    borderRadius: "30px",
    border: "1px solid #ccc",
    outline: "none",
    fontSize: "15px",
    backgroundColor: "#fff", // white search box
    color: "#000",
  },
  button: {
    padding: "12px 22px",
    backgroundColor: "#1E73D1",
    color: "#fff",
    fontWeight: "600",
    border: "1px solid #1E73D1",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default SearchBar;
