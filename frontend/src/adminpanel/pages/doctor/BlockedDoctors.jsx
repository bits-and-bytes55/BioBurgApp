// ═══════════════════════════════════════════════════════════════════
// BlockedDoctors.jsx
// ═══════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip,
  Typography, Card, CardContent, Paper, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid,
  Avatar, Stack, useMediaQuery, useTheme, alpha, Tooltip, TableContainer,
  TablePagination, LinearProgress
} from "@mui/material";
import {
  Block as BlockIcon, CheckCircle as CheckCircleIcon,
  Person as PersonIcon, Refresh as RefreshIcon,
  Email as EmailIcon, MedicalServices as MedicalServicesIcon,
} from "@mui/icons-material";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function BlockedDoctors() {
  const [doctors,   setDoctors]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [openDlg,   setOpenDlg]   = useState(false);
  const [selDoc,    setSelDoc]    = useState(null);
  const [unblocking,setUnblocking]= useState(false);
  const [refreshing,setRefreshing]= useState(false);
  const [page,      setPage]      = useState(0);
  const [rpp,       setRpp]       = useState(10);

  const theme  = useTheme();
  const isMob  = useMediaQuery(theme.breakpoints.down("md"));
  const isSm   = useMediaQuery(theme.breakpoints.down("sm"));
  const token  = localStorage.getItem("adminToken");

  const fetchDoctors = async (showLoad = true) => {
    if (showLoad) setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/doctors`, { headers: { Authorization: `Bearer ${token}` } });
      setDoctors(res.data.data.filter(d => d.status === "approved" && d.isActive === false));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch blocked doctors");
      if (err.response?.status === 401) { localStorage.removeItem("adminToken"); window.location.href = "/login/admin"; }
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleUnblock = async () => {
    if (!selDoc) return;
    setUnblocking(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/doctors/${selDoc._id}/block`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(res.data.message || "Doctor unblocked successfully");
      setOpenDlg(false); setSelDoc(null); fetchDoctors(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to unblock doctor"); }
    finally { setUnblocking(false); }
  };

  const displayed = doctors.slice(page * rpp, page * rpp + rpp);

  const MobileCard = ({ doc }) => (
    <Card sx={{ mb: 1.5, borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.error.main, 0.18)}`, transition: "box-shadow .2s", "&:hover": { boxShadow: 4 } }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.12), color: "error.main", width: 40, height: 40, flexShrink: 0 }}>
            <PersonIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{doc.fullName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{doc.email}</Typography>
          </Box>
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <MedicalServicesIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption">{doc.specialization || "General"}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip icon={<BlockIcon sx={{ fontSize: "12px !important" }} />} label="Blocked" color="error" size="small" sx={{ fontWeight: 700 }} />
            <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />}
              onClick={() => { setSelDoc(doc); setOpenDlg(true); }} sx={{ borderRadius: 1.5, textTransform: "none", fontSize: 11 }}>
              Unblock
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant={isSm ? "h5" : "h4"} fontWeight={800} letterSpacing="-0.02em">Blocked Doctors</Typography>
          <Typography variant="body2" color="text.secondary">Manage blocked doctor accounts</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => { setRefreshing(true); fetchDoctors(false); }} disabled={refreshing}
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) }, borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* stat */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, bgcolor: alpha(theme.palette.error.main, 0.06), border: `1px solid ${alpha(theme.palette.error.main, 0.18)}` }}>
            <CardContent sx={{ p: "14px 18px !important" }}>
              <Typography variant="h3" fontWeight={800} color="error.main" sx={{ lineHeight: 1 }}>{doctors.length}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Blocked Doctors</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {refreshing && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
          <CircularProgress size={50} />
          <Typography color="text.secondary">Loading blocked doctors…</Typography>
        </Box>
      ) : doctors.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: "center", borderRadius: 2.5 }}>
          <BlockIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No blocked doctors</Typography>
          <Typography variant="body2" color="text.secondary">All doctors are currently active</Typography>
        </Paper>
      ) : isMob ? (
        <Box>{displayed.map(d => <MobileCard key={d._id} doc={d} />)}</Box>
      ) : (
        <Paper sx={{ borderRadius: 2.5, overflow: "hidden", border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.03) }}>
                  {["Doctor", "Email", "Specialization", "Status", "Action"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(doc => (
                  <TableRow key={doc._id} hover sx={{ "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.02) } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main", width: 34, height: 34 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{doc.fullName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{doc.email}</Typography></TableCell>
                    <TableCell>
                      <Chip label={doc.specialization || "General"} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip icon={<BlockIcon sx={{ fontSize: "13px !important" }} />} label="Blocked" color="error" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Unblock Doctor">
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />}
                          onClick={() => { setSelDoc(doc); setOpenDlg(true); }}
                          sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700, minWidth: 100 }}>
                          Unblock
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {doctors.length > rpp && (
        <TablePagination component="div" count={doctors.length} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp} onRowsPerPageChange={e => { setRpp(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} sx={{ mt: 0.5 }} />
      )}

      {/* confirm unblock dialog */}
      <Dialog open={openDlg} onClose={() => setOpenDlg(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Confirm Unblock</DialogTitle>
        <DialogContent>
          <Typography>Unblock <strong>{selDoc?.fullName}</strong>? They will regain full access.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDlg(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleUnblock} variant="contained" color="success" disabled={unblocking}
            startIcon={<CheckCircleIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>
            {unblocking ? "Unblocking…" : "Yes, Unblock"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSuccess("")} severity="success" variant="filled" sx={{ borderRadius: 1.5 }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}