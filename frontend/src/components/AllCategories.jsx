import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  CircularProgress,
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Card,
  Grid,
  Chip,
  Alert,
  Tooltip,
  Container,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Delete,
  Edit,
  Category,
  Image as ImageIcon,
  Percent,
  AddPhotoAlternate,
  Refresh,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";

import api from "../../utils/api";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";

export default function AllCategories() {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    _id: "",
    title: "",
    offer: "",
    imageFile: null,
    imageUrl: "",
  });

  /* ---------------------------------
     FETCH CATEGORIES
  --------------------------------- */
  const fetchCategories = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get("/api/categories/all");
      setCategories(res.data);
    } catch (err) {
      setError("Failed to load categories. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ---------------------------------
     DELETE CATEGORY
  --------------------------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/api/categories/delete/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete category");
    }
  };

  /* ---------------------------------
     OPEN EDIT
  --------------------------------- */
  const handleEditOpen = (cat) => {
    setEditData({
      _id: cat._id,
      title: cat.title,
      offer: cat.offer,
      imageFile: null,
      imageUrl: cat.image?.url || "",
    });
    setEditOpen(true);
  };

  /* ---------------------------------
     SAVE EDIT
  --------------------------------- */
  const handleEditSave = async () => {
    try {
      let imagePayload = null;

      if (editData.imageFile) {
        const uploadRes = await uploadToCloudinary(editData.imageFile);
        imagePayload = {
          url: uploadRes.secure_url,
          public_id: uploadRes.public_id,
        };
      }

      const res = await api.put(`/api/categories/edit/${editData._id}`, {
        title: editData.title,
        offer: editData.offer,
        image: imagePayload,
      });

      setCategories((prev) =>
        prev.map((c) => (c._id === editData._id ? res.data.category : c))
      );

      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert("Update failed. Please check your network and try again.");
    }
  };

  /* ---------------------------------
     LOADING STATE
  --------------------------------- */
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="60vh"
        >
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Categories...
          </Typography>
        </Box>
      </Container>
    );
  }

  /* ---------------------------------
     ERROR STATE
  --------------------------------- */
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchCategories}>
              <Refresh sx={{ mr: 1 }} /> Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  /* ---------------------------------
     MAIN UI
  --------------------------------- */
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Card */}
      <Card 
        sx={{ 
          mb: 4, 
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
          color: 'white',
          borderRadius: 2,
          boxShadow: theme.shadows[4],
        }}
      >
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box display="flex" alignItems="center" gap={2}>
              <Category sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Category Management
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage and organize your product categories
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <Chip 
              label={`${categories.length} Categories`}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 1,
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Categories Table */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[2] }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            All Categories
          </Typography>
        </Box>

        {categories.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Category sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No categories found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start by adding your first category
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>IMAGE</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>CATEGORY NAME</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>PARENT CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>OFFER</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }} align="center">ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow 
                    key={cat._id}
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.02) 
                      } 
                    }}
                  >
                    {/* IMAGE */}
                    <TableCell>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          variant="rounded"
                          src={cat.image?.url}
                          sx={{ 
                            width: 60, 
                            height: 60,
                            boxShadow: theme.shadows[1],
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          }}
                        />
                        {!cat.image?.url && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'grey.100',
                              borderRadius: 1,
                            }}
                          >
                            <ImageIcon color="disabled" />
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    {/* TITLE */}
                    <TableCell>
                      <Typography 
                        fontWeight={cat.parentCategory ? 500 : 700}
                        color={cat.parentCategory ? 'text.primary' : 'primary.main'}
                      >
                        {cat.parentCategory && (
                          <ArrowDownward sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        )}
                        {cat.title}
                      </Typography>
                    </TableCell>

                    {/* TYPE */}
                    <TableCell>
                      {cat.parentCategory ? (
                        <Chip
                          label="Sub Category"
                          size="small"
                          sx={{
                            backgroundColor: alpha(theme.palette.warning.main, 0.1),
                            color: 'warning.dark',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Chip
                          label="Main Category"
                          size="small"
                          sx={{
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            color: 'success.dark',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </TableCell>

                    {/* PARENT CATEGORY */}
                    <TableCell>
                      {cat.parentCategory ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <ArrowUpward sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography fontWeight={500}>
                            {cat.parentCategory.title}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="text.disabled" fontStyle="italic">
                          None
                        </Typography>
                      )}
                    </TableCell>

                    {/* OFFER */}
                    <TableCell>
                      {cat.offer ? (
                        <Chip
                          icon={<Percent sx={{ fontSize: 14 }} />}
                          label={`${cat.offer}% OFF`}
                          size="small"
                          sx={{
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            color: 'error.dark',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography color="text.disabled" fontStyle="italic">
                          No offer
                        </Typography>
                      )}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Edit Category">
                          <IconButton 
                            onClick={() => handleEditOpen(cat)}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { 
                                backgroundColor: alpha(theme.palette.primary.main, 0.2) 
                              }
                            }}
                          >
                            <Edit fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Category">
                          <IconButton 
                            onClick={() => handleDelete(cat._id)}
                            sx={{ 
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { 
                                backgroundColor: alpha(theme.palette.error.main, 0.2) 
                              }
                            }}
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* ------------------- EDIT DIALOG ------------------- */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Edit Category
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update category details
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Category Title"
                fullWidth
                margin="dense"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Offer Percentage"
                fullWidth
                type="number"
                margin="dense"
                value={editData.offer}
                onChange={(e) =>
                  setEditData({ ...editData, offer: e.target.value })
                }
                variant="outlined"
                InputProps={{
                  endAdornment: <Percent color="action" />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Category Image
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                {editData.imageUrl ? (
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={editData.imageUrl}
                      alt="preview"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      border: `2px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.50',
                    }}
                  >
                    <ImageIcon color="disabled" fontSize="large" />
                  </Box>
                )}
                
                <Button 
                  variant="outlined" 
                  component="label"
                  startIcon={<AddPhotoAlternate />}
                  sx={{ mt: 1 }}
                >
                  Upload New Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        imageFile: e.target.files[0],
                        imageUrl: URL.createObjectURL(e.target.files[0]),
                      })
                    }
                  />
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Recommended: 1:1 aspect ratio, minimum 400x400px
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={() => setEditOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditSave}
            sx={{ borderRadius: 1 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}