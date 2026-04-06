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

function AddTestimonialForm() {
  const [review, setReview] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!review || !author) {
      setError("Review and Author are both required.");
      setLoading(false);
      return;
    }

    const formData = {
      review,
      author,
    };

    try {
      const res = await fetch("https://bioburglifescience-1.onrender.com/api/testimonials/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Testimonial added successfully!");
        setReview("");
        setAuthor("");
      } else {
        setError(data.message || "Failed to add testimonial.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        Add New Testimonial
      </Typography>
      <Grid container spacing={3}>
        {/* Review (Text Area) */}
        <Grid item xs={12}>
          <TextField
            label="Review / Testimonial Text"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            variant="outlined"
            fullWidth
            required
            multiline
            rows={4}
          />
        </Grid>

        {/* Author Name */}
        <Grid item xs={12}>
          <TextField
            label="Author Name (e.g., 'Rohan S. - Delhi')"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            variant="outlined"
            fullWidth
            required
          />
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
              Add Testimonial
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

export default AddTestimonialForm;