import { useState } from "react";
import axios from "axios";

const BASE_API = 'https://bioburglifescience-1.onrender.com';
// const BASE_API = 'https://bioburglifescience-1.onrender.com'

export default function AdminHomeContent() {
  const [form, setForm] = useState({
    section: "",
    title: "",
    description: "",
  });

  const submitHandler = async () => {
    await axios.post(`${BASE_API}/api/home-content/add`, form);
    alert("Content Added");
  };

  return (
    <div>
      <h2>Home Page Content</h2>

      <input
        placeholder="Section (hero/about)"
        onChange={(e) => setForm({ ...form, section: e.target.value })}
      />

      <input
        placeholder="Title"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        placeholder="Description"
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <button onClick={submitHandler}>Save</button>
    </div>
  );
}
