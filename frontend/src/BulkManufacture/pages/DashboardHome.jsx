import React, { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import bulkManufacturingApi from "../bulkManufactureApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleMetricCard,
  ConsoleNotice,
  ConsolePanel,
  formatDate,
} from "../../Franchise/components/consoleUi";

const getTone = (value) => {
  if (["APPROVED", "VERIFIED", "ACTIVE"].includes(value)) return "green";
  if (["REJECTED", "ISSUES_FOUND", "BLOCKED"].includes(value)) return "rose";
  if (["QUOTED", "UNDER_REVIEW"].includes(value)) return "blue";
  return "amber";
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await bulkManufacturingApi.get("/bulk-manufacturing-portal/dashboard");
      setData(response.data);
    } catch (dashboardError) {
      console.error("Bulk manufacturing dashboard load error:", dashboardError);
      setError(
        dashboardError.response?.data?.message ||
          "Unable to load your dashboard right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return <ConsoleLoading label="Loading bulk manufacturing workspace..." />;
  }

  const summary = data?.summary || {};
  const application = data?.application || null;
  const recentRequirements = data?.recentRequirements || [];

  return (
    <Box>
      <ConsoleHeader
        eyebrow="Bulk Manufacturing Partner"
        title="A cleaner operations view for your manufacturing requirements."
        description="Track approval status, compliance review, and requirement progress without leaving the partner workspace."
        actions={
          <>
            <ConsoleButton onClick={() => navigate("/bulk-manufacturing/products?create=1")}>
              Add product
            </ConsoleButton>
            <ConsoleButton variant="secondary" onClick={() => navigate("/bulk-manufacturing/products")}>
              All products
            </ConsoleButton>
            <ConsoleButton variant="secondary" onClick={() => navigate("/bulk-manufacturing/orders")}>
              View orders
            </ConsoleButton>
            <ConsoleButton variant="secondary" onClick={fetchDashboard}>
              Refresh dashboard
            </ConsoleButton>
          </>
        }
        badges={[
          <ConsoleBadge key="company" tone="amber">
            {data?.company?.companyName || "No company name"}
          </ConsoleBadge>,
          <ConsoleBadge key="status" tone={getTone(summary.applicationStatus)}>
            Application {summary.applicationStatus || "PENDING"}
          </ConsoleBadge>,
          <ConsoleBadge key="docs" tone={getTone(summary.documentReviewStatus)}>
            Documents {summary.documentReviewStatus || "PENDING"}
          </ConsoleBadge>,
        ]}
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <ConsoleNotice tone="error">{error}</ConsoleNotice>
        </Box>
      ) : null}

      {/* ── Metric Cards: 4-per-row grid ── */}
      <Grid
        container
        spacing={2}
        sx={{ mt: 0.5 }}
        alignItems="stretch"
      >
        {[
          {
            label: "Requirements",
            primary: summary.totalRequirements || 0,
            secondary: "Total manufacturing requests raised from your portal",
            accent: true,
          },
          {
            label: "Open Review",
            primary: summary.submittedRequirements || 0,
            secondary: "Requirements waiting for admin review or revision",
          },
          {
            label: "Quoted",
            primary: summary.quotedRequirements || 0,
            secondary: "Requirements with active commercial quote details",
          },
          {
            label: "Documents Uploaded",
            primary: summary.uploadedDocuments || 0,
            secondary: "Application and compliance files currently on record",
          },
          {
            label: "Website Products",
            primary: summary.totalProducts || 0,
            secondary: `${summary.activeProducts || 0} active and visible for storefront use`,
          },
          {
            label: "Section Coverage",
            primary: summary.totalSections || 0,
            secondary: `${summary.totalProductStock || 0} units currently mapped to your product desk`,
          },
          {
            label: "Website Orders",
            primary: summary.totalWebsiteOrders || 0,
            secondary: `${summary.openWebsiteOrders || 0} open leads currently awaiting movement`,
          },
          {
            label: "Order Revenue",
            primary: summary.totalOrderRevenue || 0,
            secondary: `${summary.deliveredWebsiteOrders || 0} delivered orders linked to your catalog`,
          },
        ].map((card) => (
          <Grid
            key={card.label}
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            sx={{ display: "flex" }}
          >
            <ConsoleMetricCard
              label={card.label}
              primary={card.primary}
              secondary={card.secondary}
              accent={card.accent}
              className="w-full"
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Application Status + Partner Snapshot ── */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} xl={7}>
          <ConsolePanel
            title="Application Status"
            subtitle="Current review state of your onboarding request and partner account."
          >
            {application ? (
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`Application ${application.status}`}
                    color={
                      application.status === "APPROVED"
                        ? "success"
                        : application.status === "REJECTED"
                          ? "error"
                          : "warning"
                    }
                    variant="outlined"
                  />
                  <Chip
                    label={`Documents ${application.documentReviewStatus}`}
                    color={
                      application.documentReviewStatus === "VERIFIED"
                        ? "success"
                        : application.documentReviewStatus === "ISSUES_FOUND"
                          ? "error"
                          : "warning"
                    }
                    variant="outlined"
                  />
                  <Chip
                    label={`Submitted ${formatDate(application.createdAt)}`}
                    variant="outlined"
                  />
                </Stack>

                {application.reviewNotes ? (
                  <ConsoleNotice tone="info">
                    Admin review note: {application.reviewNotes}
                  </ConsoleNotice>
                ) : null}
                {application.documentReviewNotes ? (
                  <ConsoleNotice tone="warning">
                    Document review note: {application.documentReviewNotes}
                  </ConsoleNotice>
                ) : null}
                {application.rejectionReason ? (
                  <ConsoleNotice tone="error">
                    Rejection reason: {application.rejectionReason}
                  </ConsoleNotice>
                ) : null}
              </Stack>
            ) : (
              <ConsoleEmptyState
                title="Application details are not available yet."
                text="Once your partner application is linked, the latest review state will appear here."
              />
            )}
          </ConsolePanel>
        </Grid>

        <Grid item xs={12} xl={5}>
          <ConsolePanel
            title="Partner Snapshot"
            subtitle="Core company and account details visible to the admin team."
          >
            <Stack spacing={0}>
              {[
                ["Company", data?.company?.companyName || "-"],
                ["Contact", data?.company?.contactName || "-"],
                ["Email", data?.company?.email || "-"],
                ["Portal ID", data?.company?.username || "-"],
                ["Country", data?.company?.country || "-"],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    py: 1.25,
                    borderBottom: "1px solid rgba(0,0,0,0.07)",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ color: "#1e293b", fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </ConsolePanel>
        </Grid>
      </Grid>

      {/* ── All Website Products ── */}
      <Box sx={{ mt: 2.5 }}>
        <ConsolePanel
          title="All Website Products"
          subtitle="Products created from this desk can be section-mapped and rendered on the public website like the main homepage sliders."
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <ConsoleButton onClick={() => navigate("/bulk-manufacturing/products")}>
                Open all products
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={() => navigate("/bulk-manufacturing/products?create=1")}>
                Add new product
              </ConsoleButton>
            </Stack>
          }
        >
          {data?.recentProducts?.length ? (
            <Stack spacing={1.25}>
              {data.recentProducts.map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    p: 1.75,
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.07)",
                    bgcolor: "#f8fafc",
                    transition: "all .15s ease",
                    "&:hover": { bgcolor: "#f1f5f9", borderColor: "rgba(0,0,0,0.10)" },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: 13.5 }}>
                      {item.brandName || "Untitled product"}
                    </Typography>
                    <Typography sx={{ mt: 0.4, color: "#64748b", fontSize: 12.5 }}>
                      {item.manufacturer || "Manufacturer not set"}
                      {Array.isArray(item.sections) && item.sections.length
                        ? ` • ${item.sections.join(", ")}`
                        : " • No section mapping"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap flexShrink={0}>
                    <ConsoleBadge tone={getTone(item.statusActive || "PENDING")}>
                      {String(item.statusActive || "active").toUpperCase()}
                    </ConsoleBadge>
                    <ConsoleBadge tone="blue">
                      Stock {item.totalStocks || item.stocks || 0}
                    </ConsoleBadge>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <ConsoleEmptyState
              title="No products published yet"
              text="Use the new product desk to create bulk-manufacturer-owned products and map them to storefront sections."
            />
          )}
        </ConsolePanel>
      </Box>

      {/* ── Website Orders & Leads ── */}
      <Box sx={{ mt: 2.5 }}>
        <ConsolePanel
          title="Website Orders & Leads"
          subtitle="Incoming website demand owned by your bulk-manufacturing catalog appears here once customers order your products."
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <ConsoleButton onClick={() => navigate("/bulk-manufacturing/orders")}>
                Open orders desk
              </ConsoleButton>
            </Stack>
          }
        >
          {data?.recentOrders?.length ? (
            <Stack spacing={1.25}>
              {data.recentOrders.map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    p: 1.75,
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.07)",
                    bgcolor: "#f8fafc",
                    transition: "all .15s ease",
                    "&:hover": { bgcolor: "#f1f5f9", borderColor: "rgba(0,0,0,0.10)" },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: 13.5 }}>
                      {item.orderId || item.invoiceNumber || item._id?.slice?.(-8)?.toUpperCase?.() || "Order"}
                    </Typography>
                    <Typography sx={{ mt: 0.4, color: "#64748b", fontSize: 12.5 }}>
                      {item.address?.fullName || "Customer"}
                      {` • ${item.paymentMode || "NA"} • ${item.items?.length || 0} item(s) • ${formatDate(item.createdAt)}`}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap flexShrink={0}>
                    <ConsoleBadge tone={getTone(item.orderStatus)}>
                      {item.orderStatus}
                    </ConsoleBadge>
                    <ConsoleBadge tone={item.paymentStatus === "PAID" ? "green" : "amber"}>
                      {item.paymentStatus || "PENDING"}
                    </ConsoleBadge>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <ConsoleEmptyState
              title="No owned website orders yet"
              text="Once customers place orders for your bulk-manufacturing-owned products, they will appear here and inside the orders desk."
            />
          )}
        </ConsolePanel>
      </Box>

      {/* ── Recent Requirements ── */}
      <Box sx={{ mt: 2.5 }}>
        <ConsolePanel
          title="Recent Requirements"
          subtitle="Latest manufacturing requirements raised from your workspace."
        >
          {recentRequirements.length === 0 ? (
            <ConsoleEmptyState
              title="No requirements yet"
              text="Create your first product requirement from the Requirements page to start the manufacturing workflow."
            />
          ) : (
            <Stack spacing={1.25}>
              {recentRequirements.map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    p: 1.75,
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.07)",
                    bgcolor: "#f8fafc",
                    transition: "all .15s ease",
                    "&:hover": { bgcolor: "#f1f5f9", borderColor: "rgba(0,0,0,0.10)" },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: 13.5 }}>
                      {item.productName}
                    </Typography>
                    <Typography sx={{ mt: 0.4, color: "#64748b", fontSize: 12.5 }}>
                      Qty {item.quantity} • Priority {item.priority} • Created {formatDate(item.createdAt)}
                    </Typography>
                  </Box>
                  <ConsoleBadge tone={getTone(item.status)}>{item.status}</ConsoleBadge>
                </Box>
              ))}
            </Stack>
          )}
        </ConsolePanel>
      </Box>
    </Box>
  );
}