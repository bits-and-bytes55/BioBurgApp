import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Close, DeleteOutline, Edit, Inventory2, Refresh } from "@mui/icons-material";
import AddProductForm from "../../components/AddProductForm";
import ProductQRCode from "../../components/ProductQRCode";
import manufacturerApi from "../manufacturerApi";
import { resolveApiUrl } from "../../config/api";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

const buildParams = ({ search, section, status }) => {
  const params = {};
  if (search.trim()) params.search = search.trim();
  if (section !== "ALL") params.section = section;
  if (status !== "ALL") params.status = status;
  return params;
};

const getStatusColor = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "blocked") return "error";
  return "warning";
};

function MetricCard({ label, value, helper }) {
  return (
    <Grid item xs={12} sm={6} lg={3}>
      <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
            {helper}
          </Typography>
        ) : null}
      </Paper>
    </Grid>
  );
}

export default function ManufacturerProducts() {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [availableSections, setAvailableSections] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    section: "ALL",
    status: "ALL",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const fetchWorkspace = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const [profileResponse, productsResponse] = await Promise.all([
        manufacturerApi.get("/manufacturer/profile"),
        manufacturerApi.get("/manufacturer/products", {
          params: buildParams(nextFilters),
        }),
      ]);

      setProfile(profileResponse.data.manufacturer || null);
      setProducts(productsResponse.data.products || []);
      setSummary(productsResponse.data.summary || {});
      setAvailableSections(productsResponse.data.availableSections || []);
    } catch (err) {
      console.error("Manufacturer products workspace error", err);
      setError(err.response?.data?.message || "Unable to load manufacturer products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingProductId(null);
  };

  const deleteProduct = async (productId) => {
    if (
      !window.confirm(
        "Delete this manufacturer-owned product? DB details and Cloudinary media will both be removed.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(productId);
      await manufacturerApi.delete(`/manufacturer/products/${productId}`);
      setSelectedProduct((current) => (current?._id === productId ? null : current));
      await fetchWorkspace();
    } catch (err) {
      console.error("Delete manufacturer product failed", err);
      window.alert(err.response?.data?.message || "Unable to delete this product right now.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <Box>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Product Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage manufacturer-owned products that can appear on the website.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingProductId(null);
              setEditorOpen(true);
            }}
          >
            Add Product
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => fetchWorkspace()}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <MetricCard label="Total Products" value={formatNumber(summary.totalProducts)} helper="Products owned by this manufacturer account" />
            <MetricCard label="Active Products" value={formatNumber(summary.activeProducts)} helper={`${formatNumber(summary.inactiveProducts)} inactive or hidden`} />
            <MetricCard label="Tracked Sections" value={formatNumber(summary.totalSections)} helper={`${formatNumber(summary.unsectionedProducts)} products need section mapping`} />
            <MetricCard label="Total Stock" value={formatNumber(summary.totalStock)} helper="Combined units across your website catalog" />
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Manufacturer Capabilities and Catalogue
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Capability tags submitted in your manufacturer application
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(profile?.productTypes || []).length ? (
                    profile.productTypes.map((item) => (
                      <Chip key={item} size="small" label={item} />
                    ))
                  ) : (
                    <Typography color="text.secondary">No capability tags submitted.</Typography>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Uploaded product catalogue
                </Typography>
                {profile?.documents?.productListFile?.url ? (
                  <Button
                    href={resolveApiUrl(profile.documents.productListFile.url)}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                  >
                    {profile.documents.productListFile.originalName || "View catalogue"}
                  </Button>
                ) : (
                  <Typography color="text.secondary">No catalogue uploaded yet.</Typography>
                )}
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Catalog Controls
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Name, manufacturer, generic, HSN"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Section"
                  value={filters.section}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, section: event.target.value }))
                  }
                >
                  <MenuItem value="ALL">All sections</MenuItem>
                  {availableSections.map((sectionName) => (
                    <MenuItem key={sectionName} value={sectionName}>
                      {sectionName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <MenuItem value="ALL">All status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={() => fetchWorkspace(filters)}>
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const next = { search: "", section: "ALL", status: "ALL" };
                      setFilters(next);
                      fetchWorkspace(next);
                    }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Manufacturer Catalog
            </Typography>

            {products.length ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Sections</TableCell>
                    <TableCell>Pricing</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product._id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <TableCell>
                        <Typography fontWeight={700}>{product.brandName || "Untitled product"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.manufacturer || profile?.companyName || "Manufacturer not set"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{product.category?.title || "-"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.subCategory?.title || "No sub-category"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.sections?.length ? product.sections.join(", ") : "No section"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>MRP {formatNumber(product.mrp)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          PTR {formatNumber(product.saleRatePTR || product.rateB2C)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={getStatusColor(product.statusActive)}
                          label={formatStatus(product.statusActive)}
                        />
                      </TableCell>
                      <TableCell>{formatNumber(product.totalStocks || product.stocks)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <ProductQRCode product={product} compact />
                          <IconButton
                            color="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingProductId(product._id);
                              setEditorOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteProduct(product._id);
                            }}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">
                No manufacturer-owned products found yet.
              </Typography>
            )}
          </Paper>

          {selectedProduct ? (
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {selectedProduct.brandName || "Untitled product"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.manufacturer || profile?.companyName || "Manufacturer not set"}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Updated {formatDate(selectedProduct.updatedAt || selectedProduct.createdAt)}
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Generic Name</Typography>
                  <Typography fontWeight={700}>{selectedProduct.genericName || selectedProduct.genericCompositions || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">HSN</Typography>
                  <Typography fontWeight={700}>{selectedProduct.hsn || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Expiry</Typography>
                  <Typography fontWeight={700}>{formatDate(selectedProduct.expiryDate)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Batch Number</Typography>
                  <Typography fontWeight={700}>{selectedProduct.batchNumber || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Country of Origin</Typography>
                  <Typography fontWeight={700}>{selectedProduct.countryOfOrigin || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography fontWeight={700}>{selectedProduct.isOTC ? "OTC" : "Prescription"}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography sx={{ mt: 0.5 }}>
                  {selectedProduct.shortDescription ||
                    selectedProduct.moreInformation ||
                    selectedProduct.fullDescription ||
                    selectedProduct.description ||
                    "No description added."}
                </Typography>
              </Box>
            </Paper>
          ) : null}
        </>
      )}

      <Dialog open={editorOpen} onClose={closeEditor} fullScreen fullWidth maxWidth="xl">
        <DialogContent dividers sx={{ p: 0, bgcolor: "#0f1115" }}>
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0f1115] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-amber-400">
                <Inventory2 fontSize="small" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Manufacturer Product Desk
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  {editingProductId ? "Edit manufacturer product" : "Add new manufacturer product"}
                </div>
              </div>
            </div>
            <IconButton onClick={closeEditor} sx={{ color: "#cbd5e1" }}>
              <Close />
            </IconButton>
          </div>

          <AddProductForm
            editProductId={editingProductId}
            onSuccess={() => {
              closeEditor();
              fetchWorkspace();
            }}
            authTokenKey="manufacturerToken"
            productSearchPath="/api/manufacturer/products/search"
            getProductPath={(id) => `/api/manufacturer/products/${id}`}
            createProductPath="/api/manufacturer/products"
            updateProductPath={(id) => `/api/manufacturer/products/${id}`}
            hideFranchiseZoneField
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
