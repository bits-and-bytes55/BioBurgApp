import React, { useState, useEffect } from "react"; // 🟡 useEffect add karein
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider, // 🆕 Naye imports
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
} from "@mui/material";
import { 
  AddAPhotoOutlined as UploadIcon,
  Delete as DeleteIcon // 🆕 Delete icon
} from "@mui/icons-material";

//  API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Component ka naam update kiya
function LaunchManager() {
  // Form state
  const [productName, setProductName] = useState("");
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No image selected");

  // Form status state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 🆕 List state
  const [launches, setLaunches] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  // 🆕 Function: Sabhi launches ko fetch karne ke liye
  const fetchLaunches = async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/launches/`); // GET route '/' hai
      const data = await res.json();
      if (res.ok) {
        setLaunches(data);
      } else {
        setListError(data.message || "Failed to fetch launches.");
      }
    } catch (err) {
      setListError("Unable to connect to the server.");
    } finally {
      setListLoading(false);
    }
  };

  // 🆕 Component load hote hi launches fetch karein
  useEffect(() => {
    fetchLaunches();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // 🟡 handleSubmit ko modify kiya gaya
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!file || !productName || !mrp || !price) {
      setError("Please fill all fields and select an image.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("mrp", mrp);
    formData.append("price", price);
    formData.append("launchImage", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/launches/add`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("New Launch Added Successfully!");
        setProductName("");
        setMrp("");
        setPrice("");
        setFile(null);
        setFileName("No image selected");
        if (e.target.querySelector('input[type="file"]')) {
          e.target.querySelector('input[type="file"]').value = null;
        }
        
        // 🟡 Naya launch list mein add karein
        setLaunches(prevLaunches => [data.launch, ...prevLaunches]);
    
      } else {
        setError(data.message || "Failed to add new launch.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NAYA DELETE HANDLER
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this launch product?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/launches/delete/${id}`, {
        method: "DELETE",
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = { message: responseText || "Failed to parse server response" };
      }

      if (res.ok) {
        setMessage(data.message || "Launch deleted successfully!");
        // 🟡 List se launch hatayein
        setLaunches(prevLaunches => prevLaunches.filter(item => item._id !== id));
      } else {
        setError(`Error ${res.status}: ${data.message || "Failed to delete launch."}`);
      }
    } catch (networkError) {
      setError("Unable to connect to the server. Check your network.");
    }
  };

  return (
    <>
      {/* --- FORM SECTION --- */}
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mb: 4 }}>
        <Typography variant="h6" className="font-semibold mb-4">
          Add New Launch Product
        </Typography>
        <Grid container spacing={3}>
          {/* Product Name */}
          <Grid item xs={12}>
            <TextField label="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} variant="outlined" fullWidth required />
          </Grid>
          {/* MRP */}
          <Grid item xs={12} sm={6}>
            <TextField label="MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} variant="outlined" fullWidth required />
          </Grid>
          {/* Selling Price */}
          <Grid item xs={12} sm={6}>
            <TextField label="Selling Price (₹)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} variant="outlined" fullWidth required />
          </Grid>
          {/* Upload Image */}
          <Grid item xs={12}>
            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />} sx={{ height: "56px" }}>
              Upload Image
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </Button>
            <Typography variant="caption" display="block" mt={1}>{fileName}</Typography>
          </Grid>
          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ position: "relative" }}>
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ py: 1.5 }}>
                Add Launch
              </Button>
              {loading && (
                <CircularProgress size={24} sx={{ position: "absolute", top: "50%", left: "50%", marginTop: "-12px", marginLeft: "-12px" }} />
              )}
            </Box>
          </Grid>
          {/* Messages */}
          <Grid item xs={12}>
            {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* 🆕 NAYA SECTION: LAUNCHES KO MANAGE KARNE KE LIYE */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" className="font-semibold mb-4">
          Manage Existing Launches
        </Typography>

        {listLoading && <CircularProgress />}
        {listError && <Alert severity="error">{listError}</Alert>}

        <Grid container spacing={3}>
          {launches.map((launch) => (
            <Grid item xs={12} sm={6} md={4} key={launch._id}>
              <Card>
                <CardMedia
                  component="img"
                _ height="200"
                  image={`${API_BASE_URL}${launch.imageUrl}`}
                  alt={launch.productName}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {launch.productName}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                    ₹{launch.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    MRP: <del>₹{launch.mrp}</del>
                  </Typography>
                </CardContent>
          _     <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton color="error" onClick={() => handleDelete(launch._id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
className="font-semibold mb-4"    </Box>
    </>
  );
}

export default LaunchManager;