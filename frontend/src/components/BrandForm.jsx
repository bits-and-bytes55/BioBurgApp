import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import { AddAPhotoOutlined as UploadIcon } from "@mui/icons-material";

// Ye component aapke 'Featured Brands' section mein dikhega
function AddFeaturedBrandForm() {
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No image selected");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!file || !productName) {
      setError("Please fill product name and select an image.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("brandImage", file); // Backend field name

    try {
      // API URL ko update karein
      const res = await fetch("https://bioburglifescience-1.onrender.com/api/brands/add", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("New Featured Brand Added Successfully!");
        // Form reset karein
        setProductName("");
        setFile(null);
        setFileName("No image selected");
        if (e.target.querySelector('input[type="file"]')) {
          e.target.querySelector('input[type="file"]').value = null;
        }
      } else {
        setError(data.message || "Failed to add featured brand.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" className="font-semibold mb-4">
        Add New Featured Brand
      </Typography>
      <Grid container spacing={3}>
        {/* Product Name */}
        <Grid item xs={12}>
          <TextField
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            variant="outlined"
            fullWidth
            required
          />
        </Grid>

        {/* Upload Image */}
        <Grid item xs={12}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<UploadIcon />}
            sx={{ height: "56px" }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
          <Typography variant="caption" display="block" mt={1}>
            {fileName}
          </Typography>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ position: "relative" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              Add Featured Brand
            </Button>
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
            )}
          </Box>
        </Grid>

        {/* Messages (Success/Error) */}
        <Grid item xs={12}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Grid>
      </Grid>
    </Box>
  );
}

export default AddFeaturedBrandForm;