import React, { useEffect, useState } from "react";
// import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import api from "../../../utils/api";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

export default function AdminBrandLogoForm() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState(null);

  /* ================= FETCH LIST ================= */
  const fetchBrands = async () => {
    try {
      const res = await api.get(`/api/brands/admin/all`);
      setList(res.data.data);
    } catch {
      toast.error("Failed to load brands");
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    try {
      setLoading(true);

      let logoPayload = null;

      // SAME AS CATEGORY / B2B
      if (logoFile) {
        const uploadRes = await uploadToCloudinary(logoFile);
        logoPayload = {
          url: uploadRes.secure_url,
          public_id: uploadRes.public_id,
        };
      }

      const payload = {
        name,
        redirectUrl,
        ...(logoPayload && { logo: logoPayload }),
      };

      if (editId) {
        await api.put(`/api/brands/update/${editId}`, payload);
        toast.success("Brand updated successfully");
      } else {
        if (!logoPayload) {
          toast.error("Logo is required");
          setLoading(false);
          return;
        }
        await api.post(`/api/brands/create`, payload);
        toast.success("Brand added successfully");
      }

      resetForm();
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditId(item._id);
    setName(item.name);
    setRedirectUrl(item.redirectUrl || "");
    setLogoFile(null);
    setPreview(item.logo); // cloudinary URL
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this brand logo?")) return;

    try {
      await api.delete(`/api/brands/delete/${id}`);
      toast.success("Brand deleted");
      fetchBrands();
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  /* ================= TOGGLE ================= */
  const toggleStatus = async (id, status) => {
    try {
      await api.put(`/api/brands/update/${id}`, {
        isActive: status,
      });
      fetchBrands();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setRedirectUrl("");
    setLogoFile(null);
    setPreview(null);
  };

  return (
    <Box>
      {/* ================= FORM ================= */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Paper sx={{ p: 4, maxWidth: 520, width: "100%", mb: 4 }}>
          <Typography variant="h6" mb={2} textAlign="center">
            {editId ? "Edit Brand Logo" : "Add Brand Logo"}
          </Typography>

          <TextField
            fullWidth
            label="Brand Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Redirect URL"
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
            {preview ? "Change Logo" : "Upload Logo"}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setLogoFile(file);
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </Button>

          {preview && (
            <Box mt={2}>
              <Typography variant="caption">Logo Preview</Typography>
              <Box
                component="img"
                src={preview}
                sx={{
                  mt: 1,
                  width: 120,
                  height: 60,
                  objectFit: "contain",
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  backgroundColor: "#fafafa",
                }}
              />
            </Box>
          )}

          <Box mt={3} display="flex" gap={2} justifyContent="center">
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <CircularProgress size={22} />
              ) : editId ? (
                "Update Brand"
              ) : (
                "Save Brand"
              )}
            </Button>

            {editId && (
              <Button variant="outlined" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {/* ================= LIST ================= */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          All Brand Logos
        </Typography>

        {list.map((item) => (
          <Box
            key={item._id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              pb: 1,
              borderBottom: "1px solid #eee",
            }}
          >
            <img
              src={item.logo}
              width={80}
              height={40}
              style={{ objectFit: "contain" }}
              alt={item.name}
            />

            <Box flex={1}>
              <Typography fontWeight="bold">{item.name}</Typography>
              <Typography variant="caption">
                {item.redirectUrl || "-"}
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
