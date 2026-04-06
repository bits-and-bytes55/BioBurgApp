import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { resolveApiUrl } from "../../../config/api";
import manufacturerAdminApi from "./manufacturerAdminApi";
import {
  AdminFranchiseBadge,
  AdminFranchiseButton,
  AdminFranchiseEmpty,
  AdminFranchiseHero,
  AdminFranchiseLoading,
  AdminFranchiseMetric,
  AdminFranchiseNotice,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
  adminTableSx,
  formatDate,
  formatDateTime,
  formatNumber,
} from "../../franchise/adminFranchiseUi";

const STATUS_QUERY_BY_MODE = {
  overview: "ALL",
  pending: "PENDING",
  approved: "APPROVED",
  all: "ALL",
  products: "ALL",
  documents: "ALL",
};

const ACTION_PAYLOADS = {
  approve: {
    applicationStatus: "APPROVED",
    documentReviewStatus: "VERIFIED",
    accountStatus: "ACTIVE",
  },
  under_review: {
    applicationStatus: "UNDER_REVIEW",
    documentReviewStatus: "UNDER_REVIEW",
    accountStatus: "PENDING_APPROVAL",
  },
  reject: {
    applicationStatus: "REJECTED",
    documentReviewStatus: "ISSUES_FOUND",
    accountStatus: "PENDING_APPROVAL",
  },
  block: {
    accountStatus: "BLOCKED",
  },
  activate: {
    applicationStatus: "APPROVED",
    documentReviewStatus: "VERIFIED",
    accountStatus: "ACTIVE",
  },
};

const DOCUMENT_LABELS = {
  productListFile: "Product Catalogue",
  licenseFile: "Manufacturing License",
  gmpCertFile: "WHO-GMP / GMP",
  isoCertFile: "ISO / FDA Certificate",
  qualityTestDocs: "Quality Test Documents",
};

const MODE_META = {
  overview: {
    eyebrow: "Super Admin Pharma Manufacturer Desk",
    title:
      "A cleaner command center for manufacturer onboarding, verification, and website product visibility.",
    description:
      "Track application movement, document readiness, account activation, and product publishing from a single premium workspace built for the super admin team.",
    searchLabel: "Search manufacturers",
    searchPlaceholder: "Company, email, username, contact",
  },
  pending: {
    eyebrow: "Pending Review Queue",
    title:
      "Review fresh pharma manufacturer applications before they move into the live partner network.",
    description:
      "Use this queue to validate business identity, document quality, and the first operational readiness signals for every pending manufacturer.",
    searchLabel: "Search pending applications",
    searchPlaceholder: "Company, email, username, contact",
  },
  approved: {
    eyebrow: "Approved Manufacturer Accounts",
    title:
      "Monitor approved manufacturers already eligible to publish products and receive website demand.",
    description:
      "This desk focuses on active and approved manufacturers so you can quickly inspect account standing, compliance, and product footprint.",
    searchLabel: "Search approved manufacturers",
    searchPlaceholder: "Company, email, username, contact",
  },
  all: {
    eyebrow: "Manufacturer Master Registry",
    title:
      "A full ledger of every pharma manufacturer account flowing through the BioBurg super admin system.",
    description:
      "Search the entire registry, review lifecycle state, inspect uploaded files, and take action without jumping between fragmented admin screens.",
    searchLabel: "Search manufacturers",
    searchPlaceholder: "Company, email, username, contact",
  },
  products: {
    eyebrow: "Manufacturer Product Intelligence",
    title:
      "Website products created by pharma manufacturers, with ownership and publishing context in one place.",
    description:
      "Audit what each approved manufacturer has pushed to the website, inspect catalog quality, and quickly spot weak section coverage or inactive inventory.",
    searchLabel: "Search products",
    searchPlaceholder: "Brand, manufacturer, generic name, HSN",
  },
  documents: {
    eyebrow: "Document Verification Desk",
    title:
      "Review uploaded manufacturer documents with a layout built for compliance and onboarding decisions.",
    description:
      "Open licenses, GMP certificates, product catalogues, and quality files from one workspace while keeping approval actions close at hand.",
    searchLabel: "Search document owners",
    searchPlaceholder: "Company, email, username, contact",
  },
};

const formatStatus = (value) =>
  String(value || "PENDING")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getBadgeTone = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (["APPROVED", "VERIFIED", "ACTIVE"].includes(normalized)) return "green";
  if (["REJECTED", "ISSUES_FOUND", "BLOCKED"].includes(normalized)) return "rose";
  if (normalized === "UNDER_REVIEW") return "blue";
  if (normalized === "PENDING" || normalized === "PENDING_APPROVAL") return "amber";
  return "neutral";
};

const getDocumentEntries = (manufacturer) =>
  Object.entries(manufacturer?.documents || {})
    .filter(([, file]) => Boolean(file?.url))
    .map(([key, file]) => ({
      key,
      label: DOCUMENT_LABELS[key] || key,
      file,
    }));

function SmallLabel({ children }) {
  return (
    <Typography
      sx={{
        color: "#8da0ad",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}

function DetailValue({ children }) {
  return (
    <Typography sx={{ mt: 0.8, color: "#edf3f7", fontWeight: 700, lineHeight: 1.7 }}>
      {children || "-"}
    </Typography>
  );
}

function SnapshotBlock({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.02)",
      }}
    >
      <SmallLabel>{label}</SmallLabel>
      <DetailValue>{value}</DetailValue>
    </Box>
  );
}

function DocumentButtons({ manufacturer }) {
  const documents = getDocumentEntries(manufacturer);

  if (!documents.length) {
    return (
      <Typography sx={{ color: "#8da0ad", lineHeight: 1.8 }}>
        No compliance documents uploaded yet.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {documents.map((doc) => (
        <AdminFranchiseButton
          key={`${manufacturer?._id}-${doc.key}`}
          variant="secondary"
          component="a"
          href={resolveApiUrl(doc.file.url)}
          target="_blank"
          rel="noreferrer"
          sx={{ minHeight: 38, px: 2 }}
        >
          {doc.label}
        </AdminFranchiseButton>
      ))}
    </Stack>
  );
}

function ManufacturerActionBar({ manufacturer, runAction, deleteManufacturer }) {
  if (!manufacturer) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <AdminFranchiseButton onClick={() => runAction("approve", manufacturer)}>
        Approve
      </AdminFranchiseButton>
      <AdminFranchiseButton
        variant="secondary"
        onClick={() => runAction("under_review", manufacturer)}
      >
        Under Review
      </AdminFranchiseButton>
      <AdminFranchiseButton
        variant="secondary"
        onClick={() => runAction("reject", manufacturer)}
      >
        Reject
      </AdminFranchiseButton>
      {manufacturer.accountStatus === "BLOCKED" ? (
        <AdminFranchiseButton
          variant="secondary"
          onClick={() => runAction("activate", manufacturer)}
        >
          Activate
        </AdminFranchiseButton>
      ) : (
        <AdminFranchiseButton
          variant="secondary"
          onClick={() => runAction("block", manufacturer)}
        >
          Block
        </AdminFranchiseButton>
      )}
      <AdminFranchiseButton
        variant="secondary"
        onClick={() => deleteManufacturer(manufacturer)}
        sx={{
          borderColor: "rgba(240,139,134,0.24)",
          color: "#ffd4d1",
          background: "rgba(240,139,134,0.08)",
          "&:hover": {
            borderColor: "rgba(240,139,134,0.34)",
            background: "rgba(240,139,134,0.14)",
          },
        }}
      >
        Delete
      </AdminFranchiseButton>
    </Stack>
  );
}

export default function ManufacturerAdminWorkspace({ mode = "overview" }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const meta = MODE_META[mode] || MODE_META.overview;

  const fetchManufacturers = async (nextSearch = search) => {
    try {
      setLoading(true);
      setError("");
      const response = await manufacturerAdminApi.get("/admin/manufacturers", {
        params: {
          status: STATUS_QUERY_BY_MODE[mode] || "ALL",
          search: nextSearch.trim() || undefined,
        },
      });

      const nextManufacturers = response.data || [];
      setManufacturers(nextManufacturers);
      setSelectedManufacturer((current) => {
        if (!nextManufacturers.length) return null;
        if (current?._id) {
          return (
            nextManufacturers.find((item) => item._id === current._id) ||
            nextManufacturers[0]
          );
        }
        return nextManufacturers[0];
      });
    } catch (workspaceError) {
      console.error("Manufacturer admin fetch error", workspaceError);
      setError(
        workspaceError.response?.data?.message ||
          "Unable to load pharma manufacturer workspace.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await manufacturerAdminApi.get("/admin/manufacturers/summary");
      setSummary(response.data.summary || null);
    } catch (summaryError) {
      console.error("Manufacturer summary fetch error", summaryError);
    }
  };

  const fetchProducts = async (nextSearch = productSearch) => {
    try {
      setProductsLoading(true);
      const response = await manufacturerAdminApi.get("/admin/manufacturers/products", {
        params: { search: nextSearch.trim() || undefined },
      });

      const nextProducts = response.data.products || [];
      setProducts(nextProducts);
      setSelectedProduct((current) => {
        if (!nextProducts.length) return null;
        if (current?._id) {
          return nextProducts.find((item) => item._id === current._id) || nextProducts[0];
        }
        return nextProducts[0];
      });
    } catch (productsError) {
      console.error("Manufacturer products fetch error", productsError);
      setError(
        productsError.response?.data?.message ||
          "Unable to load manufacturer products.",
      );
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setProductSearch("");
    setSelectedManufacturer(null);
    setSelectedProduct(null);
    fetchManufacturers("");
    fetchSummary();
    if (mode === "overview" || mode === "products") {
      fetchProducts("");
    } else {
      setProducts([]);
    }
  }, [mode]);

  const runAction = async (action, manufacturer) => {
    const payload = { ...(ACTION_PAYLOADS[action] || {}) };
    if (!manufacturer?._id) return;

    const notes = window.prompt(
      "Review note (optional):",
      manufacturer.reviewNotes || "",
    );
    if (notes === null) return;
    payload.reviewNotes = notes;

    if (action === "reject") {
      const reason = window.prompt(
        "Rejection reason is required:",
        manufacturer.rejectionReason || "",
      );
      if (!reason) return;
      payload.rejectionReason = reason;
    }

    try {
      await manufacturerAdminApi.patch(
        `/admin/manufacturers/${manufacturer._id}/status`,
        payload,
      );
      await Promise.all([
        fetchManufacturers(search),
        fetchSummary(),
        mode === "overview" || mode === "products" ? fetchProducts(productSearch) : Promise.resolve(),
      ]);
    } catch (actionError) {
      console.error("Manufacturer status action error", actionError);
      window.alert(
        actionError.response?.data?.message ||
          "Unable to update manufacturer status.",
      );
    }
  };

  const deleteManufacturer = async (manufacturer) => {
    if (
      !manufacturer?._id ||
      !window.confirm(
        `Delete ${manufacturer.companyName || "this manufacturer"} permanently?`,
      )
    ) {
      return;
    }

    try {
      await manufacturerAdminApi.delete(`/admin/manufacturers/${manufacturer._id}`);
      await Promise.all([fetchManufacturers(search), fetchSummary()]);
    } catch (deleteError) {
      console.error("Manufacturer delete error", deleteError);
      window.alert(
        deleteError.response?.data?.message || "Unable to delete manufacturer.",
      );
    }
  };

  const derivedSummary = useMemo(
    () => ({
      verifiedDocuments: manufacturers.filter(
        (item) => item.documentReviewStatus === "VERIFIED",
      ).length,
      documentIssues: manufacturers.filter(
        (item) => item.documentReviewStatus === "ISSUES_FOUND",
      ).length,
      activeAccounts: manufacturers.filter(
        (item) => item.accountStatus === "ACTIVE",
      ).length,
      blockedAccounts: manufacturers.filter(
        (item) => item.accountStatus === "BLOCKED",
      ).length,
      uniqueCompanyTypes: new Set(
        manufacturers.map((item) => item.companyType).filter(Boolean),
      ).size,
    }),
    [manufacturers],
  );

  const productSummary = useMemo(() => {
    const sectionSet = new Set();
    let activeProducts = 0;
    let inactiveProducts = 0;
    let totalStock = 0;

    products.forEach((product) => {
      if (String(product.statusActive || "").toLowerCase() === "active") {
        activeProducts += 1;
      } else {
        inactiveProducts += 1;
      }
      totalStock += Number(product.totalStocks || product.stocks || 0);
      (product.sections || []).forEach((sectionName) => {
        if (sectionName) sectionSet.add(sectionName);
      });
    });

    return {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts,
      totalStock,
      sectionCoverage: sectionSet.size,
    };
  }, [products]);

  const documentSummary = useMemo(() => {
    const manufacturersWithDocs = manufacturers.filter(
      (item) => getDocumentEntries(item).length > 0,
    );
    const totalDocuments = manufacturers.reduce(
      (sum, item) => sum + getDocumentEntries(item).length,
      0,
    );

    return {
      manufacturersWithDocs: manufacturersWithDocs.length,
      manufacturersMissingDocs: manufacturers.length - manufacturersWithDocs.length,
      totalDocuments,
    };
  }, [manufacturers]);

  const recentManufacturers = useMemo(() => manufacturers.slice(0, 5), [manufacturers]);
  const recentProducts = useMemo(() => products.slice(0, 6), [products]);

  const heroBadges =
    mode === "products"
      ? [
          <AdminFranchiseBadge key="products" tone="gold">
            {formatNumber(productSummary.totalProducts)} listed products
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="active" tone="green">
            {formatNumber(productSummary.activeProducts)} active
          </AdminFranchiseBadge>,
          <AdminFranchiseBadge key="sections" tone="blue">
            {formatNumber(productSummary.sectionCoverage)} sections
          </AdminFranchiseBadge>,
        ]
      : mode === "documents"
        ? [
            <AdminFranchiseBadge key="owners" tone="gold">
              {formatNumber(documentSummary.manufacturersWithDocs)} document-ready manufacturers
            </AdminFranchiseBadge>,
            <AdminFranchiseBadge key="files" tone="blue">
              {formatNumber(documentSummary.totalDocuments)} files
            </AdminFranchiseBadge>,
            <AdminFranchiseBadge key="issues" tone="rose">
              {formatNumber(derivedSummary.documentIssues)} flagged
            </AdminFranchiseBadge>,
          ]
        : [
            <AdminFranchiseBadge key="total" tone="gold">
              {formatNumber(summary?.totalManufacturers || manufacturers.length)} manufacturers
            </AdminFranchiseBadge>,
            <AdminFranchiseBadge key="approved" tone="green">
              {formatNumber(summary?.approved || 0)} approved
            </AdminFranchiseBadge>,
            <AdminFranchiseBadge key="products" tone="blue">
              {formatNumber(summary?.listedProducts || 0)} website products
            </AdminFranchiseBadge>,
          ];

  // ── renderManufacturerDetail ──────────────────────────────────────────────
  // Fixed: replaced <Grid item xs sm xl> with <Grid size={{ xs, sm }}>
  const renderManufacturerDetail = (manufacturer) => (
    <Stack spacing={2.2}>
      <Box>
        <Typography
          className="admin-display"
          sx={{ fontSize: { xs: 22, sm: 28 }, lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          {manufacturer.companyName}
        </Typography>
        <Typography sx={{ mt: 1.1, color: "#8da0ad", lineHeight: 1.8, wordBreak: "break-word" }}>
          {manufacturer.officialEmail} | {manufacturer.officialContact || manufacturer.personalMobile || "No phone"}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <AdminFranchiseBadge tone={getBadgeTone(manufacturer.applicationStatus)}>
          {formatStatus(manufacturer.applicationStatus)}
        </AdminFranchiseBadge>
        <AdminFranchiseBadge tone={getBadgeTone(manufacturer.documentReviewStatus)}>
          {formatStatus(manufacturer.documentReviewStatus)}
        </AdminFranchiseBadge>
        <AdminFranchiseBadge tone={getBadgeTone(manufacturer.accountStatus)}>
          {formatStatus(manufacturer.accountStatus)}
        </AdminFranchiseBadge>
      </Stack>

      <ManufacturerActionBar
        manufacturer={manufacturer}
        runAction={runAction}
        deleteManufacturer={deleteManufacturer}
      />

      {/* ✅ Fixed Grid — uses size prop, no item/xs/sm props */}
      <Grid container spacing={1.3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Portal username" value={manufacturer.username || "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Company type" value={manufacturer.companyType || "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Authorized person" value={manufacturer.authName || "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Authorized mobile" value={manufacturer.authMobile || "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Production capacity" value={manufacturer.productionCapacity || "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="MOQ" value={manufacturer.moq || "-"} />
        </Grid>
      </Grid>

      <Box>
        <SmallLabel>Capabilities</SmallLabel>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.2 }}>
          {(manufacturer.productTypes || []).length ? (
            manufacturer.productTypes.map((item) => (
              <AdminFranchiseBadge key={item} tone="gold">
                {item}
              </AdminFranchiseBadge>
            ))
          ) : (
            <Typography sx={{ color: "#8da0ad", lineHeight: 1.8 }}>
              No product capabilities declared in the onboarding form.
            </Typography>
          )}
        </Stack>
      </Box>

      <Box>
        <SmallLabel>Compliance documents</SmallLabel>
        <Box sx={{ mt: 1.3 }}>
          <DocumentButtons manufacturer={manufacturer} />
        </Box>
      </Box>

      {/* ✅ Fixed Grid */}
      <Grid container spacing={1.3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Bank name" value={manufacturer.bankName || "-"} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SnapshotBlock label="Payment method" value={manufacturer.paymentMethod || "-"} />
        </Grid>
      </Grid>

      {(manufacturer.reviewNotes || manufacturer.rejectionReason) ? (
        <AdminFranchiseNotice tone="info">
          {manufacturer.reviewNotes || "No review notes recorded."}
          {manufacturer.rejectionReason
            ? ` | Rejection reason: ${manufacturer.rejectionReason}`
            : ""}
        </AdminFranchiseNotice>
      ) : null}
    </Stack>
  );

  // ── renderOverview ────────────────────────────────────────────────────────
  // Fixed: all Grid children use size prop
  const renderOverview = () => (
    <>
      {/* ✅ Metrics row */}
      <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
        {[
          ["Total Manufacturers", formatNumber(summary?.totalManufacturers || manufacturers.length), "Complete registry of pharma manufacturer accounts"],
          ["Pending Queue", formatNumber(summary?.pending || 0), "Applications waiting for the first admin decision"],
          ["Approved Accounts", formatNumber(summary?.approved || 0), "Manufacturers eligible to publish products and receive demand"],
          ["Verified Docs", formatNumber(derivedSummary.verifiedDocuments), "Accounts with verified documentation sets"],
          ["Blocked Accounts", formatNumber(derivedSummary.blockedAccounts), "Partners currently blocked from portal access"],
          ["Listed Products", formatNumber(summary?.listedProducts || 0), "Website products owned by manufacturer accounts"],
        ].map(([label, value, helper], index) => (
          <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={label}>
            <AdminFranchiseMetric label={label} value={value} helper={helper} accent={index === 0} />
          </Grid>
        ))}
      </Grid>

      {/* ✅ Applications + Products panels */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <AdminFranchisePanel
            title="Latest application movement"
            subtitle="Fresh manufacturer applications entering the review pipeline."
            action={
              <AdminFranchiseButton variant="secondary" onClick={() => fetchManufacturers(search)}>
                Refresh queue
              </AdminFranchiseButton>
            }
          >
            {recentManufacturers.length ? (
              <Stack spacing={1.5}>
                {recentManufacturers.map((manufacturer) => (
                  <Box
                    key={manufacturer._id}
                    onClick={() => setSelectedManufacturer(manufacturer)}
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                      {manufacturer.companyName}
                    </Typography>
                    <Typography sx={{ mt: 0.7, color: "#8da0ad", lineHeight: 1.75, wordBreak: "break-word" }}>
                      {manufacturer.officialEmail} | {manufacturer.officialContact || manufacturer.personalMobile || "No phone"}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.3 }}>
                      <AdminFranchiseBadge tone={getBadgeTone(manufacturer.applicationStatus)}>
                        {formatStatus(manufacturer.applicationStatus)}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone={getBadgeTone(manufacturer.documentReviewStatus)}>
                        {formatStatus(manufacturer.documentReviewStatus)}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="neutral">
                        {formatDateTime(manufacturer.createdAt)}
                      </AdminFranchiseBadge>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <AdminFranchiseEmpty
                title="No applications yet"
                text="New pharma manufacturer registrations will appear here once applicants start submitting onboarding forms."
              />
            )}
          </AdminFranchisePanel>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <AdminFranchisePanel
            title="Recent product publishing"
            subtitle="The newest website products created under manufacturer ownership."
          >
            {productsLoading ? (
              <AdminFranchiseLoading label="Loading product pulse..." />
            ) : recentProducts.length ? (
              <Stack spacing={1.5}>
                {recentProducts.map((product) => (
                  <Box
                    key={product._id}
                    sx={{
                      p: 2.2,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                      {product.brandName || "Untitled product"}
                    </Typography>
                    <Typography sx={{ mt: 0.7, color: "#8da0ad", lineHeight: 1.75 }}>
                      {product.manufacturerAccountId?.companyName || "Unknown manufacturer"}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.3 }}>
                      <AdminFranchiseBadge tone={getBadgeTone(product.statusActive)}>
                        {formatStatus(product.statusActive)}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="blue">
                        {product.category?.title || "No category"}
                      </AdminFranchiseBadge>
                      <AdminFranchiseBadge tone="neutral">
                        {formatNumber(product.totalStocks || product.stocks)} units
                      </AdminFranchiseBadge>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <AdminFranchiseEmpty
                title="No manufacturer products yet"
                text="Website products published by approved manufacturers will surface here."
              />
            )}
          </AdminFranchisePanel>
        </Grid>
      </Grid>

      {/* ✅ Detail + Posture panels */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <AdminFranchisePanel
            title="Focused manufacturer profile"
            subtitle="Click any application from the left cards to inspect its full onboarding and compliance snapshot."
          >
            {selectedManufacturer ? renderManufacturerDetail(selectedManufacturer) : (
              <AdminFranchiseEmpty
                title="Select a manufacturer"
                text="Choose any manufacturer from the application list to inspect ownership, documents, banking snapshot, and lifecycle notes."
              />
            )}
          </AdminFranchisePanel>
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <AdminFranchisePanel
            title="Operational posture"
            subtitle="Fast signal on compliance health and partner account mix."
          >
            <Stack spacing={1.4}>
              <SnapshotBlock label="Verified documents" value={formatNumber(derivedSummary.verifiedDocuments)} />
              <SnapshotBlock label="Document issues" value={formatNumber(derivedSummary.documentIssues)} />
              <SnapshotBlock label="Active accounts" value={formatNumber(derivedSummary.activeAccounts)} />
              <SnapshotBlock label="Company type coverage" value={formatNumber(derivedSummary.uniqueCompanyTypes)} />
            </Stack>
          </AdminFranchisePanel>
        </Grid>
      </Grid>
    </>
  );

  // ── renderManufacturerBuckets (approved + all + pending) ──────────────────
  // Fixed: all Grid children use size prop, table gets horizontal scroll on mobile
  const renderManufacturerBuckets = () => (
    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
      {/* ✅ Main ledger panel — full width on mobile, 7.8/12 on xl */}
      <Grid size={{ xs: 12, xl: 7.8 }}>
        <AdminFranchisePanel
          title={meta.title}
          subtitle="Search the current bucket, inspect lifecycle states, and open the selected manufacturer in the adjacent review panel."
          action={
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <TextField
                size="small"
                label={meta.searchLabel}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={meta.searchPlaceholder}
                sx={{ ...adminFieldSx, minWidth: { xs: "100%", sm: 220, md: 280 } }}
              />
              <AdminFranchiseButton onClick={() => fetchManufacturers(search)}>
                Apply
              </AdminFranchiseButton>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  fetchManufacturers("");
                }}
              >
                Reset
              </AdminFranchiseButton>
            </Stack>
          }
        >
          {manufacturers.length ? (
            <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <Table sx={{ ...adminTableSx, minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Applied</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {manufacturers.map((manufacturer) => (
                    <TableRow
                      key={manufacturer._id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelectedManufacturer(manufacturer)}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                          {manufacturer.companyName}
                        </Typography>
                        <Typography sx={{ mt: 0.6, color: "#8da0ad", fontSize: 13 }}>
                          {manufacturer.companyType || "Type not declared"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: "#edf3f7", wordBreak: "break-word" }}>
                          {manufacturer.officialEmail}
                        </Typography>
                        <Typography sx={{ mt: 0.6, color: "#8da0ad", fontSize: 13 }}>
                          {manufacturer.officialContact || manufacturer.personalMobile || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={getBadgeTone(manufacturer.applicationStatus)}>
                          {formatStatus(manufacturer.applicationStatus)}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={getBadgeTone(manufacturer.documentReviewStatus)}>
                          {formatStatus(manufacturer.documentReviewStatus)}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={getBadgeTone(manufacturer.accountStatus)}>
                          {formatStatus(manufacturer.accountStatus)}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDate(manufacturer.createdAt)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                          <AdminFranchiseButton
                            variant="secondary"
                            sx={{ minHeight: 34, px: 1.8 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedManufacturer(manufacturer);
                            }}
                          >
                            View
                          </AdminFranchiseButton>
                          <AdminFranchiseButton
                            sx={{ minHeight: 34, px: 1.8 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (manufacturer.accountStatus === "ACTIVE") {
                                runAction("block", manufacturer);
                              } else {
                                runAction("approve", manufacturer);
                              }
                            }}
                          >
                            {manufacturer.accountStatus === "ACTIVE" ? "Block" : "Approve"}
                          </AdminFranchiseButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <AdminFranchiseEmpty
              title="No manufacturers found"
              text="This bucket is currently empty for the applied search and status scope."
            />
          )}
        </AdminFranchisePanel>
      </Grid>

      {/* ✅ Detail panel — full width on mobile, 4.2/12 on xl */}
      <Grid size={{ xs: 12, xl: 4.2 }}>
        <AdminFranchisePanel
          title="Selected manufacturer"
          subtitle="Full review sheet for the manufacturer you open from the ledger."
        >
          {selectedManufacturer ? renderManufacturerDetail(selectedManufacturer) : (
            <AdminFranchiseEmpty
              title="No manufacturer selected"
              text="Choose a row from the table to review documents, application data, and access controls."
            />
          )}
        </AdminFranchisePanel>
      </Grid>
    </Grid>
  );

  // ── renderProductsDesk ────────────────────────────────────────────────────
  // Fixed: all Grid children use size prop
  const renderProductsDesk = () => (
    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2.2}>
          {[
            ["Listed Products", formatNumber(productSummary.totalProducts), "Products created by manufacturer accounts"],
            ["Active Products", formatNumber(productSummary.activeProducts), "Currently visible and usable website products"],
            ["Inactive Products", formatNumber(productSummary.inactiveProducts), "Draft, blocked, or inactive website products"],
            ["Section Coverage", formatNumber(productSummary.sectionCoverage), "Unique website sections reached by manufacturer products"],
            ["Tracked Stock", formatNumber(productSummary.totalStock), "Combined stock visible across owned products"],
            ["Registry Products", formatNumber(summary?.listedProducts || 0), "Products counted from admin manufacturer summary"],
          ].map(([label, value, helper], index) => (
            <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={label}>
              <AdminFranchiseMetric label={label} value={value} helper={helper} accent={index === 0} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, xl: 7.6 }}>
        <AdminFranchisePanel
          title="Manufacturer-owned product ledger"
          subtitle="Search the published catalog and open any product for ownership context and listing quality review."
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                size="small"
                label={meta.searchLabel}
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder={meta.searchPlaceholder}
                sx={{ ...adminFieldSx, minWidth: { xs: "100%", sm: 220, md: 280 } }}
              />
              <AdminFranchiseButton onClick={() => fetchProducts(productSearch)}>Apply</AdminFranchiseButton>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => { setProductSearch(""); fetchProducts(""); }}
              >
                Reset
              </AdminFranchiseButton>
            </Stack>
          }
        >
          {productsLoading ? (
            <AdminFranchiseLoading label="Loading manufacturer product ledger..." />
          ) : products.length ? (
            <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <Table sx={{ ...adminTableSx, minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Sections</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>MRP</TableCell>
                    <TableCell>Status</TableCell>
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
                        <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                          {product.brandName || "-"}
                        </Typography>
                        <Typography sx={{ mt: 0.6, color: "#8da0ad", fontSize: 13 }}>
                          {product.manufacturer || "Manufacturer not declared"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                          {product.manufacturerAccountId?.companyName || "-"}
                        </Typography>
                        <Typography sx={{ mt: 0.6, color: "#8da0ad", fontSize: 13, wordBreak: "break-word" }}>
                          {product.manufacturerAccountId?.officialEmail || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.category?.title || "-"}</TableCell>
                      <TableCell>
                        {(product.sections || []).length ? product.sections.join(", ") : "No section"}
                      </TableCell>
                      <TableCell>{formatNumber(product.totalStocks || product.stocks)}</TableCell>
                      <TableCell>{formatNumber(product.mrp)}</TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={getBadgeTone(product.statusActive)}>
                          {formatStatus(product.statusActive)}
                        </AdminFranchiseBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <AdminFranchiseEmpty
              title="No manufacturer-owned products found"
              text="Products created by approved manufacturers will appear here once they start listing to the website."
            />
          )}
        </AdminFranchisePanel>
      </Grid>

      <Grid size={{ xs: 12, xl: 4.4 }}>
        <AdminFranchisePanel
          title="Focused product profile"
          subtitle="Ownership, sections, stock, and publishing context for the selected product."
        >
          {selectedProduct ? (
            <Stack spacing={2}>
              <Box>
                <Typography
                  className="admin-display"
                  sx={{ fontSize: { xs: 20, sm: 24 }, lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 700 }}
                >
                  {selectedProduct.brandName || "Untitled product"}
                </Typography>
                <Typography sx={{ mt: 1, color: "#8da0ad", lineHeight: 1.8 }}>
                  {selectedProduct.manufacturer || "Manufacturer not declared"}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <AdminFranchiseBadge tone="blue">
                  {selectedProduct.category?.title || "No category"}
                </AdminFranchiseBadge>
                <AdminFranchiseBadge tone={getBadgeTone(selectedProduct.statusActive)}>
                  {formatStatus(selectedProduct.statusActive)}
                </AdminFranchiseBadge>
                <AdminFranchiseBadge tone="neutral">
                  {formatNumber(selectedProduct.totalStocks || selectedProduct.stocks)} units
                </AdminFranchiseBadge>
              </Stack>

              {/* ✅ Fixed Grid */}
              <Grid container spacing={1.3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <SnapshotBlock label="Owner company" value={selectedProduct.manufacturerAccountId?.companyName || "-"} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <SnapshotBlock label="Owner email" value={selectedProduct.manufacturerAccountId?.officialEmail || "-"} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <SnapshotBlock label="MRP" value={formatNumber(selectedProduct.mrp)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <SnapshotBlock label="Updated" value={formatDate(selectedProduct.updatedAt || selectedProduct.createdAt)} />
                </Grid>
              </Grid>

              <Box>
                <SmallLabel>Website sections</SmallLabel>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.3 }}>
                  {(selectedProduct.sections || []).length ? (
                    selectedProduct.sections.map((sectionName) => (
                      <AdminFranchiseBadge key={sectionName} tone="gold">
                        {sectionName}
                      </AdminFranchiseBadge>
                    ))
                  ) : (
                    <Typography sx={{ color: "#8da0ad", lineHeight: 1.8 }}>
                      No section mapping has been assigned yet.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <AdminFranchiseEmpty
              title="Select a product"
              text="Open any product row from the ledger to inspect its owner, section mapping, and catalog snapshot."
            />
          )}
        </AdminFranchisePanel>
      </Grid>
    </Grid>
  );

  // ── renderDocumentsDesk ───────────────────────────────────────────────────
  // Fixed: all Grid children use size prop
  const renderDocumentsDesk = () => (
    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2.2}>
          {[
            ["Manufacturers With Docs", formatNumber(documentSummary.manufacturersWithDocs), "Accounts that have uploaded at least one compliance file"],
            ["Missing Document Sets", formatNumber(documentSummary.manufacturersMissingDocs), "Manufacturers still missing their core onboarding files"],
            ["Total Uploaded Files", formatNumber(documentSummary.totalDocuments), "Combined files currently available for verification"],
            ["Verified Reviews", formatNumber(derivedSummary.verifiedDocuments), "Document sets already verified by admin"],
            ["Issue Flags", formatNumber(derivedSummary.documentIssues), "Profiles currently carrying document issue flags"],
            ["Under Review", formatNumber(summary?.underReview || 0), "Applications actively in human review workflow"],
          ].map(([label, value, helper], index) => (
            <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={label}>
              <AdminFranchiseMetric label={label} value={value} helper={helper} accent={index === 0} />
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, xl: 7.4 }}>
        <AdminFranchisePanel
          title="Document owner ledger"
          subtitle="Open a manufacturer to inspect every uploaded file and take review actions from the same screen."
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                size="small"
                label={meta.searchLabel}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={meta.searchPlaceholder}
                sx={{ ...adminFieldSx, minWidth: { xs: "100%", sm: 220, md: 280 } }}
              />
              <AdminFranchiseButton onClick={() => fetchManufacturers(search)}>Apply</AdminFranchiseButton>
              <AdminFranchiseButton
                variant="secondary"
                onClick={() => { setSearch(""); fetchManufacturers(""); }}
              >
                Reset
              </AdminFranchiseButton>
            </Stack>
          }
        >
          {manufacturers.length ? (
            <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <Table sx={{ ...adminTableSx, minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Uploaded Files</TableCell>
                    <TableCell>Doc Review</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {manufacturers.map((manufacturer) => {
                    const docs = getDocumentEntries(manufacturer);
                    return (
                      <TableRow
                        key={manufacturer._id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => setSelectedManufacturer(manufacturer)}
                      >
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                            {manufacturer.companyName}
                          </Typography>
                          <Typography sx={{ mt: 0.6, color: "#8da0ad", fontSize: 13, wordBreak: "break-word" }}>
                            {manufacturer.officialEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <AdminFranchiseBadge tone={docs.length ? "blue" : "amber"}>
                            {formatNumber(docs.length)} files
                          </AdminFranchiseBadge>
                        </TableCell>
                        <TableCell>
                          <AdminFranchiseBadge tone={getBadgeTone(manufacturer.documentReviewStatus)}>
                            {formatStatus(manufacturer.documentReviewStatus)}
                          </AdminFranchiseBadge>
                        </TableCell>
                        <TableCell>
                          <AdminFranchiseBadge tone={getBadgeTone(manufacturer.applicationStatus)}>
                            {formatStatus(manufacturer.applicationStatus)}
                          </AdminFranchiseBadge>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(manufacturer.updatedAt || manufacturer.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <AdminFranchiseButton
                            variant="secondary"
                            sx={{ minHeight: 34, px: 1.8 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedManufacturer(manufacturer);
                            }}
                          >
                            Inspect
                          </AdminFranchiseButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <AdminFranchiseEmpty
              title="No document owners found"
              text="Uploaded manufacturer documents will appear here once partners begin submitting onboarding files."
            />
          )}
        </AdminFranchisePanel>
      </Grid>

      <Grid size={{ xs: 12, xl: 4.6 }}>
        <AdminFranchisePanel
          title="Verification focus panel"
          subtitle="Detailed compliance sheet for the manufacturer selected from the document ledger."
        >
          {selectedManufacturer ? renderManufacturerDetail(selectedManufacturer) : (
            <AdminFranchiseEmpty
              title="Select a manufacturer"
              text="Choose any row from the document ledger to open its compliance files and review actions."
            />
          )}
        </AdminFranchisePanel>
      </Grid>
    </Grid>
  );

  if (loading && mode !== "products") {
    return <AdminFranchiseLoading label="Loading pharma manufacturer desk..." />;
  }

  return (
    <AdminFranchisePage>
      <AdminFranchiseHero
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        actions={
          <AdminFranchiseButton
            variant="secondary"
            onClick={() => {
              fetchManufacturers(search);
              fetchSummary();
              if (mode === "overview" || mode === "products") {
                fetchProducts(productSearch);
              }
            }}
          >
            Refresh workspace
          </AdminFranchiseButton>
        }
        badges={heroBadges}
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice>
        </Box>
      ) : null}

      {mode === "overview"
        ? renderOverview()
        : mode === "products"
          ? renderProductsDesk()
          : mode === "documents"
            ? renderDocumentsDesk()
            : renderManufacturerBuckets()}
    </AdminFranchisePage>
  );
}