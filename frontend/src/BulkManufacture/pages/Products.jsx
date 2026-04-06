import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import {
  Add,
  Close,
  DeleteOutline,
  Edit,
  ExpandLess,
  ExpandMore,
  Inventory2,
  Refresh,
  Storefront,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import AddProductForm from "../../components/AddProductForm";
import ProductQRCode from "../../components/ProductQRCode";
import bulkManufacturingApi from "../bulkManufactureApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleMetricCard,
  ConsoleNotice,
  ConsolePage,
  ConsolePanel,
  consoleInputClass,
  consoleTableCellClass,
  consoleTableHeadClass,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../../Franchise/components/consoleUi";

const buildParams = ({ search, section, status }) => {
  const params = {};
  if (search.trim()) params.search = search.trim();
  if (section !== "ALL") params.section = section;
  if (status !== "ALL") params.status = status;
  return params;
};

const getTone = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "active") return "green";
  if (normalized === "blocked") return "rose";
  return "amber";
};

const getExpiryTone = (value) => {
  if (!value) return "neutral";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "neutral";

  const remainingMs = parsed.getTime() - Date.now();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  if (remainingDays < 0) return "rose";
  if (remainingDays <= 90) return "amber";
  return "green";
};

function DetailBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-slate-50 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-800">{value || "-"}</div>
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [availableSections, setAvailableSections] = useState([]);
  const [filters, setFilters] = useState({ search: "", section: "ALL", status: "ALL" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const storedUser = JSON.parse(localStorage.getItem("bulkManufacturingUser") || "{}");

  const fetchProducts = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const response = await bulkManufacturingApi.get("/bulk-manufacturing-portal/products", {
        params: buildParams(nextFilters),
      });
      setProducts(response.data.products || []);
      setSummary(response.data.summary || {});
      setAvailableSections(response.data.availableSections || []);
    } catch (err) {
      console.error("Bulk manufacturing products fetch error", err);
      setError(err.response?.data?.message || "Unable to load bulk manufacturing products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setEditingProductId(null);
      setEditorOpen(true);
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.delete("create");
        return nextParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const sectionSummary = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      (product.sections || []).forEach((sectionName) => {
        counts.set(sectionName, (counts.get(sectionName) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 8);
  }, [products]);

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingProductId(null);
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this bulk manufacturing product? DB details and Cloudinary media will both be removed.")) {
      return;
    }

    try {
      setDeletingId(productId);
      await bulkManufacturingApi.delete(`/bulk-manufacturing-portal/products/${productId}`);
      setExpandedProductId((current) => (current === productId ? "" : current));
      await fetchProducts();
    } catch (err) {
      console.error("Delete bulk manufacturing product failed", err);
      window.alert(err.response?.data?.message || "Unable to delete this product right now.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          eyebrow="Bulk Manufacturing Catalog"
          title="All Products"
          description="Create, list, and manage your bulk-manufacturer-owned website catalog using the shared product engine. Products saved here can be mapped to sections and rendered on public website sliders."
          badges={
            <>
              <ConsoleBadge tone="blue">{formatNumber(summary.totalProducts)} partner-owned products</ConsoleBadge>
              <ConsoleBadge tone="green">{formatNumber(summary.activeProducts)} active</ConsoleBadge>
              <ConsoleBadge tone="amber">{formatNumber(summary.totalSections)} sections covered</ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton onClick={() => { setEditingProductId(null); setEditorOpen(true); }}>
                <span className="inline-flex items-center gap-2"><Add fontSize="small" />Add Product</span>
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={() => fetchProducts()}>
                <span className="inline-flex items-center gap-2"><Refresh fontSize="small" />Refresh</span>
              </ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}
        {storedUser?.companyName ? (
          <ConsoleNotice tone="info">
            All products shown here are scoped to <strong>{storedUser.companyName}</strong>. Section mapping controls how each product appears on the public website.
          </ConsoleNotice>
        ) : null}

        {loading ? (
          <ConsoleLoading label="Loading bulk manufacturing products..." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ConsoleMetricCard label="Total Products" primary={formatNumber(summary.totalProducts)} secondary="Products owned by this bulk manufacturing account" />
              <ConsoleMetricCard label="Active Products" primary={formatNumber(summary.activeProducts)} secondary={`${formatNumber(summary.inactiveProducts)} inactive or hidden`} />
              <ConsoleMetricCard label="Tracked Sections" primary={formatNumber(summary.totalSections)} secondary={`${formatNumber(summary.unsectionedProducts)} products need section mapping`} />
              <ConsoleMetricCard label="Total Stock" primary={formatNumber(summary.totalStock)} secondary="Combined units across your published catalog" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_340px]">
              <ConsolePanel title="Catalog controls" subtitle="Filter by section, status, or search term before opening products">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_220px_180px_auto_auto]">
                  <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search by name, manufacturer, generic composition, or HSN" className={consoleInputClass} />
                  <select value={filters.section} onChange={(event) => setFilters((current) => ({ ...current, section: event.target.value }))} className={consoleInputClass}>
                    <option value="ALL">All sections</option>
                    {availableSections.map((sectionName) => <option key={sectionName} value={sectionName}>{sectionName}</option>)}
                  </select>
                  <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={consoleInputClass}>
                    <option value="ALL">All status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                    <option value="pending">Pending</option>
                  </select>
                  <ConsoleButton variant="secondary" onClick={() => fetchProducts(filters)}>Apply</ConsoleButton>
                  <ConsoleButton variant="secondary" onClick={() => { const next = { search: "", section: "ALL", status: "ALL" }; setFilters(next); fetchProducts(next); }}>Reset</ConsoleButton>
                </div>
              </ConsolePanel>

              <ConsolePanel title="Section coverage" subtitle="Top sections currently feeding the public storefront">
                {sectionSummary.length ? (
                  <div className="grid gap-3">
                    {sectionSummary.map((entry) => (
                      <div key={entry.name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-100">{entry.name}</div>
                          <ConsoleBadge tone="blue">{formatNumber(entry.count)} products</ConsoleBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ConsoleEmptyState title="No section mapping yet" text="Assign sections while saving a product so it can render in the public website sliders." />
                )}
              </ConsolePanel>
            </div>

            <ConsolePanel title="All bulk-manufacturing products" subtitle="Detailed product desk using the same product structure as the shared AllProducts screen, now scoped to your own account.">
              {products.length ? (
                <div className="grid gap-4">
                  {products.map((product) => {
                    const expanded = expandedProductId === product._id;

                    return (
                      <div key={product._id} className="rounded-[28px] border border-black/[0.08] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_220px_180px]">
                          <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03]">
                              {product.images?.[0]?.url ? (
                                <img src={product.images[0].url} alt={product.brandName || "Product"} className="h-full w-full object-cover" />
                              ) : (
                                <Storefront sx={{ color: "#94a3b8" }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xl font-semibold text-slate-900">{product.brandName || "Untitled product"}</div>
                              <div className="mt-1 text-sm text-slate-500">{product.manufacturer || "Manufacturer not set"}</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <ConsoleBadge tone={getTone(product.statusActive)}>{String(product.statusActive || "active").toUpperCase()}</ConsoleBadge>
                                <ConsoleBadge tone={getExpiryTone(product.expiryDate)}>Exp {product.expiryDate ? formatDate(product.expiryDate) : "-"}</ConsoleBadge>
                                <ConsoleBadge tone="blue">{product.isOTC ? "OTC" : "RX"}</ConsoleBadge>
                                <ConsoleBadge tone="neutral">HSN {product.hsn || "-"}</ConsoleBadge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(product.sections || []).length ? (
                                  product.sections.map((sectionName) => <ConsoleBadge key={sectionName} tone="blue">{sectionName}</ConsoleBadge>)
                                ) : (
                                  <ConsoleBadge tone="amber">No section mapping</ConsoleBadge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={consoleTableCellClass}>
                            <div className="grid gap-1 text-sm">
                              <div className="text-slate-800 font-semibold">MRP {formatCurrency(product.mrp)}</div>
                              <div className="text-slate-600">PTR {formatCurrency(product.saleRatePTR || product.rateB2C)}</div>
                              <div className="text-slate-500">Manufacturer {formatCurrency(product.manufacturerRate || product.rateManufacturer)}</div>
                            </div>
                            <div className="mt-3 text-xs text-slate-500">Category {product.category?.title || "-"}</div>
                            <div className="mt-1 text-xs text-slate-500">Sub-category {product.subCategory?.title || "No sub-category"}</div>
                            <div className="mt-3 text-xs text-slate-500">Updated {formatDateTime(product.updatedAt || product.createdAt)}</div>
                          </div>

                          <div className="flex flex-wrap items-start justify-end gap-2">
                            <ProductQRCode product={product} compact />
                            <ConsoleButton variant="secondary" onClick={() => { setEditingProductId(product._id); setEditorOpen(true); }}>
                              <span className="inline-flex items-center gap-2"><Edit fontSize="small" />Edit</span>
                            </ConsoleButton>
                            <ConsoleButton variant="danger" onClick={() => deleteProduct(product._id)} disabled={deletingId === product._id}>
                              <span className="inline-flex items-center gap-2"><DeleteOutline fontSize="small" />{deletingId === product._id ? "Deleting..." : "Delete"}</span>
                            </ConsoleButton>
                            <ConsoleButton variant="secondary" onClick={() => setExpandedProductId((current) => (current === product._id ? "" : product._id))}>
                              <span className="inline-flex items-center gap-2">{expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}{expanded ? "Hide" : "Details"}</span>
                            </ConsoleButton>
                          </div>
                        </div>

                        {expanded ? (
                          <div className="mt-5 grid gap-4 xl:grid-cols-3">
                            <DetailBlock label="Generic Name" value={product.genericName || product.genericCompositions} />
                            <DetailBlock label="Package Type" value={product.packagingType || product.packageType} />
                            <DetailBlock label="Current Stock" value={formatNumber(product.totalStocks || product.stocks)} />
                            <DetailBlock label="Batch Number" value={product.batchNumber} />
                            <DetailBlock label="Product Weight" value={product.productWeight ? `${formatNumber(product.productWeight)} g` : "-"} />
                            <DetailBlock label="Country of Origin" value={product.countryOfOrigin} />
                            <DetailBlock label="B2C Discount" value={`${formatNumber(product.discountB2C || product.b2cDiscount)}%`} />
                            <DetailBlock label="B2B Discount" value={`${formatNumber(product.discountB2B || product.b2bDiscount)}%`} />
                            <DetailBlock label="Manufacturer Discount" value={`${formatNumber(product.discountManufacturer)}%`} />
                            <DetailBlock label="Marketer" value={product.marketerName} />
                            <DetailBlock label="Rating" value={`${Number(product.rating || product.productRating || 0).toFixed(1)} / 5`} />
                            <DetailBlock label="Last Updated" value={formatDateTime(product.updatedAt || product.createdAt)} />
                            <div className="xl:col-span-3 rounded-2xl border border-white/[0.06] bg-black/[0.02] px-4 py-4 text-sm leading-7 text-slate-300">
                              <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Descriptions</div>
                              <div>{product.shortDescription || product.moreInformation || product.fullDescription || product.description || "No description added."}</div>
                              {product.disclaimer ? <div className="mt-3 text-xs text-slate-500">Disclaimer: {product.disclaimer}</div> : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ConsoleEmptyState title="No products published yet" text="Add your first bulk-manufacturing product here. Once sections are assigned, the same products can surface on the public website." />
              )}
            </ConsolePanel>
          </>
        )}
      </div>

      <Dialog open={editorOpen} onClose={closeEditor} fullScreen fullWidth maxWidth="xl" className="franchise-console-dialog">
        <DialogContent dividers sx={{ p: 0, bgcolor: "#0f1115" }}>
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0f1115] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-amber-400">
                <Inventory2 fontSize="small" />
              </div>
              <div>
                <div className={consoleTableHeadClass}>Bulk Manufacturing Product Desk</div>
                <div className="text-sm font-semibold text-slate-100">{editingProductId ? "Edit catalog product" : "Add new catalog product"}</div>
              </div>
            </div>
            <IconButton onClick={closeEditor} sx={{ color: "#cbd5e1" }}><Close /></IconButton>
          </div>

          <AddProductForm
            editProductId={editingProductId}
            onSuccess={() => { closeEditor(); fetchProducts(); }}
            authTokenKey="bulkManufacturingToken"
            productSearchPath="/api/bulk-manufacturing-portal/products/search"
            getProductPath={(id) => `/api/bulk-manufacturing-portal/products/${id}`}
            createProductPath="/api/bulk-manufacturing-portal/products"
            updateProductPath={(id) => `/api/bulk-manufacturing-portal/products/${id}`}
            hideFranchiseZoneField
          />
        </DialogContent>
      </Dialog>
    </ConsolePage>
  );
}
