import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import { AddAPhotoOutlined as UploadIcon } from "@mui/icons-material";

// Form update kar diya hai (Sirf image upload)
function AddAdBannerForm() {
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

    if (!file) {
      setError("Please select an image.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("bannerImage", file); // 'bannerImage' backend se match hona chahiye

    try {
      const res = await fetch("https://bioburglifescience-1.onrender.com/api/banners/add", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Ad Banner safaltapoorvak add ho gaya!");
        setFile(null);
        setFileName("No image selected");
        e.target.querySelector('input[type="file"]').value = null;
      } else {
        setError(data.message || "Failed to add banner.");
      }
    } catch (err) {
      setError("Server se connect nahi ho pa raha hai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        Add New Ad Banner
      </Typography>
      <Grid container spacing={3}>
        {/* Upload Image */}
        <Grid item xs={12}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<UploadIcon />}
            sx={{ height: "56px" }}
          >
            Upload Banner Image
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
              Add Banner
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

        {/* Messages */}
        <Grid item xs={12}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Grid>
      </Grid>
    </Box>
  );
}

export default AddAdBannerForm;