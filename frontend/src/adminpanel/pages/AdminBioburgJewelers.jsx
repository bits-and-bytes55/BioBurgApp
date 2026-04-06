import React, { useEffect, useState } from "react";
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

export default function AdminBioburgJewelers() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  /* ================= FETCH LIST ================= */
  const fetchJewels = async () => {
    try {
      const res = await api.get("/api/BioburgJewelers/admin/all");
      setList(res.data.data || []);
    } catch {
      toast.error("Failed to load Bioburg Jewelers");
    }
  };

  useEffect(() => {
    fetchJewels();
  }, []);

  /* ================= CREATE / UPDATE ================= */
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Jewelry name is required");
      return;
    }

    try {
      setLoading(true);

      let logoPayload = null;

      // 🔥 upload image ONLY if selected
      if (imageFile) {
        logoPayload = await uploadToCloudinary(imageFile, {
          folder: "bioburg-jewelers",
        });
      }

      const payload = {
        name: name.trim(),
        redirectUrl: redirectUrl || "",
        ...(logoPayload && { logo: logoPayload }),
      };

      if (editId) {
        await api.put(
          `/api/BioburgJewelers/update/${editId}`,
          payload
        );
        toast.success("Bioburg Jewelers updated successfully");
      } else {
        await api.post(
          "/api/BioburgJewelers/create",
          payload
        );
        toast.success("Bioburg Jewelers added successfully");
      }

      resetForm();
      fetchJewels();
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditId(item._id);
    setName(item.name);
    setRedirectUrl(item.redirectUrl || "");
    setImageFile(null);
    setPreview(item.logo);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this jewelry?")) return;

    try {
      await api.delete(`/api/BioburgJewelers/delete/${id}`);
      toast.success("Bioburg Jewelers deleted");
      fetchJewels();
    } catch {
      toast.error("Failed to delete");
    }
  };

  /* ================= TOGGLE ================= */
  const toggleStatus = async (id, status) => {
    try {
      await api.put(`/api/BioburgJewelers/update/${id}`, {
        isActive: status,
      });
      toast.success(status ? "Activated" : "Deactivated");
      fetchJewels();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setRedirectUrl("");
    setImageFile(null);
    setPreview(null);
  };

  return (
    <Box>
      {/* ================= FORM ================= */}
      <Box display="flex" justifyContent="center">
        <Paper sx={{ p: 4, maxWidth: 520, width: "100%", mb: 4 }}>
          <Typography variant="h6" mb={2} textAlign="center">
            {editId ? "Edit Bioburg Jewelry" : "Add Bioburg Jewelry"}
          </Typography>

          <TextField
            fullWidth
            label="Jewelry Name"
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
            {preview ? "Change Image" : "Upload Image"}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setImageFile(file);
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </Button>

          {preview && (
            <Box mt={2}>
              <Typography variant="caption">Preview</Typography>
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
                }}
              />
            </Box>
          )}

          <Box mt={3} display="flex" gap={2} justifyContent="center">
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              {loading ? <CircularProgress size={22} /> : editId ? "Update" : "Save"}
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
          All Bioburg Jewelers
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
