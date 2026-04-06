import axios from "axios";

const apiJson = axios.create({
  baseURL: "https://bioburglifescience-1.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiJson;
