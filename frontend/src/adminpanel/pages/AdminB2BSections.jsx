import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../../utils/api";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function AdminB2BSections() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    redirectUrl: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  /* ================= FETCH LIST ================= */
  const fetchList = async () => {
    try {
      const res = await api.get(`/api/b2b/admin/all`);
      setList(res.data.data);
    } catch {
      toast.error("Failed to load B2B sections");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async () => {
    if (!form.title || !form.slug || !form.redirectUrl) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      let imagePayload = null;

      // ✅ SAME AS CATEGORY
      if (image) {
        const uploadRes = await uploadToCloudinary(image);
        imagePayload = {
          url: uploadRes.secure_url,
          public_id: uploadRes.public_id,
        };
      }

      const payload = {
        title: form.title,
        slug: form.slug,
        redirectUrl: form.redirectUrl,
        ...(imagePayload && { image: imagePayload }),
      };

      if (editId) {
        await api.put(`/api/b2b/update/${editId}`, payload);
        toast.success("B2B section updated");
      } else {
        await api.post(`/api/b2b/create`, payload);
        toast.success("B2B section created");
      }

      resetForm();
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title,
      slug: item.slug,
      redirectUrl: item.redirectUrl,
    });
    setImage(null);
    setPreview(item.image); // cloudinary url
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this B2B section?")) return;

    try {
      await api.delete(`/api/b2b/delete/${id}`);
      toast.success("B2B section deleted");
      fetchList();
    } catch {
      toast.error("Failed to delete section");
    }
  };

  /* ================= ACTIVE TOGGLE ================= */
  const toggleStatus = async (id, status) => {
    try {
      await api.put(`/api/b2b/update/${id}`, {
        isActive: status,
      });
      fetchList();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setForm({ title: "", slug: "", redirectUrl: "" });
    setImage(null);
    setPreview(null);
    setEditId(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        B2B Sections Manager
      </Typography>

      {/* ================= FORM ================= */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={2}>
          {editId ? "Edit B2B Section" : "Add New B2B Section"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Slug"
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value })
              }
              disabled={!!editId}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Redirect URL"
              value={form.redirectUrl}
              onChange={(e) =>
                setForm({ ...form, redirectUrl: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
              {editId ? "Change Image" : "Upload Image"}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setImage(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </Button>

            {preview && (
              <Box mt={2}>
                <Typography variant="caption">Image Preview</Typography>
                <Box
                  component="img"
                  src={preview}
                  sx={{
                    mt: 1,
                    width: 140,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? <CircularProgress size={22} /> : editId ? "Update" : "Create"}
            </Button>

            {editId && (
              <Button sx={{ ml: 2 }} onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ================= LIST ================= */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Existing B2B Sections
        </Typography>

        {list.map((item) => (
          <Box
            key={item._id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              borderBottom: "1px solid #eee",
              pb: 1,
            }}
          >
            <img
              src={item.image}
              alt={item.title}
              width={60}
              height={40}
              style={{ objectFit: "cover", borderRadius: 4 }}
            />

            <Box flex={1}>
              <Typography fontWeight="bold">{item.title}</Typography>
              <Typography variant="caption">
                {item.redirectUrl}
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={item.isActive}
                  onChange={(e) =>
                    toggleStatus(item._id, e.target.checked)
                  }
                />
              }
              label={item.isActive ? "Active" : "Inactive"}
            />

            <IconButton onClick={() => handleEdit(item)}>
              <EditIcon />
            </IconButton>

            <IconButton color="error" onClick={() => handleDelete(item._id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
