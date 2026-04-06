import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("https://bioburglifescience-1.onrender.com/api/user/prescriptions", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setPrescriptions(res.data.prescriptions))
    .catch(err => console.log(err));
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="font-bold text-xl mb-4">My Prescriptions</h2>

      {prescriptions.map((p, i) => (
        <div key={i} className="border p-4 rounded mb-3">
          <a href={p.url} target="_blank" className="text-blue-500 underline">
            View Prescription
          </a>
        </div>
      ))}
    </div>
  );
}
