import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AddressPage() {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // axios.get("https://bioburglifescience-1.onrender.com/api/user/addresses", {
    axios.get("https://https://bioburglifescience-1.onrender.com/api/user/addresses", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setAddresses(res.data.addresses))
    .catch(err => console.log(err));
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="font-bold text-xl mb-4">Saved Addresses</h2>

      {addresses.map((a, i) => (
        <div key={i} className="border p-4 rounded mb-3">
          <p>{a.fullName}</p>
          <p>{a.phone}</p>
          <p>{a.house}, {a.city}</p>
          <p>{a.state}, {a.pincode}</p>
        </div>
      ))}
    </div>
  );
}
