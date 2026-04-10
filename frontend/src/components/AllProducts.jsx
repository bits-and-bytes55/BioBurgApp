// AllProducts.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  TableContainer,
  TablePagination,
  Tooltip,
  TextField,
  Grid,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Chip,
  Rating,
  Badge,
  Divider,
  Collapse,
  Card,
  CardContent,
  LinearProgress,
  InputAdornment,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SortIcon from "@mui/icons-material/Sort";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VerifiedIcon from "@mui/icons-material/Verified";
import WarningIcon from "@mui/icons-material/Warning";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import ClearIcon from "@mui/icons-material/Clear";
import ProductQRCode from "../components/ProductQRCode";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
// const FRONTEND_BASE = "http://localhost:5173";

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("adminToken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const HEADERS = [
  { id: "image",           label: "Image",      sortable: false, width: 80,  align: "center" },
  { id: "brandName",       label: "Product Name",sortable: true,  width: 220, align: "left"   },
  { id: "category",        label: "Category",   sortable: true,  width: 150, align: "left"   },
  { id: "manufacturer",    label: "Manufacturer",sortable: true,  width: 150, align: "left"   },
  { id: "mrp",             label: "MRP",        sortable: true,  width: 100, align: "right"  },
  { id: "amp",             label: "AMP",        sortable: true,  width: 100, align: "right"  },
  { id: "ptr",             label: "PTR (B2C)",  sortable: true,  width: 120, align: "right"  },
  { id: "wsr",             label: "WSR",        sortable: true,  width: 120, align: "right"  },
  { id: "hpsr",            label: "HPSR",       sortable: true,  width: 120, align: "right"  },
  { id: "discountB2C",     label: "B2C Disc%",  sortable: true,  width: 100, align: "center" },
  { id: "discountB2B",     label: "B2B Disc%",  sortable: true,  width: 100, align: "center" },
  { id: "discountHospital",label: "Hosp Disc%", sortable: true,  width: 100, align: "center" },
  { id: "gst",             label: "GST%",       sortable: true,  width: 80,  align: "center" },
  { id: "stocks",          label: "Stock",      sortable: true,  width: 100, align: "center" },
  { id: "totalStocks",     label: "Total Stock",sortable: true,  width: 100, align: "center" },
  { id: "batchNumber",     label: "Batch",      sortable: true,  width: 120, align: "left"   },
  { id: "expiryDate",      label: "Expiry",     sortable: true,  width: 120, align: "left"   },
  { id: "hsn",             label: "HSN",        sortable: true,  width: 120, align: "left"   },
  { id: "rating",          label: "Rating",     sortable: true,  width: 100, align: "left"   },
  { id: "status",          label: "Status",     sortable: true,  width: 120, align: "center" },
  { id: "isOTC",           label: "Type",       sortable: true,  width: 100, align: "center" },
  { id: "vendor",          label: "Vendor",     sortable: true,  width: 160, align: "left"   },
  { id: "actions",         label: "Actions",    sortable: false, width: 150, align: "center" },
];

const COMPACT_HEADERS = [
  { id: "brandName", label: "Product" },
  { id: "mrp", label: "MRP" },
  { id: "ptr", label: "PTR" },
  { id: "stocks", label: "Stock" },
  { id: "vendor", label: "Vendor" },
  { id: "status", label: "Status" },
  { id: "actions", label: "Actions" },
];

// ── Vendor Badge Component 
function VendorBadge({ vendor }) {
  if (!vendor) return null;

  const vendorName =
    vendor.fullName || vendor.businessName || vendor.name || "Unknown Vendor";
  const vendorId = vendor._id || vendor.id;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" fontWeight={700}>
            Vendor ID:
          </Typography>
          <Typography
            variant="caption"
            display="block"
            sx={{ wordBreak: "break-all" }}
          >
            {vendorId}
          </Typography>
          {vendor.businessName && (
            <>
              <Typography variant="caption" fontWeight={700}>
                Business:
              </Typography>
              <Typography variant="caption" display="block">
                {vendor.businessName}
              </Typography>
            </>
          )}
          {vendor.email && (
            <>
              <Typography variant="caption" fontWeight={700}>
                Email:
              </Typography>
              <Typography variant="caption" display="block">
                {vendor.email}
              </Typography>
            </>
          )}
          {vendor.phone && (
            <>
              <Typography variant="caption" fontWeight={700}>
                Phone:
              </Typography>
              <Typography variant="caption" display="block">
                {vendor.phone}
              </Typography>
            </>
          )}
        </Box>
      }
      arrow
      placement="left"
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "#eff6ff",
          border: "1.5px solid #bfdbfe",
          borderRadius: 1.5,
          px: 1,
          py: 0.4,
          cursor: "help",
          "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
          transition: "all .15s",
          maxWidth: 150,
        }}
      >
        <StorefrontIcon sx={{ fontSize: 12, color: "#1565c0", flexShrink: 0 }} />
        <Typography
          variant="caption"
          fontWeight={700}
          color="#1565c0"
          noWrap
          sx={{ fontSize: 11 }}
        >
          {vendorName}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ── Vendor Search Panel ────────────────────────────────────────────────────
function VendorSearchPanel({ products, onFilteredResults, onClear }) {
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name"); // "name" | "id"
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(() => {
    if (!vendorSearchQuery.trim()) return;
    setSearching(true);

    const query = vendorSearchQuery.trim().toLowerCase();

    const matched = products.filter((p) => {
      const vendor = p.vendor;
      if (!vendor) return false;

      if (searchType === "id") {
        const vendorId = String(vendor._id || vendor.id || vendor || "");
        return vendorId.toLowerCase().includes(query);
      } else {
        // name search — check multiple name fields
        const name = (
          vendor.fullName ||
          vendor.businessName ||
          vendor.name ||
          ""
        ).toLowerCase();
        const business = (vendor.businessName || "").toLowerCase();
        const email = (vendor.email || "").toLowerCase();
        return (
          name.includes(query) ||
          business.includes(query) ||
          email.includes(query)
        );
      }
    });

    setSearchResults(matched);
    onFilteredResults(matched);
    setSearching(false);
  }, [vendorSearchQuery, searchType, products, onFilteredResults]);

  const handleClear = () => {
    setVendorSearchQuery("");
    setSearchResults(null);
    onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Group results by vendor for summary
  const vendorSummary = useMemo(() => {
    if (!searchResults) return null;
    const map = {};
    searchResults.forEach((p) => {
      const vendor = p.vendor;
      if (!vendor) return;
      const vid = String(vendor._id || vendor.id || "unknown");
      if (!map[vid]) {
        map[vid] = {
          id: vid,
          name:
            vendor.fullName ||
            vendor.businessName ||
            vendor.name ||
            "Unknown",
          count: 0,
        };
      }
      map[vid].count++;
    });
    return Object.values(map);
  }, [searchResults]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: "2px solid #bfdbfe",
        bgcolor: "#f0f7ff",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <PersonSearchIcon sx={{ color: "#1565c0", fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={700} color="#1565c0">
          Vendor Product Search
        </Typography>
        <Chip
          label="Search by vendor to filter all their products"
          size="small"
          sx={{ bgcolor: "#dbeafe", color: "#1e40af", fontSize: 10 }}
        />
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
        {/* Search type toggle */}
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Search By</InputLabel>
          <Select
            value={searchType}
            label="Search By"
            onChange={(e) => setSearchType(e.target.value)}
          >
            <MenuItem value="name">Vendor Name</MenuItem>
            <MenuItem value="id">Vendor ID</MenuItem>
          </Select>
        </FormControl>

        {/* Search input */}
        <TextField
          size="small"
          fullWidth
          placeholder={
            searchType === "id"
              ? "Paste vendor ID (e.g. 507f1f77bcf86cd799...)"
              : "Type vendor name or business name..."
          }
          value={vendorSearchQuery}
          onChange={(e) => setVendorSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
              </InputAdornment>
            ),
            endAdornment: vendorSearchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />

        <Button
          variant="contained"
          size="small"
          onClick={handleSearch}
          disabled={!vendorSearchQuery.trim() || searching}
          sx={{
            bgcolor: "#1565c0",
            minWidth: 80,
            "&:hover": { bgcolor: "#0d47a1" },
            flexShrink: 0,
          }}
          startIcon={
            searching ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <SearchIcon />
            )
          }
        >
          Search
        </Button>

        {searchResults !== null && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleClear}
            startIcon={<ClearIcon />}
            sx={{ flexShrink: 0 }}
          >
            Clear
          </Button>
        )}
      </Stack>

      {/* Results summary */}
      {searchResults !== null && (
        <Box mt={1.5}>
          {searchResults.length === 0 ? (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              No products found for this vendor. Check the ID or name and try
              again.
            </Alert>
          ) : (
            <Box>
              <Alert severity="success" icon={<StorefrontIcon />} sx={{ py: 0.5, mb: 1 }}>
                Found <strong>{searchResults.length} product(s)</strong> from{" "}
                <strong>{vendorSummary?.length} vendor(s)</strong>
              </Alert>
              {/* Vendor chips */}
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {vendorSummary?.map((v) => (
                  <Chip
                    key={v.id}
                    icon={<StorefrontIcon sx={{ fontSize: "14px !important" }} />}
                    label={`${v.name} — ${v.count} product(s)`}
                    size="small"
                    sx={{
                      bgcolor: "#1565c0",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 11,
                      "& .MuiChip-icon": { color: "white" },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default function AllProducts({ onEdit, sectionKey, compactMode = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [vendorFilteredProducts, setVendorFilteredProducts] = useState(null); // null = no vendor filter active

  // Filter states
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOTC, setFilterOTC] = useState("");
  const [filterGST, setFilterGST] = useState("");
  const [filterExpiryMonth, setFilterExpiryMonth] = useState("");
  const [filterVendorOnly, setFilterVendorOnly] = useState(""); // "vendor" | "admin" | ""

  const [categoriesList, setCategoriesList] = useState([]);
  const [manufacturersList, setManufacturersList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [gstRatesList, setGstRatesList] = useState([]);

  const [orderBy, setOrderBy] = useState("createdAt");
  const [orderDir, setOrderDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/products");
      if (res.data.success) {
        const ps = res.data.data || [];
        setProducts(ps);
        setCategoriesList([...new Set(ps.map((p) => p.category?.title).filter(Boolean))]);
        setManufacturersList([...new Set(ps.map((p) => p.manufacturer).filter(Boolean))]);
        setBrandsList([...new Set(ps.map((p) => p.brandName).filter(Boolean))]);
        const gstRates = new Set();
        ps.forEach((p) => {
          if (p.gst_igst) gstRates.add(p.gst_igst);
          if (p.gst?.igst) gstRates.add(p.gst.igst);
        });
        setGstRatesList([...gstRates].sort((a, b) => a - b));
      } else setProducts([]);
    } catch (err) {
      console.error("Fetch products error:", err);
      alert("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleRowExpansion = useCallback((id, e) => {
    e?.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleRowClick = useCallback((id) => {
    window.open(`${FRONTEND_BASE}/product-details/${id}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleEdit = useCallback(
    (e, id) => {
      e.preventDefault();
      e.stopPropagation();
      if (!id) return;
      if (typeof onEdit === "function") onEdit(id);
      else alert("onEdit prop not connected to dashboard.");
    },
    [onEdit],
  );

  const handleDelete = useCallback(
    async (e, id) => {
      e.preventDefault();
      e.stopPropagation();
      if (!window.confirm("Delete this product?")) return;
      try {
        await api.delete(`/api/admin/product/${id}`);
        fetchProducts();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete product");
      }
    },
    [fetchProducts],
  );

  // ── Base list: vendor search overrides all products ────────────────────
  const baseProducts = vendorFilteredProducts !== null ? vendorFilteredProducts : products;

  const filtered = useMemo(() => {
    let list = [...baseProducts];

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.brandName || "").toLowerCase().includes(s) ||
          (p.manufacturer || "").toLowerCase().includes(s) ||
          (p.genericName || "").toLowerCase().includes(s) ||
          (p.sku || "").toLowerCase().includes(s) ||
          (p.batchNumber || "").toLowerCase().includes(s) ||
          (p.hsn || "").toLowerCase().includes(s),
      );
    }

    if (filterCategory) list = list.filter((p) => p.category?.title === filterCategory);
    if (filterManufacturer) list = list.filter((p) => p.manufacturer === filterManufacturer);
    if (filterBrand) list = list.filter((p) => p.brandName === filterBrand);

    if (filterStatus === "active")
      list = list.filter((p) => p.statusActive === "active" || p.currentStatus1 === "active");
    if (filterStatus === "inactive")
      list = list.filter((p) => p.statusActive === "inactive" || p.currentStatus1 === "inactive");

    if (filterOTC === "otc") list = list.filter((p) => p.isOTC === true);
    if (filterOTC === "rx") list = list.filter((p) => p.isOTC === false);

    if (filterGST) {
      const gstVal = parseFloat(filterGST);
      list = list.filter((p) => {
        const pGst = parseFloat(p.gst_igst || p.gst?.igst || 0);
        return Math.abs(pGst - gstVal) < 0.01;
      });
    }

    if (filterExpiryMonth) {
      const [year, month] = filterExpiryMonth.split("-");
      list = list.filter((p) => {
        if (!p.expiryDate) return false;
        const expDate = new Date(p.expiryDate);
        return expDate.getFullYear() === parseInt(year) && expDate.getMonth() + 1 === parseInt(month);
      });
    }

    if (priceMin !== "") list = list.filter((p) => parseFloat(p.mrp || 0) >= Number(priceMin));
    if (priceMax !== "") list = list.filter((p) => parseFloat(p.mrp || 0) <= Number(priceMax));

    // Vendor-only filter
    if (filterVendorOnly === "vendor") list = list.filter((p) => !!p.vendor);
    if (filterVendorOnly === "admin") list = list.filter((p) => !p.vendor);

    const dir = orderDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let av, bv;
      switch (orderBy) {
        case "category": av = a.category?.title || ""; bv = b.category?.title || ""; break;
        case "manufacturer": av = a.manufacturer || ""; bv = b.manufacturer || ""; break;
        case "ptr": av = parseFloat(a.ptr || a.saleRatePTR || 0); bv = parseFloat(b.ptr || b.saleRatePTR || 0); break;
        case "wsr": av = parseFloat(a.wsr || a.wholesaleSaleRate || 0); bv = parseFloat(b.wsr || b.wholesaleSaleRate || 0); break;
        case "hpsr": av = parseFloat(a.hpsr || a.hospitalSaleRate || 0); bv = parseFloat(b.hpsr || b.hospitalSaleRate || 0); break;
        case "gst": av = parseFloat(a.gst_igst || a.gst?.igst || 0); bv = parseFloat(b.gst_igst || b.gst?.igst || 0); break;
        case "stocks": av = parseInt(a.stocks || a.stock || a.totalStocks || 0); bv = parseInt(b.stocks || b.stock || b.totalStocks || 0); break;
        case "totalStocks": av = parseInt(a.totalStocks || a.stocks || a.stock || 0); bv = parseInt(b.totalStocks || b.stocks || b.stock || 0); break;
        case "status": av = a.statusActive || a.currentStatus1 || ""; bv = b.statusActive || b.currentStatus1 || ""; break;
        case "vendor":
          av = a.vendor?.fullName || a.vendor?.businessName || (a.vendor ? "z" : "");
          bv = b.vendor?.fullName || b.vendor?.businessName || (b.vendor ? "z" : "");
          break;
        default: av = a[orderBy]; bv = b[orderBy];
      }
      if (av == null && bv == null) return 0;
      if (av == null) return dir;
      if (bv == null) return -dir;
      if (typeof av === "number" || typeof bv === "number") return (Number(av) - Number(bv)) * dir;
      if (typeof av === "boolean") return (av === bv ? 0 : av ? -1 : 1) * dir;
      return String(av).toLowerCase().localeCompare(String(bv).toLowerCase()) * dir;
    });

    return list;
  }, [
    baseProducts, search, filterCategory, filterManufacturer, filterBrand,
    priceMin, priceMax, filterStatus, filterOTC, filterGST, filterExpiryMonth,
    filterVendorOnly, orderBy, orderDir,
  ]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  const handleSortClick = (colId) => {
    if (!colId) return;
    if (orderBy === colId) setOrderDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setOrderBy(colId); setOrderDir("asc"); }
  };

  const resetFilters = () => {
    setSearch(""); setFilterCategory(""); setFilterManufacturer("");
    setFilterBrand(""); setPriceMin(""); setPriceMax("");
    setFilterStatus(""); setFilterOTC(""); setFilterGST("");
    setFilterExpiryMonth(""); setFilterVendorOnly("");
  };

  // Stats
  const vendorProductCount = useMemo(() => products.filter((p) => !!p.vendor).length, [products]);
  const adminProductCount = products.length - vendorProductCount;

  const handleExportExcel = () => {
    const data = filtered.map((p) => ({
      "Brand Name": p.brandName || "",
      Manufacturer: p.manufacturer || "",
      "Generic Name": p.genericName || p.genericCompositions || "",
      Category: p.category?.title || "",
      "Sub Category": p.subCategory?.title || "",
      MRP: p.mrp || "",
      AMP: p.amp || "",
      "PTR (B2C)": p.ptr || p.saleRatePTR || "",
      "WSR (Wholesale)": p.wsr || p.wholesaleSaleRate || "",
      "HPSR (Hospital)": p.hpsr || p.hospitalSaleRate || "",
      "B2C Discount %": p.discountB2C || "",
      "B2B Discount %": p.discountB2B || "",
      "Hospital Discount %": p.discountHospital || "",
      "GST IGST": p.gst_igst || p.gst?.igst || "",
      Stocks: p.stocks || p.stock || p.totalStocks || "",
      "Total Stocks": p.totalStocks || "",
      "Batch Number": p.batchNumber || "",
      "Expiry Date": p.expiryDate || "",
      "HSN Code": p.hsn || "",
      "Is OTC": p.isOTC ? "Yes" : "No",
      "Status Active": p.statusActive || p.currentStatus1 || "",
      "Vendor Name": p.vendor?.fullName || p.vendor?.businessName || (p.vendor ? "Vendor" : "Admin"),
      "Vendor ID": p.vendor?._id || p.vendor?.id || "",
      "Vendor Email": p.vendor?.email || "",
      "Vendor Phone": p.vendor?.phone || "",
      "Created At": p.createdAt || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const colWidths = [];
    data.forEach((row) => {
      Object.keys(row).forEach((key, i) => {
        const width = Math.max(key.length, String(row[key] || "").length) * 1.2;
        colWidths[i] = Math.max(colWidths[i] || 0, Math.min(width, 50));
      });
    });
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      `products_export_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const getGstDisplay = (p) => p.gst_igst || p.gst?.igst || "-";
  const getStockDisplay = (p) => p.totalStocks || p.stocks || p.stock || "0";
  const getStatusDisplay = (p) => {
    const status = p.statusActive || p.currentStatus1;
    return status === "active"
      ? <Chip label="Active" color="success" size="small" />
      : <Chip label="Inactive" size="small" />;
  };
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
    if (daysUntilExpiry < 0) return <Chip label="Expired" color="error" size="small" />;
    if (daysUntilExpiry < 30) return <Chip label={`Expires in ${daysUntilExpiry}d`} color="warning" size="small" />;
    if (daysUntilExpiry < 90) return <Chip label={`Expires in ${daysUntilExpiry}d`} color="info" size="small" />;
    return null;
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );

  const activeHeaders = compactMode ? COMPACT_HEADERS : HEADERS;

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip
          icon={<InventoryIcon sx={{ fontSize: "14px !important" }} />}
          label={`${products.length} Total Products`}
          size="small"
          color="default"
          variant="outlined"
        />
        <Chip
          icon={<StorefrontIcon sx={{ fontSize: "14px !important" }} />}
          label={`${vendorProductCount} Vendor Products`}
          size="small"
          sx={{
            bgcolor: "#eff6ff",
            color: "#1565c0",
            borderColor: "#bfdbfe",
            fontWeight: 700,
            "& .MuiChip-icon": { color: "#1565c0" },
          }}
          variant="outlined"
          onClick={() => setFilterVendorOnly(filterVendorOnly === "vendor" ? "" : "vendor")}
        />
        <Chip
          icon={<VerifiedIcon sx={{ fontSize: "14px !important" }} />}
          label={`${adminProductCount} Admin Products`}
          size="small"
          sx={{
            bgcolor: "#f0fdf4",
            color: "#15803d",
            borderColor: "#bbf7d0",
            fontWeight: 700,
            "& .MuiChip-icon": { color: "#15803d" },
          }}
          variant="outlined"
          onClick={() => setFilterVendorOnly(filterVendorOnly === "admin" ? "" : "admin")}
        />
        {filterVendorOnly && (
          <Chip
            label={`Showing: ${filterVendorOnly === "vendor" ? "Vendor" : "Admin"} products only`}
            size="small"
            color="warning"
            onDelete={() => setFilterVendorOnly("")}
          />
        )}
        {vendorFilteredProducts !== null && (
          <Chip
            label="Vendor search active"
            size="small"
            color="primary"
            onDelete={() => setVendorFilteredProducts(null)}
          />
        )}
      </Stack>

      {/* ── Vendor Search Panel ───────────────────────────────────────────── */}
      <VendorSearchPanel
        products={products}
        onFilteredResults={(results) => {
          setVendorFilteredProducts(results);
          setPage(0);
        }}
        onClear={() => {
          setVendorFilteredProducts(null);
          setPage(0);
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="h5" fontWeight={700}>
            Product Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} products shown
            {vendorFilteredProducts !== null && " (vendor filter active)"}
            {" "}• Click row to preview
          </Typography>
        </Grid>
        <Grid item xs={12} md={8}>
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters((s) => !s)}
              size="small"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchProducts} size="small">
              Refresh
            </Button>
            <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleExportExcel} size="small">
              Export Excel
            </Button>
          </Stack>
        </Grid>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Collapse in={showFilters}>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: "#f8fafc" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Search (name, mfr, sku, batch)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={filterCategory} label="Category" onChange={(e) => setFilterCategory(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {categoriesList.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Manufacturer</InputLabel>
                    <Select value={filterManufacturer} label="Manufacturer" onChange={(e) => setFilterManufacturer(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {manufacturersList.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Brand</InputLabel>
                    <Select value={filterBrand} label="Brand" onChange={(e) => setFilterBrand(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {brandsList.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={1}>
                  <TextField fullWidth size="small" type="number" label="Min ₹" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                </Grid>
                <Grid item xs={6} md={1}>
                  <TextField fullWidth size="small" type="number" label="Max ₹" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                </Grid>

                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select value={filterOTC} label="Type" onChange={(e) => setFilterOTC(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="otc">OTC</MenuItem>
                      <MenuItem value="rx">Rx Required</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>GST Rate</InputLabel>
                    <Select value={filterGST} label="GST Rate" onChange={(e) => setFilterGST(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {gstRatesList.map((g) => <MenuItem key={g} value={g}>{g}%</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                {/* NEW: Source filter */}
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Source</InputLabel>
                    <Select value={filterVendorOnly} label="Source" onChange={(e) => setFilterVendorOnly(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="vendor">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <StorefrontIcon sx={{ fontSize: 14, color: "#1565c0" }} /> Vendor Products
                        </Box>
                      </MenuItem>
                      <MenuItem value="admin">Admin Products</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth size="small" type="month" label="Expiry Month"
                    InputLabelProps={{ shrink: true }}
                    value={filterExpiryMonth}
                    onChange={(e) => setFilterExpiryMonth(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button variant="outlined" onClick={resetFilters} fullWidth size="small">
                    Reset Filters
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Collapse>
        </Grid>
      </Grid>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {activeHeaders.map((h) => (
                  <TableCell
                    key={h.id}
                    align={h.align || "left"}
                    sx={{
                      background: "#f8fafc",
                      fontWeight: 700,
                      minWidth: h.width,
                      cursor: h.sortable ? "pointer" : "default",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => h.sortable && handleSortClick(h.id)}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {h.label}
                      {h.sortable && (
                        <SortIcon sx={{ fontSize: 14, opacity: orderBy === h.id ? 1 : 0.3 }} />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paged.map((p) => {
                const primaryImg =
                  p.images?.[p.primaryImageIndex || 0]?.url || p.images?.[0]?.url || "";
                const isExpanded = expandedRows[p._id];
                const isVendorProduct = !!p.vendor;

                return (
                  <React.Fragment key={p._id}>
                    <TableRow
                      hover
                      onClick={() => handleRowClick(p._id)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: isExpanded
                          ? "#f0f7ff"
                          : isVendorProduct
                          ? "#fafeff" // very subtle blue tint for vendor rows
                          : "inherit",
                        borderLeft: isVendorProduct
                          ? "3px solid #1565c0"
                          : "3px solid transparent",
                        "&:hover": { bgcolor: "#e3f2fd" },
                      }}
                    >
                      {/* Image */}
                      <TableCell align="center">
                        <Badge
                          overlap="circular"
                          badgeContent={
                            isVendorProduct ? (
                              <Tooltip title="Vendor Product">
                                <StorefrontIcon
                                  sx={{
                                    fontSize: 12,
                                    bgcolor: "#1565c0",
                                    color: "white",
                                    borderRadius: "50%",
                                    p: 0.3,
                                  }}
                                />
                              </Tooltip>
                            ) : null
                          }
                        >
                          <Avatar
                            variant="rounded"
                            src={primaryImg}
                            sx={{ width: 48, height: 48 }}
                          />
                        </Badge>
                      </TableCell>

                      {/* Brand Name */}
                      <TableCell>
                        <Typography fontWeight={700} color="primary.main">
                          {p.brandName || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.sku || ""}
                        </Typography>
                        {/* Vendor arrow indicator */}
                        {isVendorProduct && (
                          <Box display="flex" alignItems="center" gap={0.4} mt={0.3}>
                            <Typography
                              variant="caption"
                              sx={{ color: "#1565c0", fontSize: 10 }}
                            >
                              ↗
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#1565c0",
                                fontWeight: 700,
                                fontSize: 10,
                                bgcolor: "#eff6ff",
                                px: 0.5,
                                borderRadius: 0.5,
                              }}
                            >
                              Vendor:{" "}
                              {p.vendor?.fullName ||
                                p.vendor?.businessName ||
                                String(p.vendor?._id || p.vendor || "").slice(-6)}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Category */}
                      {!compactMode && (
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {p.category?.title || "-"}
                          </Typography>
                          {p.subCategory && (
                            <Typography variant="caption" color="text.secondary">
                              {p.subCategory.title}
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {/* Manufacturer */}
                      {!compactMode && (
                        <TableCell>
                          <Typography variant="body2">{p.manufacturer || "-"}</Typography>
                        </TableCell>
                      )}

                      {/* MRP */}
                      <TableCell align="right">
                        <Typography fontWeight={600}>₹{p.mrp || p.price || "0"}</Typography>
                      </TableCell>

                      {/* AMP */}
                      {!compactMode && <TableCell align="right">₹{p.amp || "0"}</TableCell>}

                      {/* PTR */}
                      <TableCell align="right">
                        ₹{p.ptr || p.saleRatePTR || parseFloat(p.mrp || 0) * (1 - parseFloat(p.discountB2C || 0) / 100)}
                      </TableCell>

                      {/* WSR */}
                      {!compactMode && <TableCell align="right">₹{p.wsr || p.wholesaleSaleRate || "-"}</TableCell>}

                      {/* HPSR */}
                      {!compactMode && <TableCell align="right">₹{p.hpsr || p.hospitalSaleRate || "-"}</TableCell>}

                      {/* Discounts */}
                      {!compactMode && (
                        <>
                          <TableCell align="center">{p.discountB2C || "0"}%</TableCell>
                          <TableCell align="center">{p.discountB2B || "0"}%</TableCell>
                          <TableCell align="center">{p.discountHospital || "0"}%</TableCell>
                        </>
                      )}

                      {/* GST */}
                      <TableCell align="center">
                        <Chip label={`${getGstDisplay(p)}%`} size="small" color="primary" variant="outlined" />
                      </TableCell>

                      {/* Stocks */}
                      <TableCell align="center">
                        <Typography fontWeight={600}>{getStockDisplay(p)}</Typography>
                      </TableCell>

                      {/* Total Stocks */}
                      {!compactMode && (
                        <TableCell align="center">
                          {p.totalStocks || p.stocks || p.stock || "0"}
                        </TableCell>
                      )}

                      {/* Batch Number */}
                      {!compactMode && (
                        <TableCell>
                          {p.batchNumber || "-"}
                          {getExpiryStatus(p.expiryDate) && (
                            <Box mt={0.5}>{getExpiryStatus(p.expiryDate)}</Box>
                          )}
                        </TableCell>
                      )}

                      {/* Expiry Date */}
                      {!compactMode && (
                        <TableCell>
                          {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "-"}
                        </TableCell>
                      )}

                      {/* HSN */}
                      {!compactMode && <TableCell>{p.hsn || "-"}</TableCell>}

                      {/* Rating */}
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={parseFloat(p.rating) || 0} readOnly size="small" />
                          <Typography variant="caption">({p.rating || "0"})</Typography>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">{getStatusDisplay(p)}</TableCell>

                      {/* OTC/Rx */}
                      <TableCell align="center">
                        {p.isOTC
                          ? <Chip label="OTC" color="success" size="small" />
                          : <Chip label="Rx" color="error" size="small" />}
                      </TableCell>

                      {/* Vendor column */}
                      <TableCell>
                        {isVendorProduct ? (
                          <VendorBadge vendor={p.vendor} />
                        ) : (
                          <Chip
                            label="Admin"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 10, height: 20, color: "#6b7280", borderColor: "#d1d5db" }}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Expand details">
                            <IconButton size="small" onClick={(e) => toggleRowExpansion(p._id, e)}>
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                          <Box onClick={(e) => e.stopPropagation()}>
                            <ProductQRCode
                              product={{
                                _id: p._id,
                                brandName: p.brandName,
                                manufacturer: p.manufacturer,
                                mrp: p.mrp || p.price,
                                expiryDate: p.expiryDate,
                                batchNumber: p.batchNumber,
                                gst_igst: p.gst_igst || p.gst?.igst,
                              }}
                              compact={true}
                            />
                          </Box>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={(e) => handleEdit(e, p._id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={(e) => { e.stopPropagation(); handleRowClick(p._id); }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={(e) => handleDelete(e, p._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={activeHeaders.length} sx={{ py: 2, bgcolor: "#f8fafc" }}>
                          <Collapse in={isExpanded}>
                            <Card variant="outlined" sx={{ bgcolor: "white" }}>
                              <CardContent>
                                {/* Vendor info banner */}
                                {isVendorProduct && (
                                  <Box
                                    sx={{
                                      mb: 2,
                                      p: 1.5,
                                      bgcolor: "#eff6ff",
                                      border: "1.5px solid #bfdbfe",
                                      borderRadius: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <StorefrontIcon sx={{ color: "#1565c0", fontSize: 20 }} />
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={700} color="#1565c0">
                                        Vendor Product
                                      </Typography>
                                      <Typography variant="caption" color="#1e40af">
                                        Added by vendor — not admin
                                      </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    {[
                                      { label: "Vendor ID", value: p.vendor?._id || p.vendor?.id || String(p.vendor || "").slice(-12) },
                                      { label: "Name", value: p.vendor?.fullName || p.vendor?.businessName || "—" },
                                      { label: "Email", value: p.vendor?.email || "—" },
                                      { label: "Phone", value: p.vendor?.phone || "—" },
                                      { label: "Business", value: p.vendor?.businessName || "—" },
                                    ].map((item) => (
                                      <Box key={item.label}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          {item.label}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          fontWeight={700}
                                          color="#1565c0"
                                          sx={{ wordBreak: "break-all" }}
                                        >
                                          {item.value}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                )}

                                <Grid container spacing={3}>
                                  {/* Left column */}
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                      <InventoryIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                      Basic Information
                                    </Typography>
                                    <Stack spacing={1} divider={<Divider />}>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Manufacturer</Typography>
                                        <Typography variant="body2">{p.manufacturer || "-"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Generic Name</Typography>
                                        <Typography variant="body2">{p.genericName || p.genericCompositions || "-"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Package Type</Typography>
                                        <Typography variant="body2">{p.packagingType || p.packageType || "-"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Product Weight</Typography>
                                        <Typography variant="body2">{p.productWeight ? `${p.productWeight}g` : "-"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Country of Origin</Typography>
                                        <Typography variant="body2">{p.countryOfOrigin || "-"}</Typography>
                                      </Box>
                                    </Stack>
                                  </Grid>

                                  {/* Middle column */}
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                      <LocalOfferIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                      Pricing & Discounts
                                    </Typography>
                                    <Stack spacing={1} divider={<Divider />}>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Min Rate Fixed</Typography>
                                        <Typography variant="body2">₹{p.minRateFixed || "0"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Case Pack Price</Typography>
                                        <Typography variant="body2">₹{p.casePackPrice || "0"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Total Cost of Stores</Typography>
                                        <Typography variant="body2">₹{p.totalCostOfStores || "0"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Total Actual Value</Typography>
                                        <Typography variant="body2">₹{p.totalActualValue || "0"}</Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">B2B Rate</Typography>
                                        <Typography variant="body2">
                                          ₹{parseFloat(p.mrp || 0) * (1 - parseFloat(p.discountB2B || 0) / 100)}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Grid>

                                  {/* Right column */}
                                  <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                      <VerifiedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                      Offers & Status
                                    </Typography>
                                    <Stack spacing={1} divider={<Divider />}>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Offers</Typography>
                                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                          {(p.offersWithIcon || []).map((o, i) => (
                                            <Chip
                                              key={i}
                                              label={o.text}
                                              size="small"
                                              color={o.flashing ? "warning" : "default"}
                                              icon={o.flashing ? <WarningIcon /> : <LocalOfferIcon />}
                                            />
                                          ))}
                                          {(!p.offersWithIcon || p.offersWithIcon.length === 0) && "-"}
                                        </Box>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Schemes</Typography>
                                        <Typography variant="body2">
                                          {p.scheme1 || p.scheme2 ? `${p.scheme1 || ""} ${p.scheme2 || ""}`.trim() : "-"}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Tags</Typography>
                                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                          {(p.tags || []).map((t, i) => <Chip key={i} label={t} size="small" />)}
                                        </Box>
                                      </Box>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">Marketer</Typography>
                                        <Typography variant="body2">{p.marketerName || "-"}</Typography>
                                      </Box>
                                    </Stack>
                                  </Grid>

                                  {/* Injection/Tablet Types */}
                                  {(p.injectionTypes?.length > 0 || p.tabletTypes?.length > 0) && (
                                    <Grid item xs={12}>
                                      <Divider sx={{ my: 1 }} />
                                      <Box display="flex" gap={2} flexWrap="wrap">
                                        {p.injectionTypes?.length > 0 && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Injection Types</Typography>
                                            <Box display="flex" gap={0.5} mt={0.5}>
                                              {p.injectionTypes.map((t, i) => (
                                                <Chip key={i} label={t} size="small" color="primary" variant="outlined" />
                                              ))}
                                            </Box>
                                          </Box>
                                        )}
                                        {p.tabletTypes?.length > 0 && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">Tablet Types</Typography>
                                            <Box display="flex" gap={0.5} mt={0.5}>
                                              {p.tabletTypes.map((t, i) => (
                                                <Chip key={i} label={t} size="small" color="secondary" variant="outlined" />
                                              ))}
                                            </Box>
                                          </Box>
                                        )}
                                      </Box>
                                    </Grid>
                                  )}
                                </Grid>
                              </CardContent>
                            </Card>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}

              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={activeHeaders.length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No products found matching your criteria
                    </Typography>
                    <Button variant="outlined" size="small" onClick={resetFilters} sx={{ mt: 1 }}>
                      Clear Filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Showing {filtered.length === 0 ? 0 : page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length} products
          {filtered.length !== products.length && ` (filtered from ${products.length} total)`}
        </Typography>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </Box>
    </Paper>
  );
}