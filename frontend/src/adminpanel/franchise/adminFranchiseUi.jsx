import React from "react";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export function AdminFranchiseThemeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700&display=swap');

      .admin-franchise-root {
        --admin-franchise-bg: #f4f6f8;
        --admin-franchise-panel: #ffffff;
        --admin-franchise-line: rgba(0,0,0,0.07);
        --admin-franchise-text: #1e293b;
        --admin-franchise-muted: #64748b;
        --admin-franchise-gold: #b45309;
        --admin-franchise-gold-strong: #92400e;
        --admin-franchise-blue: #1e4e8a;
        --admin-franchise-green: #1a5e48;
        --admin-franchise-rose: #b83028;
        color: #1e293b;
        font-family: 'Manrope', sans-serif;
      }

      .admin-franchise-root .admin-display {
        font-family: 'Space Grotesk', sans-serif;
      }

      .admin-franchise-root .admin-mono {
        font-family: 'JetBrains Mono', monospace;
      }

      /* Force ALL text dark — catches every nested MUI Typography/Box */
      .admin-franchise-root * {
        color: #1e293b;
      }

      .admin-franchise-root .MuiTableCell-body,
      .admin-franchise-root .MuiTableCell-body * {
        color: #1e293b !important;
      }

      .admin-franchise-root .MuiTableCell-head,
      .admin-franchise-root .MuiTableCell-head * {
        color: #64748b !important;
      }

      /* Scrollbar */
      .admin-franchise-root ::-webkit-scrollbar { width: 6px; height: 6px; }
      .admin-franchise-root ::-webkit-scrollbar-track { background: transparent; }
      .admin-franchise-root ::-webkit-scrollbar-thumb {
        background: rgba(100,116,139,0.3);
        border-radius: 999px;
      }
      .admin-franchise-root ::-webkit-scrollbar-thumb:hover {
        background: rgba(180,83,9,0.35);
      }

      .admin-franchise-root ::selection {
        background: rgba(180,83,9,0.15);
        color: #78350f;
      }
    `}</style>
  );
}

export const adminFieldSx = {
  minWidth: 150,
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    color: "#1e293b",
    bgcolor: "#f8fafc",
    "& fieldset": { borderColor: "rgba(0,0,0,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(180,83,9,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(180,83,9,0.8)" },
  },
  "& .MuiInputLabel-root": { color: "#64748b" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#b45309" },
  "& .MuiSvgIcon-root": { color: "#64748b" },
  "& .MuiInputBase-input": { color: "#1e293b" },
  "& .MuiFormHelperText-root": { color: "#64748b" },
};

export const adminTableSx = {
  minWidth: 960,
  borderCollapse: "separate",
  borderSpacing: "0 8px",
  "& .MuiTableCell-head": {
    borderBottom: "none",
    color: "#64748b",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    py: 1.2,
    bgcolor: "transparent",
  },
  "& .MuiTableCell-body": {
    borderBottom: "none",
    bgcolor: "#f8fafc",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)",
    py: 2,
    color: "#1e293b",
  },
  "& .MuiTableRow-root:hover .MuiTableCell-body": {
    bgcolor: "#f1f5f9",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(180,83,9,0.15)",
  },
  "& .MuiTableCell-body:first-of-type": {
    borderRadius: "16px 0 0 16px",
    pl: 2.2,
  },
  "& .MuiTableCell-body:last-of-type": {
    borderRadius: "0 16px 16px 0",
    pr: 2.2,
  },
};

export const adminDialogPaperSx = {
  bgcolor: "#ffffff",
  color: "#1e293b",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 4,
  boxShadow: "0 24px 60px rgba(0,0,0,0.14)",
};

export function AdminFranchisePage({ children }) {
  return (
    <Box
      className="admin-franchise-root"
      sx={{
        position: "relative",
        minHeight: "calc(100vh - 120px)",
        borderRadius: 6,
        border: "1px solid rgba(0,0,0,0.07)",
        bgcolor: "#f4f6f8",
        color: "#1e293b",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        p: { xs: 2, md: 3 },
      }}
    >
      <AdminFranchiseThemeStyles />
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}

export function AdminFranchiseHero({ eyebrow = "Super Admin Franchise Desk", title, description, badges, actions }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#ffffff",
        color: "#1e293b",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -30, right: -30,
          width: 160, height: 160,
          borderRadius: "50%",
          bgcolor: "rgba(251,191,36,0.07)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ display: "flex", gap: 3, justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-end" }}>
        <Box sx={{ maxWidth: 920 }}>
          <Box
            className="admin-mono"
            sx={{
              display: "inline-flex",
              px: 1.5, py: 0.75,
              borderRadius: 999,
              border: "1px solid rgba(180,83,9,0.22)",
              bgcolor: "rgba(251,191,36,0.08)",
              fontSize: 10,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              color: "#92400e !important",
            }}
          >
            {eyebrow}
          </Box>
          <Typography
            className="admin-display"
            sx={{ mt: 2, fontSize: { xs: 24, md: 36 }, lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 700, color: "#0f1e2a !important" }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ mt: 1.5, maxWidth: 820, color: "#5a7080 !important", lineHeight: 1.8, fontSize: 14 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {actions ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>{actions}</Box> : null}
      </Box>
      {badges ? <Box sx={{ mt: 2.5, display: "flex", flexWrap: "wrap", gap: 1 }}>{badges}</Box> : null}
    </Paper>
  );
}

export function AdminFranchisePanel({ title, subtitle, action, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#ffffff",
        color: "#1e293b",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        transition: "box-shadow .2s ease",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
      }}
    >
      {(title || subtitle || action) && (
        <Box
          sx={{
            px: 2.5, py: 2,
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            display: "flex", gap: 2, flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "center",
          }}
        >
          <Box>
            {title ? (
              <Typography
                className="admin-display"
                sx={{ fontSize: 16, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700, color: "#0f1e2a !important" }}
              >
                {title}
              </Typography>
            ) : null}
            {subtitle ? (
              <Typography sx={{ mt: 0.75, color: "#64748b !important", fontSize: 13, lineHeight: 1.7 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action ? <Box>{action}</Box> : null}
        </Box>
      )}
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

export function AdminFranchiseMetric({ label, value, helper, accent = false }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 2.25,
        height: "100%",
        borderRadius: 3.5,
        border: accent ? "1px solid rgba(180,83,9,0.2)" : "1px solid rgba(0,0,0,0.08)",
        bgcolor: accent ? "rgba(251,191,36,0.04)" : "#ffffff",
        color: "#1e293b",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        transition: "all .2s ease",
        "&:hover": { boxShadow: "0 4px 14px rgba(0,0,0,0.09)", transform: "translateY(-1px)" },
      }}
    >
      <Box
        sx={{
          position: "absolute", insetX: 0, top: 0, height: "2px",
          background: accent
            ? "linear-gradient(90deg, transparent, rgba(180,83,9,0.7), transparent)"
            : "linear-gradient(90deg, transparent, rgba(0,0,0,0.07), transparent)",
        }}
      />
      <Typography sx={{ color: "#64748b !important", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>
        {label}
      </Typography>
      <Typography
        className="admin-display"
        sx={{ mt: 1, fontSize: { xs: 24, md: 28 }, lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 700, color: accent ? "#92400e !important" : "#0f1e2a !important" }}
      >
        {value}
      </Typography>
      {helper ? (
        <Typography sx={{ mt: 1, color: "#64748b !important", fontSize: 12, lineHeight: 1.6 }}>{helper}</Typography>
      ) : null}
    </Paper>
  );
}

export function AdminFranchiseBadge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { borderColor: "rgba(0,0,0,0.1)",     color: "#4a5e6a", background: "#f0f3f5" },
    gold:    { borderColor: "rgba(180,83,9,0.28)",  color: "#7a4510", background: "rgba(251,191,36,0.1)" },
    blue:    { borderColor: "rgba(30,78,138,0.25)", color: "#1e3e6a", background: "rgba(122,180,255,0.1)" },
    green:   { borderColor: "rgba(26,94,72,0.25)",  color: "#1a4a38", background: "rgba(101,196,177,0.1)" },
    rose:    { borderColor: "rgba(184,48,40,0.25)", color: "#8b1a14", background: "rgba(240,100,90,0.09)" },
    amber:   { borderColor: "rgba(180,83,9,0.25)",  color: "#7a4510", background: "rgba(245,180,83,0.1)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <Box
      sx={{
        px: 1.25, py: 0.6,
        borderRadius: 999,
        border: `1px solid ${t.borderColor}`,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        color: `${t.color} !important`,
        background: t.background,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {children}
    </Box>
  );
}

export function AdminFranchiseButton({ children, variant = "primary", sx = {}, ...props }) {
  const primary = {
    color: "#ffffff !important",
    background: "linear-gradient(135deg, #d97706, #b45309)",
    boxShadow: "0 4px 14px rgba(180,83,9,0.22)",
    "&:hover": { background: "linear-gradient(135deg, #e58a0a, #c05c0a)" },
    "&.Mui-disabled": { color: "rgba(255,255,255,0.6) !important", background: "rgba(180,83,9,0.4)" },
  };
  const secondary = {
    color: "#1e293b !important",
    border: "1px solid rgba(0,0,0,0.1)",
    background: "#ffffff",
    "&:hover": { borderColor: "rgba(180,83,9,0.35)", background: "rgba(251,191,36,0.06)", color: "#7a4510 !important" },
  };
  return (
    <Button
      {...props}
      sx={{ minHeight: 38, borderRadius: 999, textTransform: "none", fontWeight: 700, fontSize: 13, ...(variant === "primary" ? primary : secondary), ...sx }}
    >
      {children}
    </Button>
  );
}

export function AdminFranchiseNotice({ children, tone = "info" }) {
  const tones = {
    info:    { borderColor: "rgba(30,78,138,0.2)",  color: "#1e3e6a", background: "rgba(122,180,255,0.08)" },
    success: { borderColor: "rgba(26,94,72,0.2)",   color: "#1a4a38", background: "rgba(101,196,177,0.08)" },
    warning: { borderColor: "rgba(180,83,9,0.2)",   color: "#7a4510", background: "rgba(245,180,83,0.08)" },
    error:   { borderColor: "rgba(184,48,40,0.2)",  color: "#8b1a14", background: "rgba(240,100,90,0.08)" },
  };
  const accents = { info: "#3b82f6", success: "#10b981", warning: "#d97706", error: "#ef4444" };
  const t = tones[tone] || tones.info;
  return (
    <Box
      sx={{
        position: "relative", overflow: "hidden",
        pl: 3, pr: 2, py: 1.6,
        borderRadius: 3,
        border: `1px solid ${t.borderColor}`,
        lineHeight: 1.8, fontSize: 13.5,
        color: `${t.color} !important`,
        background: t.background,
      }}
    >
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "3px 0 0 3px", bgcolor: accents[tone] }} />
      {children}
    </Box>
  );
}

export function AdminFranchiseEmpty({ title, text }) {
  return (
    <Box sx={{ py: 5, px: 3, textAlign: "center", borderRadius: 3, border: "1px dashed rgba(0,0,0,0.1)", bgcolor: "#f8fafc" }}>
      <Typography
        className="admin-display"
        sx={{ fontSize: 18, lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 700, color: "#1e293b !important" }}
      >
        {title}
      </Typography>
      <Typography sx={{ mt: 1.25, maxWidth: 520, mx: "auto", color: "#64748b !important", lineHeight: 1.8, fontSize: 13.5 }}>
        {text}
      </Typography>
    </Box>
  );
}

export function AdminFranchiseLoading({ label = "Loading franchise admin desk..." }) {
  return (
    <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4, borderRadius: 4, border: "1px solid rgba(0,0,0,0.07)", bgcolor: "#ffffff", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        <CircularProgress sx={{ color: "#d97706" }} size={28} />
        <Typography sx={{ color: "#64748b !important", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}