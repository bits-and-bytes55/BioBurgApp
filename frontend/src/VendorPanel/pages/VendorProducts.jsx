// src/VendorPanel/pages/VendorProducts.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Tabs, Tab, Paper, Table, TableHead, TableRow,
  TableCell, TableBody, Avatar, CircularProgress, Chip, IconButton,
  TableContainer, TablePagination, TextField, Button, Stack, Tooltip,
  Alert, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StoreIcon from "@mui/icons-material/Store";
import axios from "axios";

import AddProductForm from "../../components/AddProductForm";
import EditProductForm from "../../components/EditProductForm";

const API_BASE = import.meta.env.VITE_API_BASE_URL;


const vendorApi = axios.create({ baseURL: API_BASE });
vendorApi.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem("vendorToken") ||
    localStorage.getItem("token");
  if (token) cfg.headers.Authorization = "Bearer " + token;
  return cfg;
});

// Admin API for delete — uses ONLY adminToken
const adminApi = axios.create({ baseURL: API_BASE });
adminApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("adminToken");
  if (token) cfg.headers.Authorization = "Bearer " + token;
  return cfg;
});

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null;
}

function AllProductsView({ onEdit, refreshKey }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [tagMsg, setTagMsg] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.get("/api/vendor/products");
      const list = res.data?.data || res.data?.products || [];
      setProducts(list);
    } catch (err) {
      console.error("[VendorProducts]", err.response?.status, err.message);
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log out and log in again as vendor.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Make sure you are logged in as a vendor (not admin).");
      } else {
        setError("Failed to load products. Make sure backend is running on port 8000.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshKey]);

  const handleTagProducts = async (productIds) => {
    setTagLoading(true);
    setTagMsg("");
    try {
      const res = await vendorApi.post("/api/vendor/products/tag", { productIds });
      setTagMsg(res.data.message || "Products tagged successfully!");
      fetchProducts();
    } catch (err) {
      setTagMsg("Failed: " + (err.response?.data?.message || err.message));
    } finally {
      setTagLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this product and all its images/video permanently?")) return;
    try {
      await vendorApi.delete("/api/vendor/products/" + id);
      fetchProducts();
    } catch {
      alert("Failed to delete product.");
    }
  };

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      (p.brandName || "").toLowerCase().includes(s) ||
      (p.manufacturer || "").toLowerCase().includes(s) ||
      (p.genericCompositions || "").toLowerCase().includes(s);
    const matchStatus =
      !filterStatus || (p.statusActive || p.currentStatus1) === filterStatus;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {tagMsg && (
        <Alert
          severity={tagMsg.startsWith("Failed") ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setTagMsg("")}
        >
          {tagMsg}
        </Alert>
      )}

      {!loading && products.length === 0 && !error && (
        <Alert
          severity="info"
          icon={<StoreIcon />}
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              variant="outlined"
              color="info"
              disabled={tagLoading}
              onClick={() => {
                const ids = window.prompt(
                  "Enter product IDs to claim (comma-separated):\n\nExample: 507f1f77bcf86cd799439011"
                );
                if (!ids?.trim()) return;
                const productIds = ids.split(",").map((s) => s.trim()).filter(Boolean);
                handleTagProducts(productIds);
              }}
            >
              {tagLoading ? "Claiming..." : "Claim Existing Products"}
            </Button>
          }
        >
          <strong>No products linked to your account yet.</strong> Products you
          add via "Add Product" are automatically linked to your account.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#f8fafc" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            label="Search name, manufacturer, generic..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} size="small"
              onClick={fetchProducts}>Refresh</Button>
            <Button variant="outlined" size="small"
              onClick={() => { setSearch(""); setFilterStatus(""); setPage(0); }}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        {loading
          ? "Loading your products..."
          : products.length + " product" + (products.length !== 1 ? "s" : "") + " in your account"
            + (filtered.length !== products.length ? " · " + filtered.length + " shown" : "")}
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              {["Image", "Product Name", "MRP", "Stock", "Category", "Status", "Type", "Actions"].map(
                (h) => <TableCell key={h}><b>{h}</b></TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading your products...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary" fontWeight={600} gutterBottom>
                    {products.length === 0
                      ? "No products linked to your account"
                      : "No products match your filters"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use the "Add Product" tab to add a new product
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paged.map((p) => (
              <TableRow key={p._id} hover sx={{ borderLeft: "3px solid #1565c0" }}>
                <TableCell>
                  <Avatar variant="rounded" src={p.images?.[0]?.url}
                    sx={{ width: 44, height: 44 }} />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{p.brandName || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.manufacturer || ""}</Typography>
                    </Box>
                    <Chip
                      label="MY PRODUCT"
                      size="small"
                      icon={<StoreIcon sx={{ fontSize: "11px !important" }} />}
                      sx={{
                        bgcolor: "#1565c0", color: "white", fontWeight: 700,
                        fontSize: 9, height: 18,
                        "& .MuiChip-icon": { color: "white" },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell><Typography fontWeight={600}>₹{p.mrp || "0"}</Typography></TableCell>
                <TableCell>
                  <Chip
                    label={p.totalStocks ?? p.stocks ?? "0"}
                    size="small"
                    color={(p.totalStocks ?? p.stocks ?? 0) > 10 ? "success" :
                           (p.totalStocks ?? p.stocks ?? 0) > 0 ? "warning" : "error"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{p.category?.title || "—"}</Typography>
                </TableCell>
                <TableCell>
                  {(p.statusActive || p.currentStatus1) === "active"
                    ? <Chip label="Active" color="success" size="small" />
                    : <Chip label="Inactive" size="small" />}
                </TableCell>
                <TableCell>
                  {p.isOTC
                    ? <Chip label="OTC" color="success" size="small" variant="outlined" />
                    : <Chip label="Rx" color="error" size="small" variant="outlined" />}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary"
                        onClick={(e) => { e.stopPropagation(); onEdit(p._id, p.brandName); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on Site">
                      <IconButton size="small" color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open("http://localhost:5173/product-details/" + p._id, "_blank");
                        }}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error"
                        onClick={(e) => handleDelete(e, p._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />
    </Box>
  );
}

export default function VendorProducts() {
  const [tab, setTab] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");

  const vendorToken =
    localStorage.getItem("vendorToken") ||
    localStorage.getItem("token");

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f4f8" }}>
      <Paper elevation={0} sx={{
        borderRadius: 0, borderBottom: "2px solid #e5e7eb",
        bgcolor: "white", px: 3, py: 2,
      }}>
        <Typography variant="h5" fontWeight={800} color="#111827">Product Management</Typography>
        <Typography variant="body2" color="text.secondary">
          Add new products, edit existing ones, or view your catalog
        </Typography>
      </Paper>

      {successMsg && (
        <Alert severity="success" sx={{ mx: 3, mt: 2 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}

      <Box sx={{ bgcolor: "white", borderBottom: "1px solid #e5e7eb", px: 3 }}>
        <Tabs
          value={tab >= 2 ? 1 : tab}
          onChange={(_, v) => { setEditingId(null); setTab(v); }}
          sx={{
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", minHeight: 52 },
            "& .Mui-selected": { color: "#1565c0" },
            "& .MuiTabs-indicator": { bgcolor: "#1565c0", height: 3 },
          }}
        >
          <Tab icon={<AddCircleIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Add Product" />
          <Tab
            icon={<ListAltIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={editingId ? "My Products — Editing: " + editingName : "My Products"}
          />
        </Tabs>
      </Box>

      <Box sx={{ px: { xs: 1, md: 3 }, py: 2 }}>
        <TabPanel value={tab} index={0}>
          <AddProductForm
            token={vendorToken}
            editProductId={null}
            onSuccess={() => {
              showSuccess("Product added and linked to your account!");
              setRefreshKey((k) => k + 1);
              setTab(1);
            }}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <AllProductsView
            onEdit={(id, name) => { setEditingId(id); setEditingName(name || id.slice(-6)); setTab(2); }}
            refreshKey={refreshKey}
          />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          {editingId && (
            <Box>
              <Paper variant="outlined" sx={{
                mb: 2, px: 2, py: 1.5, borderRadius: 2,
                display: "flex", alignItems: "center", gap: 2,
                bgcolor: "#fffbeb", borderColor: "#fde68a",
              }}>
                <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />}
                  onClick={() => { setEditingId(null); setTab(1); }} color="warning">
                  Back to My Products
                </Button>
                <Typography variant="body2" fontWeight={600} color="#92400e">
                  Editing: <strong>{editingName}</strong>
                </Typography>
              </Paper>
              <EditProductForm
                productId={editingId}
                token={vendorToken}
                fetchEndpoint={`/api/vendor/products/${editingId}`}
                updateEndpoint={`/api/vendor/products/${editingId}`}
                onBack={() => { setEditingId(null); setTab(1); }}
                onSuccess={() => {
                  showSuccess("Product updated successfully!");
                  setRefreshKey((k) => k + 1);
                  setEditingId(null);
                  setTab(1);
                }}
              />
            </Box>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
}