// components/OtherSelect.jsx
import { useState, useEffect } from "react";
import { TextField, MenuItem, Grid } from "@mui/material";

const SENTINEL = "__other__";

export default function OtherSelect({ label, value, onChange, options, size = "small", required, xs = 12, sm }) {
  const isKnown  = options.includes(value);
  const [selectVal, setSelectVal] = useState(value === "" ? "" : isKnown ? value : SENTINEL);
  const [custom, setCustom] = useState(isKnown ? "" : value);

  // Keep custom in sync if parent resets value
  useEffect(() => {
    if (options.includes(value)) setCustom("");
    else if (value) setCustom(value);
  }, [value]);

  const handleSelect = e => {
  setSelectVal(e.target.value);
  if (e.target.value === SENTINEL) {
    // don't call onChange yet, wait for user to type
  } else {
    setCustom("");
    onChange(e.target.value);
  }
};

  const handleCustom = e => {
    setCustom(e.target.value);
    onChange(e.target.value);
  };

  const showCustom = selectVal === SENTINEL;

  return (
    <>
      <TextField
        fullWidth select size={size} label={label} required={required}
        value={selectVal}
        onChange={handleSelect}
      >
        <MenuItem value="" disabled>Select {label}…</MenuItem>
        {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        <MenuItem value={SENTINEL}>Other (specify below)</MenuItem>
      </TextField>

      {showCustom && (
        <TextField
          fullWidth size={size}
          label={`Enter ${label}`}
          value={custom}
          onChange={handleCustom}
          placeholder={`Type custom ${label.toLowerCase()}…`}
          sx={{ mt: 1 }}
          autoFocus
        />
      )}
    </>
  );
}