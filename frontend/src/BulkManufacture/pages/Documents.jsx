import React, { useEffect, useState } from "react";
import { Box, Grid, Link, Stack, Typography } from "@mui/material";
import bulkManufacturingApi from "../bulkManufactureApi";
import {
  ConsoleBadge,
  ConsoleEmptyState,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleNotice,
  ConsolePanel,
  formatDateTime,
} from "../../Franchise/components/consoleUi";

const getTone = (value) => {
  if (["APPROVED", "VERIFIED"].includes(value)) return "green";
  if (["REJECTED", "ISSUES_FOUND"].includes(value)) return "rose";
  return "amber";
};

export default function Documents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await bulkManufacturingApi.get(
        "/bulk-manufacturing-portal/documents",
      );
      setData(response.data);
    } catch (documentsError) {
      console.error("Bulk documents fetch error:", documentsError);
      setError(
        documentsError.response?.data?.message ||
          "Unable to load document center.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading) {
    return <ConsoleLoading label="Loading documents center..." />;
  }

  return (
    <Box>
      <ConsoleHeader
        eyebrow="Documents Center"
        title="All uploaded compliance and onboarding files in one place."
        description="Review document verification state, admin notes, and the exact files linked to your bulk manufacturing application."
        actions={null}
        badges={[
          <ConsoleBadge key="docStatus" tone={getTone(data?.review?.status)}>
            Documents {data?.review?.status || "PENDING"}
          </ConsoleBadge>,
          <ConsoleBadge key="appStatus" tone={getTone(data?.application?.status)}>
            Application {data?.application?.status || "PENDING"}
          </ConsoleBadge>,
        ]}
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <ConsoleNotice tone="error">{error}</ConsoleNotice>
        </Box>
      ) : null}

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {/* ── Uploaded Files ── */}
        <Grid item xs={12} lg={7}>
          <ConsolePanel
            title="Uploaded Files"
            subtitle="These files were submitted during your onboarding request."
          >
            {data?.documents?.length ? (
              <Grid container spacing={2}>
                {data.documents.map((document) => (
                  <Grid item xs={12} md={6} key={document.key}>
                    <Box
                      sx={{
                        p: 2,
                        height: "100%",
                        borderRadius: 3,
                        border: "1px solid rgba(0,0,0,0.08)",
                        bgcolor: "#f8fafc",
                        transition: "all .15s ease",
                        "&:hover": {
                          borderColor: "rgba(0,0,0,0.12)",
                          bgcolor: "#f1f5f9",
                        },
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                        {document.label}
                      </Typography>
                      <Typography sx={{ mt: 0.75, color: "#64748b", lineHeight: 1.7, fontSize: 13 }}>
                        Uploaded as part of the application intake workflow.
                      </Typography>
                      <Link
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        underline="hover"
                        sx={{
                          mt: 1.5,
                          display: "inline-flex",
                          color: "#b45309",
                          fontWeight: 700,
                          fontSize: 13,
                          "&:hover": { color: "#92400e" },
                        }}
                      >
                        Open document ↗
                      </Link>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <ConsoleEmptyState
                title="No uploaded documents"
                text="No onboarding document files are currently linked to your request."
              />
            )}
          </ConsolePanel>
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={2.5}>
            {/* Verification Snapshot */}
            <ConsolePanel
              title="Verification Snapshot"
              subtitle="Admin-side review notes and current compliance state."
            >
              <Stack spacing={1.25}>
                <ConsoleNotice
                  tone={
                    data?.review?.status === "VERIFIED"
                      ? "success"
                      : data?.review?.status === "ISSUES_FOUND"
                        ? "error"
                        : "warning"
                  }
                >
                  Document review status: {data?.review?.status || "PENDING"}
                </ConsoleNotice>
                {data?.review?.notes ? (
                  <ConsoleNotice tone="info">{data.review.notes}</ConsoleNotice>
                ) : (
                  <Typography sx={{ color: "#64748b", lineHeight: 1.8, fontSize: 13.5 }}>
                    No additional verification note has been added yet.
                  </Typography>
                )}
              </Stack>
            </ConsolePanel>

            {/* Application History */}
            <ConsolePanel
              title="Application History"
              subtitle="Latest milestones recorded on your application."
            >
              {data?.history?.length ? (
                <Stack spacing={1.25}>
                  {data.history
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <Box
                        key={`${item.status}-${index}`}
                        sx={{
                          p: 1.75,
                          borderRadius: 3,
                          border: "1px solid rgba(0,0,0,0.08)",
                          bgcolor: "#f8fafc",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <ConsoleBadge tone={getTone(item.status)}>
                            {item.status}
                          </ConsoleBadge>
                          <Typography sx={{ color: "#64748b", fontSize: 12.5 }}>
                            {formatDateTime(item.changedAt)}
                          </Typography>
                        </Stack>
                        {item.note ? (
                          <Typography sx={{ mt: 1, color: "#1e293b", lineHeight: 1.8, fontSize: 13.5 }}>
                            {item.note}
                          </Typography>
                        ) : null}
                        {item.actor ? (
                          <Typography sx={{ mt: 0.75, color: "#64748b", fontSize: 12.5 }}>
                            By {item.actor}
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                </Stack>
              ) : (
                <ConsoleEmptyState
                  title="No history yet"
                  text="Application status history will appear here once review actions begin."
                />
              )}
            </ConsolePanel>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}