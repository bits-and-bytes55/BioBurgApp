import React, { useEffect, useState } from "react";
import { Box, Grid, Stack, TextField, Typography } from "@mui/material";
import bulkManufacturingApi from "../bulkManufactureApi";
import {
  ConsoleBadge,
  ConsoleButton,
  ConsoleHeader,
  ConsoleLoading,
  ConsoleNotice,
  ConsolePanel,
  formatDate,
} from "../../Franchise/components/consoleUi";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#edf3f7",
    bgcolor: "rgba(255,255,255,0.03)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.08)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(215,178,109,0.32)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(215,178,109,0.85)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#8da0ad",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#f0d59d",
  },
  "& .MuiInputBase-input": {
    color: "#edf3f7",
  },
};

const initialProfile = {
  fullName: "",
  designation: "",
  mobile: "",
  whatsapp: "",
  companyName: "",
  country: "",
  website: "",
  username: "",
  email: "",
  applicationStatus: "",
  documentReviewStatus: "",
  createdAt: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await bulkManufacturingApi.get(
        "/bulk-manufacturing-portal/profile",
      );
      setProfile((current) => ({
        ...current,
        ...response.data.profile,
      }));
    } catch (profileError) {
      console.error("Bulk profile fetch error:", profileError);
      setError(
        profileError.response?.data?.message || "Unable to load profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await bulkManufacturingApi.put(
        "/bulk-manufacturing-portal/profile",
        {
          fullName: profile.fullName,
          designation: profile.designation,
          mobile: profile.mobile,
          whatsapp: profile.whatsapp,
          companyName: profile.companyName,
          country: profile.country,
          website: profile.website,
        },
      );

      setProfile((current) => ({
        ...current,
        ...response.data.profile,
      }));

      localStorage.setItem(
        "bulkManufacturingUser",
        JSON.stringify({
          ...(JSON.parse(localStorage.getItem("bulkManufacturingUser") || "{}")),
          companyName: response.data.profile.companyName,
          contactName: response.data.profile.fullName,
          country: response.data.profile.country,
        }),
      );

      setMessage(response.data.message || "Profile updated successfully.");
    } catch (saveError) {
      console.error("Bulk profile update error:", saveError);
      setError(
        saveError.response?.data?.message || "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ConsoleLoading label="Loading partner profile..." />;
  }

  return (
    <Box>
      <ConsoleHeader
        eyebrow="Profile & Company"
        title="Keep partner identity and company information aligned."
        description="These details help the BioBurg team verify communications, prepare quotes, and coordinate compliance review faster."
        badges={[
          <ConsoleBadge key="application" tone="amber">
            {profile.applicationStatus || "PENDING"}
          </ConsoleBadge>,
          <ConsoleBadge key="documents" tone="blue">
            {profile.documentReviewStatus || "PENDING"}
          </ConsoleBadge>,
        ]}
      />

      {error ? (
        <Box sx={{ mt: 3 }}>
          <ConsoleNotice tone="error">{error}</ConsoleNotice>
        </Box>
      ) : null}
      {message ? (
        <Box sx={{ mt: 3 }}>
          <ConsoleNotice tone="success">{message}</ConsoleNotice>
        </Box>
      ) : null}

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} xl={8}>
          <ConsolePanel
            title="Editable Details"
            subtitle="Update contact and company data used by the admin team."
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Contact Name"
                  value={profile.fullName}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Designation"
                  value={profile.designation}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      designation: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Mobile"
                  value={profile.mobile}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      mobile: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="WhatsApp"
                  value={profile.whatsapp}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      whatsapp: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Company Name"
                  value={profile.companyName}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Country"
                  value={profile.country}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Website"
                  value={profile.website}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1.2} sx={{ mt: 3 }}>
              <ConsoleButton onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </ConsoleButton>
              <ConsoleButton variant="secondary" onClick={fetchProfile}>
                Reset
              </ConsoleButton>
            </Stack>
          </ConsolePanel>
        </Grid>

        <Grid item xs={12} xl={4}>
          <ConsolePanel
            title="Portal Identity"
            subtitle="Readonly access information generated during provisioning."
          >
            <Stack spacing={1.5}>
              {[
                ["Username", profile.username || "-"],
                ["Email", profile.email || "-"],
                ["Application", profile.applicationStatus || "-"],
                ["Documents", profile.documentReviewStatus || "-"],
                ["Created", profile.createdAt ? formatDate(profile.createdAt) : "-"],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    py: 1.2,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Typography sx={{ color: "#8da0ad", fontSize: 13 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ color: "#edf3f7", fontSize: 13.5, textAlign: "right" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </ConsolePanel>
        </Grid>
      </Grid>
    </Box>
  );
}
