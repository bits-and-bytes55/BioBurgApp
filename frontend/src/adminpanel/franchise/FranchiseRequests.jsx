import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import adminFranchiseApi from "./adminFranchiseApi";
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
  formatDateTime,
} from "./adminFranchiseUi";

const documentLabels = {
  profilePhoto: "Profile Photo",
  governmentId: "Government ID",
  addressProof: "Address Proof",
  businessProof: "Business Proof",
};

const applicationSections = [
  {
    title: "Applicant Snapshot",
    fields: [
      ["Full Name", "fullName"],
      ["Email", "email"],
      ["Mobile", "mobile"],
      ["Gender", "gender"],
      ["Date of Birth", "dob"],
      ["Doctor", "isDoctor"],
      ["Pathy Expertise", "pathyExpertise"],
      ["Patients Per Day", "patientsPerDay"],
    ],
  },
  {
    title: "Support and Risk Assessment",
    fields: [
      ["Agreement Rating", "agreementRating"],
      ["Additional Support", "additionalSupport"],
      ["Other Support", "otherSupportText"],
      ["Similar Business", "similarBusiness"],
      ["Concerns", "concerns"],
      ["Other Concern", "otherConcernText"],
      ["Challenges", "challenges"],
      ["Other Challenge", "otherChallengeText"],
    ],
  },
  {
    title: "Investment Plan",
    fields: [
      ["Investment Bandwidth", "investmentBandwidth"],
      ["Franchise Model", "franchiseModel"],
      ["Investment Timeline", "investmentTimeline"],
      ["ROI Expectation", "roiExpectation"],
      ["Investing Capacity", "investingCapacity"],
      ["Multiple Franchises", "multipleFranchises"],
      ["Number of Stores", "numberOfStores"],
      ["Appealing Aspects", "appealingAspects"],
      ["Other Appealing Aspect", "otherAppealingText"],
    ],
  },
  {
    title: "Market Readiness",
    fields: [
      ["Nearby Pharmacy", "nearbyPharmacy"],
      ["Why BioBurg", "whyBioburg"],
      ["Legal Disputes", "legalDisputes"],
      ["Cities of Interest", "citiesOfInterest"],
      ["Locality", "locality"],
      ["Market Connect", "marketConnect"],
      ["Location Type", "locationType"],
      ["Comments", "comments"],
    ],
  },
];

const formatValue = (value) => {
  if (Array.isArray(value)) {
    const visibleValues = value.filter(Boolean);
    return visibleValues.length > 0 ? visibleValues.join(", ") : "-";
  }
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const toneFromValue = (value) => {
  if (value === "VERIFIED" || value === "APPROVED") return "green";
  if (value === "REJECTED") return "rose";
  if (value === "UNDER_REVIEW") return "blue";
  return "amber";
};

function DetailCard({ title, children }) {
  return (
    <Box
      sx={{
        p: 2.2,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.03)",
      }}
    >
      <Typography
        className="admin-display"
        sx={{ fontSize: 19, lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 700 }}
      >
        {title}
      </Typography>
      <Box sx={{ mt: 2, display: "grid", gap: 1.4 }}>{children}</Box>
    </Box>
  );
}

function DetailItem({ label, value }) {
  return (
    <Box>
      <Typography sx={{ color: "#8da0ad", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5, lineHeight: 1.75 }}>{formatValue(value)}</Typography>
    </Box>
  );
}

export default function FranchiseRequests() {
  const [franchises, setFranchises] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneMap, setZoneMap] = useState({});
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [kycForm, setKycForm] = useState({
    kycStatus: "PENDING",
    kycNotes: "",
  });
  const [reviewForm, setReviewForm] = useState({
    status: "PENDING",
    rejectionReason: "",
    lifecycleNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [approvingId, setApprovingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [kycFilter, setKycFilter] = useState("ALL");

  useEffect(() => {
    fetchFranchises();
    fetchZones();
  }, []);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const response = await adminFranchiseApi.get("/admin/requests");
      setFranchises(response.data.franchises || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    const response = await adminFranchiseApi.get("/zones");
    setZones(response.data.zones || []);
  };

  const openDetails = (franchise) => {
    setSelectedFranchise(franchise);
    setKycForm({
      kycStatus: franchise.kycStatus || "PENDING",
      kycNotes: franchise.kycNotes || "",
    });
    setReviewForm({
      status: franchise.status || "PENDING",
      rejectionReason: franchise.rejectionReason || "",
      lifecycleNote: "",
    });
    setZoneMap((current) => ({
      ...current,
      [franchise._id]: current[franchise._id] || franchise.zoneId?._id || "",
    }));
  };

  const closeDetails = () => {
    setSelectedFranchise(null);
  };

  const approveFranchise = async (franchiseId) => {
    const zoneId = zoneMap[franchiseId];
    if (!zoneId) {
      window.alert("Please select a zone before approving this franchise.");
      return;
    }

    try {
      setApprovingId(franchiseId);
      const response = await adminFranchiseApi.post("/admin/franchise/approve", {
        franchiseId,
        zoneId,
        lifecycleNote: reviewForm.lifecycleNote,
      });

      await fetchFranchises();
      closeDetails();

      if (response.data?.tempPassword) {
        window.alert(
          `Franchise approved. Temporary password: ${response.data.tempPassword}`,
        );
      } else {
        window.alert("Franchise approved successfully.");
      }
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to approve franchise");
    } finally {
      setApprovingId("");
    }
  };

  const saveKyc = async () => {
    if (!selectedFranchise) return;
    try {
      setSavingKyc(true);
      await adminFranchiseApi.put(`/admin/requests/${selectedFranchise._id}/kyc`, kycForm);
      await fetchFranchises();
      closeDetails();
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to update KYC");
    } finally {
      setSavingKyc(false);
    }
  };

  const saveReview = async () => {
    if (!selectedFranchise) return;
    try {
      setSavingReview(true);
      await adminFranchiseApi.put(`/admin/requests/${selectedFranchise._id}/review`, reviewForm);
      await fetchFranchises();
      closeDetails();
    } catch (error) {
      window.alert(error.response?.data?.message || "Failed to update review");
    } finally {
      setSavingReview(false);
    }
  };

  const lifecycleNotes = useMemo(() => {
    if (!selectedFranchise?.lifecycleNotes?.length) return [];
    return [...selectedFranchise.lifecycleNotes].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [selectedFranchise]);

  const zoneHistory = useMemo(() => {
    if (!selectedFranchise?.zoneHistory?.length) return [];
    return [...selectedFranchise.zoneHistory].sort(
      (left, right) =>
        new Date(right.assignedAt).getTime() - new Date(left.assignedAt).getTime(),
    );
  }, [selectedFranchise]);

  const filteredFranchises = useMemo(() => {
    return franchises.filter((franchise) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : (franchise.status || "PENDING") === statusFilter;
      const matchesKyc =
        kycFilter === "ALL" ? true : (franchise.kycStatus || "PENDING") === kycFilter;
      const haystack = [
        franchise.fullName,
        franchise.email,
        franchise.mobile,
        franchise.citiesOfInterest,
        franchise.locality,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = search
        ? haystack.includes(search.trim().toLowerCase())
        : true;
      return matchesStatus && matchesKyc && matchesSearch;
    });
  }, [franchises, kycFilter, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: franchises.length,
      pending: franchises.filter((item) => (item.status || "PENDING") === "PENDING").length,
      approved: franchises.filter((item) => item.status === "APPROVED").length,
      verifiedKyc: franchises.filter((item) => item.kycStatus === "VERIFIED").length,
    }),
    [franchises],
  );

  const selectedZoneId = selectedFranchise
    ? zoneMap[selectedFranchise._id] || selectedFranchise.zoneId?._id || ""
    : "";

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading franchise requests..." />
      </AdminFranchisePage>
    );
  }

  return (
    <>
      <AdminFranchisePage>
        <Box sx={{ display: "grid", gap: 3 }}>
          <AdminFranchiseHero
            title="Franchise Requests"
            description="Review applications, verify KYC, assign zones, and create approved franchise logins from one super admin request desk."
            badges={
              <>
                <AdminFranchiseBadge tone="gold">{summary.total} requests</AdminFranchiseBadge>
                <AdminFranchiseBadge tone="amber">{summary.pending} pending</AdminFranchiseBadge>
                <AdminFranchiseBadge tone="green">{summary.approved} approved</AdminFranchiseBadge>
                <AdminFranchiseBadge tone="blue">{summary.verifiedKyc} KYC verified</AdminFranchiseBadge>
              </>
            }
            actions={
              <AdminFranchiseButton variant="secondary" onClick={fetchFranchises}>
                Refresh
              </AdminFranchiseButton>
            }
          />

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
            }}
          >
            <AdminFranchiseMetric label="All Requests" value={summary.total} helper="Applications submitted so far" />
            <AdminFranchiseMetric label="Pending" value={summary.pending} helper="Still awaiting approval or rejection" />
            <AdminFranchiseMetric label="Approved" value={summary.approved} helper="Accounts already created" />
            <AdminFranchiseMetric label="KYC Verified" value={summary.verifiedKyc} helper="Requests with verified documents" accent />
          </Box>

          <AdminFranchisePanel
            title="Application Queue"
            subtitle="Search by applicant, filter by request or KYC status, and open the detailed review drawer."
            action={
              <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
                <TextField
                  size="small"
                  placeholder="Search applicant, email, city"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={adminFieldSx}
                />
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={adminFieldSx}
                >
                  <MenuItem value="ALL">All request states</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
                <Select
                  size="small"
                  value={kycFilter}
                  onChange={(event) => setKycFilter(event.target.value)}
                  sx={adminFieldSx}
                >
                  <MenuItem value="ALL">All KYC states</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under review</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </Box>
            }
          >
            <Box sx={{ overflowX: "auto" }}>
              {!filteredFranchises.length ? (
                <AdminFranchiseEmpty
                  title="No franchise requests found"
                  text="The current search and filter combination returned no applications."
                />
              ) : (
                <Table sx={adminTableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>Docs</TableCell>
                      <TableCell>KYC</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Zone</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFranchises.map((franchise) => {
                      const documentCount = Object.values(franchise.documents || {}).filter(Boolean).length;
                      return (
                        <TableRow key={franchise._id}>
                          <TableCell>
                            <Box sx={{ fontWeight: 800 }}>{franchise.fullName}</Box>
                            <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                              {franchise.mobile || "-"}
                            </Box>
                          </TableCell>
                          <TableCell>{franchise.email}</TableCell>
                          <TableCell>{franchise.citiesOfInterest || "-"}</TableCell>
                          <TableCell>{documentCount}</TableCell>
                          <TableCell>
                            <AdminFranchiseBadge tone={toneFromValue(franchise.kycStatus || "PENDING")}>
                              {franchise.kycStatus || "PENDING"}
                            </AdminFranchiseBadge>
                          </TableCell>
                          <TableCell>
                            <AdminFranchiseBadge tone={toneFromValue(franchise.status || "PENDING")}>
                              {franchise.status || "PENDING"}
                            </AdminFranchiseBadge>
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={zoneMap[franchise._id] || franchise.zoneId?._id || ""}
                              onChange={(event) =>
                                setZoneMap((current) => ({
                                  ...current,
                                  [franchise._id]: event.target.value,
                                }))
                              }
                              displayEmpty
                              sx={{ ...adminFieldSx, minWidth: 160 }}
                            >
                              <MenuItem value="">Select Zone</MenuItem>
                              {zones.map((zone) => (
                                <MenuItem key={zone._id} value={zone._id}>
                                  {zone.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              <AdminFranchiseButton variant="secondary" onClick={() => openDetails(franchise)}>
                                View
                              </AdminFranchiseButton>
                              {franchise.status !== "APPROVED" ? (
                                <AdminFranchiseButton
                                  onClick={() => approveFranchise(franchise._id)}
                                  disabled={approvingId === franchise._id}
                                >
                                  {approvingId === franchise._id ? "Approving..." : "Approve"}
                                </AdminFranchiseButton>
                              ) : null}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>
          </AdminFranchisePanel>
        </Box>
      </AdminFranchisePage>

      <Drawer
        anchor="right"
        open={Boolean(selectedFranchise)}
        onClose={closeDetails}
        PaperProps={{
          sx: {
            width: { xs: "100%", lg: 760 },
            bgcolor: "#071015",
            color: "#edf3f7",
            background:
              "radial-gradient(circle at top left, rgba(215,178,109,0.08), transparent 32%), linear-gradient(180deg, rgba(10,14,19,0.98), rgba(6,9,13,0.98))",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        {selectedFranchise ? (
          <Box className="admin-franchise-root" sx={{ display: "flex", flexDirection: "column", height: "100%", p: 3, gap: 3 }}>
            <Box>
              <Typography className="admin-display" sx={{ fontSize: 34, lineHeight: 0.98, letterSpacing: "-0.04em", fontWeight: 700 }}>
                {selectedFranchise.fullName}
              </Typography>
              <Typography sx={{ mt: 1.2, color: "#8da0ad", lineHeight: 1.8 }}>
                {selectedFranchise.email} | {selectedFranchise.mobile || "-"}
              </Typography>
              <Typography sx={{ color: "#8da0ad", lineHeight: 1.8 }}>
                {selectedFranchise.locality || "-"} | {selectedFranchise.citiesOfInterest || "-"}
              </Typography>
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <AdminFranchiseBadge tone={toneFromValue(selectedFranchise.status || "PENDING")}>
                  Status: {selectedFranchise.status || "PENDING"}
                </AdminFranchiseBadge>
                <AdminFranchiseBadge tone={toneFromValue(selectedFranchise.kycStatus || "PENDING")}>
                  KYC: {selectedFranchise.kycStatus || "PENDING"}
                </AdminFranchiseBadge>
                <AdminFranchiseBadge tone="blue">
                  Current Zone: {selectedFranchise.zoneId?.name || "Not assigned"}
                </AdminFranchiseBadge>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", display: "grid", gap: 2.2, pr: 0.5 }}>
              {applicationSections.map((section) => (
                <DetailCard key={section.title} title={section.title}>
                  {section.fields.map(([label, key]) => (
                    <DetailItem key={key} label={label} value={selectedFranchise[key]} />
                  ))}
                </DetailCard>
              ))}

              <DetailCard title="Zone Assignment">
                <Select
                  value={selectedZoneId}
                  onChange={(event) =>
                    setZoneMap((current) => ({
                      ...current,
                      [selectedFranchise._id]: event.target.value,
                    }))
                  }
                  displayEmpty
                  sx={adminFieldSx}
                >
                  <MenuItem value="">Select Zone</MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone._id} value={zone._id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography sx={{ color: "#8da0ad", fontSize: 13.5 }}>
                  Current zone in request: {selectedFranchise.zoneId?.name || "Not assigned"}
                </Typography>
              </DetailCard>

              <DetailCard title="Zone History">
                {zoneHistory.length ? (
                  zoneHistory.map((entry, index) => (
                    <Box
                      key={`${entry.assignedAt}-${index}`}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.08)",
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {entry.action || "ASSIGNED"} to {entry.zoneId?.name || entry.zoneName || "-"}
                      </Typography>
                      <Typography sx={{ color: "#8da0ad", fontSize: 13, mt: 0.5 }}>
                        {entry.assignedAt ? formatDateTime(entry.assignedAt) : "-"} by {entry.assignedBy || "Admin"}
                      </Typography>
                      <Typography sx={{ mt: 1, lineHeight: 1.75 }}>
                        {entry.note || "No zone note recorded."}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <AdminFranchiseEmpty
                    title="No zone history"
                    text="No zone assignments have been recorded yet for this request."
                  />
                )}
              </DetailCard>

              <DetailCard title="Uploaded Documents">
                {Object.entries(documentLabels).map(([key, label]) => (
                  <Box key={key} sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, alignItems: "center" }}>
                    <Typography>{label}</Typography>
                    {selectedFranchise.documents?.[key] ? (
                      <AdminFranchiseButton
                        variant="secondary"
                        component="a"
                        href={selectedFranchise.documents[key]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </AdminFranchiseButton>
                    ) : (
                      <AdminFranchiseBadge tone="neutral">Not uploaded</AdminFranchiseBadge>
                    )}
                  </Box>
                ))}
              </DetailCard>

              <DetailCard title="KYC Review">
                <Select
                  value={kycForm.kycStatus}
                  onChange={(event) =>
                    setKycForm((current) => ({
                      ...current,
                      kycStatus: event.target.value,
                    }))
                  }
                  sx={adminFieldSx}
                >
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="UNDER_REVIEW">UNDER_REVIEW</MenuItem>
                  <MenuItem value="VERIFIED">VERIFIED</MenuItem>
                  <MenuItem value="REJECTED">REJECTED</MenuItem>
                </Select>
                <TextField
                  multiline
                  rows={3}
                  label="KYC Notes"
                  value={kycForm.kycNotes}
                  onChange={(event) =>
                    setKycForm((current) => ({
                      ...current,
                      kycNotes: event.target.value,
                    }))
                  }
                  sx={adminFieldSx}
                />
              </DetailCard>

              <DetailCard title="Admin Review">
                <Select
                  value={reviewForm.status}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  sx={adminFieldSx}
                >
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="REJECTED">REJECTED</MenuItem>
                </Select>
                <TextField
                  multiline
                  rows={2}
                  label="Rejection Reason"
                  value={reviewForm.rejectionReason}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      rejectionReason: event.target.value,
                    }))
                  }
                  helperText="Required only when the application is rejected."
                  sx={adminFieldSx}
                />
                <TextField
                  multiline
                  rows={3}
                  label="Lifecycle Note"
                  value={reviewForm.lifecycleNote}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      lifecycleNote: event.target.value,
                    }))
                  }
                  helperText="Use this for review comments, approval notes, or follow-up details."
                  sx={adminFieldSx}
                />
                {selectedFranchise.rejectionReason ? (
                  <AdminFranchiseNotice tone="error">
                    Current rejection reason: {selectedFranchise.rejectionReason}
                  </AdminFranchiseNotice>
                ) : null}
              </DetailCard>

              <DetailCard title="Lifecycle Notes">
                {lifecycleNotes.length ? (
                  lifecycleNotes.map((note, index) => (
                    <Box
                      key={`${note.createdAt}-${index}`}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.08)",
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {note.action || "NOTE"} by {note.actor || "Admin"}
                      </Typography>
                      <Typography sx={{ color: "#8da0ad", fontSize: 13, mt: 0.5 }}>
                        {note.createdAt ? formatDateTime(note.createdAt) : "-"}
                      </Typography>
                      <Typography sx={{ mt: 1, lineHeight: 1.75 }}>
                        {note.note || "No details added."}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <AdminFranchiseEmpty
                    title="No lifecycle notes"
                    text="No operational notes have been recorded yet for this application."
                  />
                )}
              </DetailCard>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <AdminFranchiseButton variant="secondary" onClick={closeDetails}>
                Close
              </AdminFranchiseButton>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <AdminFranchiseButton variant="secondary" onClick={saveKyc} disabled={savingKyc}>
                  {savingKyc ? "Saving KYC..." : "Save KYC"}
                </AdminFranchiseButton>
                <AdminFranchiseButton
                  variant="secondary"
                  onClick={saveReview}
                  disabled={savingReview}
                  sx={
                    reviewForm.status === "REJECTED"
                      ? {
                          color: "#ffd4d1",
                          borderColor: "rgba(240,139,134,0.2)",
                          background: "rgba(240,139,134,0.1)",
                          "&:hover": {
                            borderColor: "rgba(240,139,134,0.34)",
                            background: "rgba(240,139,134,0.16)",
                          },
                        }
                      : {}
                  }
                >
                  {savingReview
                    ? "Saving Review..."
                    : reviewForm.status === "REJECTED"
                      ? "Reject Request"
                      : "Save Review"}
                </AdminFranchiseButton>
                {selectedFranchise.status !== "APPROVED" ? (
                  <AdminFranchiseButton
                    onClick={() => approveFranchise(selectedFranchise._id)}
                    disabled={approvingId === selectedFranchise._id}
                  >
                    {approvingId === selectedFranchise._id
                      ? "Approving..."
                      : "Approve & Create Login"}
                  </AdminFranchiseButton>
                ) : null}
              </Box>
            </Box>
          </Box>
        ) : null}
      </Drawer>
    </>
  );
}
