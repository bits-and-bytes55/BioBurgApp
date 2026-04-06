import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import {
  CloudUpload,
  Image as ImageIcon,
  Category,
  Percent,
  Clear,
  CheckCircle,
  AddCircle,
  InfoOutlined,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import api from "../../utils/api";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";

// Styled Components
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const ImagePreviewCard = styled(Card)(({ theme }) => ({
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: "all 0.3s ease",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
  },
}));

const UploadZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: alpha(theme.palette.primary.light, 0.05),
  transition: "all 0.3s ease",
  minHeight: 200,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
    borderColor: theme.palette.primary.main,
  },
}));

export default function AddCategoryForm() {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [offer, setOffer] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parentCategory, setParentCategory] = useState("");
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formErrors, setFormErrors] = useState({});

  /* ================= LOAD MAIN CATEGORIES ================= */
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const res = await api.get("/api/categories/main");
        setMainCategories(res.data.categories || []);
      } catch (err) {
        showMessage("error", "Failed to load categories");
      }
    };

    fetchMainCategories();
  }, []);

  /* ================= IMAGE PREVIEW ================= */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("error", "Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image size should be less than 5MB");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    clearError("image");
  };

  /* ================= CLEAR IMAGE ================= */
  const handleClearImage = () => {
    setImage(null);
    setPreview(null);
  };

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const errors = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    }

    if (!image) {
      errors.image = "Please upload an image";
    }

    if (offer && (offer < 0 || offer > 100)) {
      errors.offer = "Offer must be between 0 and 100";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= MESSAGE HELPER ================= */
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  /* ================= CLEAR ERROR ================= */
  const clearError = (field) => {
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ================= SUBMIT FORM ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      /* 1️⃣ Upload image DIRECTLY to Cloudinary */
      const uploadRes = await uploadToCloudinary(image);

      /* 2️⃣ Send only DATA + image URL to backend */
      const res = await api.post("/api/categories/add/category", {
        title: title.trim(),
        offer: offer || 0,
        parentCategory: parentCategory || null,
        image: {
              url: uploadRes,           
              public_id: image.name
        },
      });

      if (res.data?.success) {
        showMessage("success", "✅ Category Added Successfully!");

        // Reset form
        setTitle("");
        setOffer("");
        setImage(null);
        setPreview(null);
        setParentCategory("");
        setFormErrors({});
      } else {
        showMessage("error", "Category add failed");
      }
    } catch (err) {
      console.error(err);
      showMessage("error", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in timeout={500}>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header Card */}
        <Card 
          sx={{ 
            mb: 4, 
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
            color: 'white',
            borderRadius: 3,
            boxShadow: theme.shadows[4],
          }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                }}
              >
                <AddCircle sx={{ fontSize: 32 }} />
              </Box>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold">
                Add New Category
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                {parentCategory ? "Create subcategory under existing category" : "Create a new main category"}
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Message Alert */}
        {message.text && (
          <Alert
            severity={message.type}
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: theme.shadows[1],
            }}
            onClose={() => setMessage({ type: "", text: "" })}
            icon={false}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {message.type === 'success' ? (
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              ) : (
                <InfoOutlined sx={{ mr: 1, color: 'error.main' }} />
              )}
              {message.text}
            </Box>
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: theme.palette.background.paper,
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {/* Left Column - Category Details */}
              <Grid item xs={12} md={6}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2, 
                    height: '100%',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        Category Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fill in the basic information for your category
                      </Typography>
                    </Box>

                    {/* Title Field */}
                    <TextField
                      fullWidth
                      label="Category Title *"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        clearError("title");
                      }}
                      required
                      error={!!formErrors.title}
                      helperText={formErrors.title || "Enter a unique category name"}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Category color={formErrors.title ? "error" : "action"} />
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                      disabled={loading}
                    />

                    {/* Offer Field */}
                    <TextField
                      fullWidth
                      label="Discount Offer (%)"
                      type="number"
                      value={offer}
                      onChange={(e) => {
                        setOffer(e.target.value);
                        clearError("offer");
                      }}
                      error={!!formErrors.offer}
                      helperText={formErrors.offer || "Optional - Enter value between 0 and 100"}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Percent color={formErrors.offer ? "error" : "action"} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="body2" color="text.secondary">%</Typography>
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                      inputProps={{ min: 0, max: 100, step: 0.5 }}
                      sx={{ mb: 2 }}
                      disabled={loading}
                    />

                    {/* Parent Category Selector */}
                    <TextField
                      fullWidth
                      select
                      label="Parent Category"
                      value={parentCategory}
                      onChange={(e) => setParentCategory(e.target.value)}
                      margin="normal"
                      variant="outlined"
                      helperText="Select main category or leave empty for new main category"
                      sx={{ mb: 3 }}
                      disabled={loading}
                    >
                      <MenuItem value="">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AddCircle sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography color="primary.main">
                            Create as Main Category
                          </Typography>
                        </Box>
                      </MenuItem>
                      <Divider sx={{ my: 1 }} />
                      {mainCategories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Category sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                            {cat.title}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>

                    {/* Submit Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      size="large"
                      sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        },
                      }}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <CheckCircle />
                        )
                      }
                    >
                      {loading ? "Adding Category..." : "Create Category"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column - Image Upload */}
              <Grid item xs={12} md={6}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2, 
                    height: '100%',
                    width: "100%",
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <CardContent sx={{ p: 3, height: '100%', width: "100%", display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 3, flexShrink: 0 }}>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        Category Image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload a high-quality image for your category
                      </Typography>
                    </Box>

                    {/* Image Upload Area */}
                    <Box sx={{ flex: 1 }}>
                      {!preview ? (
                        <>
                          <UploadZone 
                            onClick={() => document.getElementById('image-upload')?.click()}
                          >
                            <CloudUpload 
                              sx={{ 
                                fontSize: 10, 
                                color: alpha(theme.palette.primary.main, 0.5),
                                mb: 2 
                              }} 
                            />
                            <Typography variant="h6" color="primary.main" gutterBottom>
                              Upload Image
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Drag & drop or click to browse
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Supports: JPG, PNG, WebP • Max 5MB
                            </Typography>
                            <Button
                              component="label"
                              variant="contained"
                              size="medium"
                              sx={{ mt: 2 }}
                              startIcon={<CloudUpload />}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Browse Files
                              <VisuallyHiddenInput
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                              />
                            </Button>
                          </UploadZone>
                          {formErrors.image && (
                            <Alert 
                              severity="error" 
                              sx={{ 
                                mt: 2, 
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.error.main}`,
                              }}
                            >
                              {formErrors.image}
                            </Alert>
                          )}
                        </>
                      ) : (
                        <ImagePreviewCard>
                          <Box sx={{ position: "relative" }}>
                            <img
                              src={preview}
                              alt="preview"
                              style={{
                                width: "100%",
                                height: 250,
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                            <IconButton
                              onClick={handleClearImage}
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: "background.paper",
                                boxShadow: 2,
                                "&:hover": { 
                                  bgcolor: "background.paper",
                                  transform: 'scale(1.1)' 
                                },
                              }}
                              disabled={loading}
                            >
                              <Clear />
                            </IconButton>
                          </Box>
                          <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CheckCircle sx={{ fontSize: 16, mr: 0.5 }} />
                                  Image selected
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {image.name} • {(image.size / 1024).toFixed(1)} KB
                                </Typography>
                              </Box>
                              <Button
                                component="label"
                                size="small"
                                startIcon={<CloudUpload />}
                                disabled={loading}
                              >
                                Change
                                <VisuallyHiddenInput
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageSelect}
                                />
                              </Button>
                            </Box>
                          </Box>
                        </ImagePreviewCard>
                      )}
                    </Box>

                    {/* Image Requirements */}
                    <Box 
                      sx={{ 
                        mt: 3, 
                        p: 2, 
                        bgcolor: alpha(theme.palette.info.light, 0.1),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                        flexShrink: 0,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <InfoOutlined sx={{ fontSize: 16, mr: 1, color: 'info.main' }} />
                        Image Requirements:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          bgcolor: 'background.paper', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`
                        }}>
                          • High quality image
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          bgcolor: 'background.paper', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`
                        }}>
                          • 1:1 aspect ratio
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          bgcolor: 'background.paper', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`
                        }}>
                          • Max 5MB size
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          bgcolor: 'background.paper', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`
                        }}>
                          • PNG, JPG, WebP
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Form Status */}
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InfoOutlined sx={{ fontSize: 14, mr: 0.5 }} />
                Fields marked with * are required. All uploaded images are stored securely on Cloudinary.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}