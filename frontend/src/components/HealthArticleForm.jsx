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

function AddHealthArticleForm() {
  const [heading, setHeading] = useState(""); // State ko 'heading' kiya
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

    if (!file || !heading) {
      setError("Article Heading aur Image dono zaroori hain.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("heading", heading); // 'heading' bhejein
    formData.append("articleImage", file); // 'articleImage' bhejein

    try {
      const res = await fetch(
        "https://bioburglifescience-1.onrender.com/api/health-articles/add", // API URL update kiya
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage("Health Article safaltapoorvak add ho gaya!");
        setHeading(""); // State reset
        setFile(null);
        setFileName("No image selected");
        e.target.querySelector('input[type="file"]').value = null;
      } else {
        setError(data.message || "Failed to add article.");
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
        Add New Health Article
      </Typography>
      <Grid container spacing={3}>
        {/* Article Heading */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Article Heading" // Label update
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            variant="outlined"
            fullWidth
            required
          />
        </Grid>

        {/* Upload Image */}
        <Grid item xs={12} sm={6}>
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
              Add Article
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

export default AddHealthArticleForm;