import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
import franchiseApi from "../franchiseApi";
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
} from "../components/consoleUi";

const getStatusTone = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "active") {
    return "green";
  }

  if (normalized === "blocked") {
    return "rose";
  }

  return "amber";
};

const buildParams = ({ search, section, status }) => {
  const params = {};

  if (search.trim()) {
    params.search = search.trim();
  }

  if (section !== "ALL") {
    params.section = section;
  }

  if (status !== "ALL") {
    params.status = status;
  }

  return params;
};

const getExpiryTone = (expiryDate) => {
  if (!expiryDate) {
    return "neutral";
  }

  const diffInDays = Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 0) {
    return "rose";
  }

  if (diffInDays <= 60) {
    return "amber";
  }

  return "green";
};

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-black/[0.02] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="rounded-[22px] border border-black/[0.07] bg-slate-50 p-4">
      <div className="mb-3 text-sm font-semibold text-gray-800">{title}</div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function ProductExpandedDetails({ product }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="grid gap-4 lg:grid-cols-3">
          <DetailSection title="Basic Information">
            <DetailItem label="Manufacturer" value={product.manufacturer} />
            <DetailItem
              label="Generic Name"
              value={product.genericName || product.genericCompositions}
            />
            <DetailItem
              label="Package Type"
              value={product.packagingType || product.packageType}
            />
            <DetailItem
              label="Product Weight"
              value={
                product.productWeight
                  ? `${formatNumber(product.productWeight)} g`
                  : "-"
              }
            />
            <DetailItem label="Country of Origin" value={product.countryOfOrigin} />
            <DetailItem label="OTC Type" value={product.isOTC ? "OTC" : "Prescription"} />
          </DetailSection>

          <DetailSection title="Pricing and Stock">
            <DetailItem label="MRP" value={formatCurrency(product.mrp)} />
            <DetailItem label="AMP" value={formatCurrency(product.amp)} />
            <DetailItem
              label="PTR / B2C Rate"
              value={formatCurrency(product.saleRatePTR || product.rateB2C)}
            />
            <DetailItem
              label="Wholesale Rate"
              value={formatCurrency(product.wholesaleSaleRate || product.rateWholesale)}
            />
            <DetailItem
              label="Hospital Rate"
              value={formatCurrency(product.hospitalSaleRate || product.rateHospital)}
            />
            <DetailItem
              label="Current Stock"
              value={formatNumber(product.totalStocks || product.stocks)}
            />
            <DetailItem
              label="B2C Discount"
              value={`${formatNumber(product.discountB2C || product.b2cDiscount)}%`}
            />
            <DetailItem
              label="B2B Discount"
              value={`${formatNumber(product.discountB2B || product.b2bDiscount)}%`}
            />
            <DetailItem
              label="Hospital Discount"
              value={`${formatNumber(product.discountHospital)}%`}
            />
          </DetailSection>

          <DetailSection title="Catalog and Visibility">
            <DetailItem label="Batch Number" value={product.batchNumber} />
            <DetailItem
              label="Expiry"
              value={product.expiryDate ? formatDate(product.expiryDate) : "-"}
            />
            <DetailItem label="HSN" value={product.hsn} />
            <DetailItem
              label="Rating"
              value={`${Number(product.rating || product.productRating || 0).toFixed(1)} / 5`}
            />
            <DetailItem
              label="Sections"
              value={product.sections?.length ? product.sections.join(", ") : "No section mapping"}
            />
            <DetailItem label="Marketer" value={product.marketerName} />
          </DetailSection>
        </div>

        <div className="grid gap-4">
          <DetailSection title="Product QR">
            <div className="rounded-2xl bg-white border border-black/[0.06] p-3">
              <ProductQRCode product={product} compact />
            </div>
            <div className="text-xs leading-6 text-slate-400">
              Same product QR utility as admin products. Scan or open the product page
              directly from the franchise console.
            </div>
          </DetailSection>

          <DetailSection title="Media and Merchandising">
            <div className="grid grid-cols-2 gap-3">
              {product.images?.length ? (
                product.images.slice(0, 4).map((image, index) => (
                  <div
                    key={`${product._id}-image-${index}`}
                    className="overflow-hidden rounded-2xl border border-black/[0.07] bg-black/[0.02]"
                  >
                    <img
                      src={image.url}
                      alt={`${product.brandName || "Product"} ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-black/[0.10] bg-black/[0.02] px-4 py-6 text-center text-sm text-slate-400">
                  No product images uploaded yet
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.offersWithIcon?.length ? (
                product.offersWithIcon.map((offer, index) => (
                  <ConsoleBadge
                    key={`${product._id}-offer-${index}`}
                    tone={offer.flashing ? "amber" : "blue"}
                  >
                    {offer.text}
                  </ConsoleBadge>
                ))
              ) : (
                <ConsoleBadge tone="neutral">No offers added</ConsoleBadge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.tags?.length ? (
                product.tags.map((tag) => (
                  <ConsoleBadge key={`${product._id}-${tag}`} tone="neutral">
                    {tag}
                  </ConsoleBadge>
                ))
              ) : (
                <ConsoleBadge tone="neutral">No tags</ConsoleBadge>
              )}
            </div>
          </DetailSection>
        </div>
      </div>

      {(product.shortDescription || product.fullDescription || product.disclaimer) && (
        <div className="grid gap-4 xl:grid-cols-3">
          <DetailSection title="Short Description">
            <div className="text-sm leading-6 text-gray-600">
              {product.shortDescription || product.moreInformation || "-"}
            </div>
          </DetailSection>
          <DetailSection title="Full Description">
            <div className="text-sm leading-6 text-gray-600">
              {product.fullDescription || product.description || "-"}
            </div>
          </DetailSection>
          <DetailSection title="Disclaimer and Notes">
            <div className="text-sm leading-6 text-gray-600">
              {product.disclaimer || "No disclaimer added"}
            </div>
            <div className="text-xs text-slate-400">
              Last updated {formatDateTime(product.updatedAt || product.createdAt)}
            </div>
          </DetailSection>
        </div>
      )}
    </div>
  );
}

export default function FranchiseProducts() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [expandedProductId, setExpandedProductId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const storedFranchiseUser = JSON.parse(
    localStorage.getItem("franchiseUser") || "{}",
  );

  const getFranchiseProductPath = useCallback(
    (id) => `/api/franchise/products/${id}`,
    [],
  );
  const updateFranchiseProductPath = useCallback(
    (id) => `/api/franchise/products/${id}`,
    [],
  );

  const fetchProducts = async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const response = await franchiseApi.get("/franchise/products", {
        params: buildParams(nextFilters),
      });

      setProducts(response.data.products || []);
      setSummary(response.data.summary || {});
      setAvailableSections(response.data.availableSections || []);
    } catch (err) {
      console.error("Franchise products fetch error", err);
      setError(err.response?.data?.message || "Unable to load franchise products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      if (storedFranchiseUser?.zoneId) {
        setEditingProductId(null);
        setEditorOpen(true);
      }
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.delete("create");
        return nextParams;
      });
    }
  }, [searchParams, setSearchParams, storedFranchiseUser?.zoneId]);

  const sectionSummary = useMemo(() => {
    const counts = new Map();

    products.forEach((product) => {
      if (Array.isArray(product.sections) && product.sections.length) {
        product.sections.forEach((sectionName) => {
          counts.set(sectionName, (counts.get(sectionName) || 0) + 1);
        });
      }
    });

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 8);
  }, [products]);

  const openCreate = () => {
    setEditingProductId(null);
    setEditorOpen(true);
  };

  const openEdit = (productId) => {
    setEditingProductId(productId);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingProductId(null);
  };

  const applyFilters = () => {
    fetchProducts(filters);
  };

  const resetFilters = () => {
    const nextFilters = {
      search: "",
      section: "ALL",
      status: "ALL",
    };
    setFilters(nextFilters);
    fetchProducts(nextFilters);
  };

  const toggleExpanded = (productId) => {
    setExpandedProductId((current) => (current === productId ? "" : productId));
  };

  const deleteProduct = async (productId) => {
    if (
      !window.confirm(
        "Delete this product from the franchise catalog? Product details will be removed from DB and its Cloudinary media will also be deleted.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(productId);
      await franchiseApi.delete(`/franchise/products/${productId}`);
      setExpandedProductId((current) => (current === productId ? "" : current));
      await fetchProducts();
    } catch (err) {
      console.error("Delete franchise product failed", err);
      window.alert(
        err.response?.data?.message || "Unable to delete this product right now.",
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <ConsolePage>
      <div className="grid gap-6">
        <ConsoleHeader
          title="Product Management"
          description="Manage your franchise-owned catalog, add products from the dashboard, edit them with the existing product form, and review the same business details that admin sees in the main product desk."
          badges={
            <>
              <ConsoleBadge tone="blue">
                {formatNumber(summary.totalProducts)} zone-owned products
              </ConsoleBadge>
              <ConsoleBadge tone="green">
                {formatNumber(summary.activeProducts)} active
              </ConsoleBadge>
              <ConsoleBadge tone="amber">
                {formatNumber(summary.totalSections)} sections covered
              </ConsoleBadge>
            </>
          }
          actions={
            <>
              <ConsoleButton
                onClick={openCreate}
                disabled={!storedFranchiseUser?.zoneId}
              >
                <span className="inline-flex items-center gap-2">
                  <Add fontSize="small" />
                  Add Product
                </span>
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={() => fetchProducts()}>
                <span className="inline-flex items-center gap-2">
                  <Refresh fontSize="small" />
                  Refresh
                </span>
              </ConsoleButton>
            </>
          }
        />

        {error ? <ConsoleNotice tone="error">{error}</ConsoleNotice> : null}
        {!storedFranchiseUser?.zoneId ? (
          <ConsoleNotice tone="warning">
            Your franchise account does not have an assigned zone yet. Product
            creation and listing will unlock once admin maps your franchise to a
            fulfilment zone.
          </ConsoleNotice>
        ) : null}

        {loading ? (
          <ConsoleLoading label="Loading franchise products..." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ConsoleMetricCard
                label="Total Products"
                primary={formatNumber(summary.totalProducts)}
                secondary="Products mapped to this franchise zone"
              />
              <ConsoleMetricCard
                label="Active Products"
                primary={formatNumber(summary.activeProducts)}
                secondary={`${formatNumber(summary.inactiveProducts)} inactive or hidden`}
              />
              <ConsoleMetricCard
                label="Tracked Sections"
                primary={formatNumber(summary.totalSections)}
                secondary={`${formatNumber(summary.unsectionedProducts)} products need section mapping`}
              />
              <ConsoleMetricCard
                label="Total Stock"
                primary={formatNumber(summary.totalStock)}
                secondary="Combined units across your franchise products"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_340px]">
              <ConsolePanel
                title="Catalog controls"
                subtitle="Filter by section, status, or search term before opening products"
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_220px_180px_auto_auto]">
                  <input
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                    placeholder="Search by name, manufacturer, generic composition, or HSN"
                    className={consoleInputClass}
                  />
                  <select
                    value={filters.section}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        section: event.target.value,
                      }))
                    }
                    className={consoleInputClass}
                  >
                    <option value="ALL">All sections</option>
                    {availableSections.map((sectionName) => (
                      <option key={sectionName} value={sectionName}>
                        {sectionName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className={consoleInputClass}
                  >
                    <option value="ALL">All status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                    <option value="pending">Pending</option>
                  </select>
                  <ConsoleButton variant="secondary" onClick={applyFilters}>
                    Apply
                  </ConsoleButton>
                  <ConsoleButton variant="secondary" onClick={resetFilters}>
                    Reset
                  </ConsoleButton>
                </div>
              </ConsolePanel>

              <ConsolePanel
                title="Section coverage"
                subtitle="Top sections currently feeding the storefront"
              >
                {sectionSummary.length ? (
                  <div className="grid gap-3">
                    {sectionSummary.map((entry) => (
                      <div
                        key={entry.name}
                        className="rounded-2xl border border-black/[0.07] bg-black/[0.02] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-800">
                            {entry.name}
                          </div>
                          <ConsoleBadge tone="blue">
                            {formatNumber(entry.count)} products
                          </ConsoleBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ConsoleEmptyState
                    title="No section mapping yet"
                    text="Assign sections while saving a product so it can render in the storefront sliders."
                  />
                )}
              </ConsolePanel>
            </div>

            <ConsolePanel
              title="Franchise catalog"
              subtitle="Same catalog details as AllProducts, now scoped to your franchise zone"
            >
              {products.length ? (
                <div className="overflow-x-auto">
                  <table className="franchise-console-table min-w-full">
                    <thead>
                      <tr>
                        {[
                          "Details",
                          "Product",
                          "Category",
                          "Pricing",
                          "Status",
                          "Stock",
                          "Updated",
                          "Actions",
                        ].map((header) => (
                          <th key={header} className={consoleTableHeadClass}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const expanded = expandedProductId === product._id;

                        return (
                          <React.Fragment key={product._id}>
                            <tr>
                              <td className={consoleTableCellClass}>
                                <ConsoleButton
                                  variant="secondary"
                                  onClick={() => toggleExpanded(product._id)}
                                  className="min-w-[108px]"
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {expanded ? (
                                      <ExpandLess fontSize="small" />
                                    ) : (
                                      <ExpandMore fontSize="small" />
                                    )}
                                    {expanded ? "Hide" : "Details"}
                                  </span>
                                </ConsoleButton>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="flex min-w-[290px] items-start gap-3">
                                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.07] bg-black/[0.03]">
                                    {product.images?.[0]?.url ? (
                                      <img
                                        src={product.images[0].url}
                                        alt={product.brandName || "Product"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Storefront sx={{ color: "#94a3b8" }} />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-gray-800">
                                      {product.brandName || "Untitled product"}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-400">
                                      {product.manufacturer || "Manufacturer not set"}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <ConsoleBadge tone="neutral">
                                        HSN {product.hsn || "-"}
                                      </ConsoleBadge>
                                      <ConsoleBadge tone={getExpiryTone(product.expiryDate)}>
                                        Exp {product.expiryDate ? formatDate(product.expiryDate) : "-"}
                                      </ConsoleBadge>
                                      <ConsoleBadge tone="blue">
                                        {product.isOTC ? "OTC" : "RX"}
                                      </ConsoleBadge>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="font-semibold text-gray-800">
                                  {product.category?.title || "-"}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {product.subCategory?.title || "No sub-category"}
                                </div>
                                <div className="mt-2 flex max-w-[280px] flex-wrap gap-2">
                                  {product.sections?.length ? (
                                    product.sections.map((sectionName) => (
                                      <ConsoleBadge key={sectionName} tone="blue">
                                        {sectionName}
                                      </ConsoleBadge>
                                    ))
                                  ) : (
                                    <ConsoleBadge tone="amber">No section</ConsoleBadge>
                                  )}
                                </div>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="grid gap-1 text-sm">
                                  <div className="text-gray-800">
                                    MRP {formatCurrency(product.mrp)}
                                  </div>
                                  <div className="text-slate-500">
                                    PTR {formatCurrency(product.saleRatePTR || product.rateB2C)}
                                  </div>
                                  <div className="text-slate-400">
                                    AMP {formatCurrency(product.amp)}
                                  </div>
                                </div>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="flex flex-col gap-2">
                                  <ConsoleBadge tone={getStatusTone(product.statusActive)}>
                                    {String(product.statusActive || "active").toUpperCase()}
                                  </ConsoleBadge>
                                  <ConsoleBadge tone="neutral">
                                    Rating {Number(product.rating || product.productRating || 0).toFixed(1)}
                                  </ConsoleBadge>
                                </div>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="console-mono font-semibold text-gray-800">
                                  {formatNumber(product.totalStocks || product.stocks)}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  Batch {product.batchNumber || "-"}
                                </div>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="text-sm text-slate-500">
                                  {formatDateTime(product.updatedAt || product.createdAt)}
                                </div>
                              </td>
                              <td className={consoleTableCellClass}>
                                <div className="flex flex-wrap gap-2">
                                  <ProductQRCode product={product} compact />
                                  <ConsoleButton
                                    variant="secondary"
                                    onClick={() => openEdit(product._id)}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Edit fontSize="small" />
                                      Edit
                                    </span>
                                  </ConsoleButton>
                                  <ConsoleButton
                                    variant="danger"
                                    onClick={() => deleteProduct(product._id)}
                                    disabled={deletingId === product._id}
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <DeleteOutline fontSize="small" />
                                      {deletingId === product._id ? "Deleting..." : "Delete"}
                                    </span>
                                  </ConsoleButton>
                                </div>
                              </td>
                            </tr>

                            {expanded ? (
                              <tr>
                                <td
                                  colSpan={8}
                                  className={`${consoleTableCellClass} bg-slate-50`}
                                >
                                  <ProductExpandedDetails product={product} />
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ConsoleEmptyState
                  title="No franchise products yet"
                  text="Add your first product here. Once sections are assigned, the same products can surface in the storefront sliders."
                />
              )}
            </ConsolePanel>
          </>
        )}
      </div>

      <Dialog
        open={editorOpen}
        onClose={closeEditor}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="xl"
        className="franchise-console-dialog"
      >
        <DialogContent dividers sx={{ p: 0, bgcolor: "#ffffff" }}>
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.08] bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/[0.08] bg-amber-50 text-amber-600">
                <Inventory2 fontSize="small" />
              </div>
              <div>
                <div className="console-mono text-xs uppercase tracking-[0.28em] text-slate-400">
                  Franchise Product Desk
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {editingProductId ? "Edit franchise product" : "Add new franchise product"}
                </div>
              </div>
            </div>
            <IconButton onClick={closeEditor} sx={{ color: "#64748b" }}>
              <Close />
            </IconButton>
          </div>

          <AddProductForm
            editProductId={editingProductId}
            onSuccess={() => {
              closeEditor();
              fetchProducts();
            }}
            authTokenKey="franchiseToken"
            productSearchPath="/api/franchise/products/search"
            getProductPath={getFranchiseProductPath}
            createProductPath="/api/franchise/products"
            updateProductPath={updateFranchiseProductPath}
            fixedFranchiseZoneId={storedFranchiseUser?.zoneId || ""}
            hideFranchiseZoneField
          />
        </DialogContent>
      </Dialog>
    </ConsolePage>
  );
}