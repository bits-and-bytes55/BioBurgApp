import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  IconButton, Avatar, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
  Tooltip, Divider, Badge,
} from "@mui/material";
import {
  Search, Refresh, Edit, Delete, Block, CheckCircle,
  Person, Email, Phone, CalendarToday, ShoppingCart,
  VerifiedUser, Lock, LockOpen, Close, Save, Warning,
} from "@mui/icons-material";

const BASE_API = import.meta.env.VITE_API_BASE_URL;

//Status chip
function StatusChip({ blocked }) {
  return blocked
    ? <Chip label="Blocked" size="small" icon={<Lock sx={{ fontSize: "13px !important" }} />}
        sx={{ fontWeight: 700, fontSize: 11, bgcolor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} />
    : <Chip label="Active" size="small" icon={<CheckCircle sx={{ fontSize: "13px !important" }} />}
        sx={{ fontWeight: 700, fontSize: 11, bgcolor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }} />;
}

//Confirm Dialog
function ConfirmDialog({ open, title, message, confirmLabel, confirmColor = "error", onConfirm, onClose, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Warning color={confirmColor === "error" ? "error" : "warning"} />
        <Typography fontWeight={700}>{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography fontSize={14} color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained" color={confirmColor} onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {loading ? "Processing…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

//Edit User Dialog
function EditUserDialog({ open, user, onClose, onUpdated }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    setErr("");
  }, [user]);

  const handleSave = async () => {
    setLoading(true); setErr("");
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${BASE_API}/api/admin/users/${user._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdated("User updated successfully!");
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: "#e0e7ff", color: "#4f46e5", fontWeight: 700 }}>
              {(user.name || user.username || "U")[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={16}>Edit User</Typography>
              <Typography fontSize={12} color="text.secondary">#{user._id?.slice(-8).toUpperCase()}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Full Name" fullWidth size="small"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }}
          />
          <TextField
            label="Email Address" fullWidth size="small" type="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }}
          />
          <TextField
            label="Phone Number" fullWidth size="small"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }}
          />
          {err && <Alert severity="error" sx={{ fontSize: 12 }}>{err}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSave} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Save />}
          sx={{ bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}
        >
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

//User Detail Panel (slide-in row)
function UserDetailRow({ user, onEdit, onBlock, onDelete }) {
  const initials = (user.name || user.username || "U")[0].toUpperCase();
  const avatarColors = ["#e0e7ff", "#fef3c7", "#d1fae5", "#fce7f3", "#e0f2fe"];
  const textColors   = ["#4f46e5", "#d97706", "#059669", "#db2777", "#0284c7"];
  const idx = user._id?.charCodeAt(0) % 5 || 0;

  return (
    <Box sx={{ bgcolor: "#f8fafc", px: 4, py: 3, borderBottom: "1px solid #e2e8f0" }}>
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr" }} gap={3}>

        {/* Profile */}
        <Box>
          <Typography fontWeight={700} fontSize={13} mb={1.5} display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="primary" /> Profile Details
          </Typography>
          <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, border: "1px solid #e2e8f0" }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: avatarColors[idx], color: textColors[idx], fontWeight: 700, fontSize: 20 }}>
                {initials}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize={14}>{user.name || user.username || "—"}</Typography>
                <StatusChip blocked={user.isBlocked} />
              </Box>
            </Box>
            {[
              [<Email sx={{ fontSize: 14 }} />, user.email || "—"],
              [<Phone sx={{ fontSize: 14 }} />, user.phone || "—"],
              [<CalendarToday sx={{ fontSize: 14 }} />, user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"],
              [<VerifiedUser sx={{ fontSize: 14 }} />, user.isVerified ? "Email Verified" : "Not Verified"],
            ].map(([icon, val], i) => (
              <Box key={i} display="flex" alignItems="center" gap={1} mb={0.8}>
                <Box color="text.secondary">{icon}</Box>
                <Typography fontSize={12}>{val}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Order Stats */}
        <Box>
          <Typography fontWeight={700} fontSize={13} mb={1.5} display="flex" alignItems="center" gap={0.5}>
            <ShoppingCart fontSize="small" color="primary" /> Order Summary
          </Typography>
          <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, border: "1px solid #e2e8f0" }}>
            {[
              ["Total Orders",    user.orderCount     ?? "—", "#4f46e5"],
              ["Total Spent",     user.totalSpent != null ? `₹${user.totalSpent.toLocaleString()}` : "—", "#0891b2"],
              ["Last Order",      user.lastOrderAt ? new Date(user.lastOrderAt).toLocaleDateString("en-IN") : "Never", "#d97706"],
              ["Wallet Balance",  user.walletBalance  != null ? `₹${user.walletBalance}` : "—", "#16a34a"],
            ].map(([label, val, color]) => (
              <Box key={label} display="flex" justifyContent="space-between" alignItems="center" mb={1.2}>
                <Typography fontSize={12} color="text.secondary">{label}</Typography>
                <Typography fontSize={13} fontWeight={700} color={color}>{val}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Actions */}
        <Box>
          <Typography fontWeight={700} fontSize={13} mb={1.5}>Quick Actions</Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Button
              fullWidth variant="outlined" startIcon={<Edit />}
              onClick={() => onEdit(user)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: "#4f46e5", color: "#4f46e5" }}
            >
              Edit Profile
            </Button>
            <Button
              fullWidth variant="outlined"
              startIcon={user.isBlocked ? <LockOpen /> : <Block />}
              color={user.isBlocked ? "success" : "warning"}
              onClick={() => onBlock(user)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {user.isBlocked ? "Unblock User" : "Block User"}
            </Button>
            <Button
              fullWidth variant="outlined" color="error" startIcon={<Delete />}
              onClick={() => onDelete(user)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Delete User
            </Button>
          </Box>
          <Box mt={2} sx={{ bgcolor: "#fff", borderRadius: 2, p: 1.5, border: "1px solid #e2e8f0" }}>
            <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.5}>USER ID</Typography>
            <Typography fontSize={11} fontFamily="monospace" color="#4f46e5">#{user._id}</Typography>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

//Main Component
export default function D2CAllUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId]     = useState(null);
  const [snackbar, setSnackbar]   = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats]         = useState({ total: 0, active: 0, blocked: 0, verified: 0 });

  // Dialogs
  const [editUser,    setEditUser]    = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${BASE_API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.users || res.data.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      setStats({
        total:    list.length,
        active:   list.filter((u) => !u.isBlocked).length,
        blocked:  list.filter((u) => u.isBlocked).length,
        verified: list.filter((u) => u.isVerified).length,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const notify = async (message, severity = "success") => {
  setSnackbar({ open: true, message, severity });
  await fetchUsers();
};

  // Block / Unblock
  const handleBlockConfirm = async () => {
  if (!blockTarget) return;
  setActionLoading(true);
  try {
    const token = localStorage.getItem("adminToken");
    const isBlocked = blockTarget.isBlocked;
    await axios.patch(
      `${BASE_API}/api/admin/users/${blockTarget._id}/${isBlocked ? "unblock" : "block"}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setBlockTarget(null);
    setSnackbar({ open: true, message: isBlocked ? "User unblocked!" : "🚫 User blocked!", severity: "success" });
    await fetchUsers(); // wait for fresh data before re-render
  } catch (e) {
    setSnackbar({ open: true, message: e.response?.data?.message || "Action failed.", severity: "error" });
  } finally {
    setActionLoading(false);
  }
};
  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${BASE_API}/api/admin/users/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notify(" User deleted successfully!");
      setDeleteTarget(null);
      if (expandedId === deleteTarget._id) setExpandedId(null);
    } catch (e) {
      notify(e.response?.data?.message || "Delete failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    if (q && !(
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u._id?.toLowerCase().includes(q)
    )) return false;
    if (statusFilter === "active"   && u.isBlocked)  return false;
    if (statusFilter === "blocked"  && !u.isBlocked)  return false;
    if (statusFilter === "verified" && !u.isVerified) return false;
    return true;
  }), [users, search, statusFilter]);

  const avatarColors = ["#e0e7ff","#fef3c7","#d1fae5","#fce7f3","#e0f2fe"];
  const textColors   = ["#4f46e5","#d97706","#059669","#db2777","#0284c7"];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b" mb={0.5}>
            👥 All D2C Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage registered D2C customers — edit, block, or remove accounts
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={fetchUsers} variant="outlined"
          sx={{ textTransform: "none", borderRadius: 2, flexShrink: 0 }}>
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(4,1fr)" }} gap={2} mb={3}>
        {[
          { label: "Total Users",    value: stats.total,    color: "#4f46e5", bg: "#eef2ff" },
          { label: "Active",         value: stats.active,   color: "#16a34a", bg: "#f0fdf4" },
          { label: "Blocked",        value: stats.blocked,  color: "#dc2626", bg: "#fef2f2" },
          { label: "Verified",       value: stats.verified, color: "#0891b2", bg: "#ecfeff" },
        ].map((s) => (
          <Paper key={s.label} elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: s.bg, border: "1px solid #e2e8f0" }}>
            <Typography fontSize={12} color="text.secondary" mb={0.5}>{s.label}</Typography>
            <Typography fontSize={22} fontWeight={800} color={s.color}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField
          size="small" placeholder="Search by name, email, phone, ID…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 270, bgcolor: "#fff", borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status" sx={{ bgcolor: "#fff" }}>
            <MenuItem value="all">All users</MenuItem>
            <MenuItem value="active">Active only</MenuItem>
            <MenuItem value="blocked">Blocked only</MenuItem>
            <MenuItem value="verified">Verified only</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
        </Typography>
      </Box>

      {error && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2 }}>
          <Typography color="error" fontSize={14}>⚠️ {error}</Typography>
        </Paper>
      )}

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell width={40} />
                {["USER","EMAIL","PHONE","ORDERS","STATUS","JOINED","ACTIONS"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={32} />
                    <Typography fontSize={14} color="text.secondary" mt={2}>Loading users…</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography fontSize={36} mb={1}>👤</Typography>
                    <Typography fontWeight={600} color="text.secondary">No users found</Typography>
                    <Typography fontSize={13} color="text.secondary">
                      {search || statusFilter !== "all" ? "Try adjusting your filters" : "No D2C users registered yet"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map((user) => {
                const isExpanded = expandedId === user._id;
                const idx = user._id?.charCodeAt(0) % 5 || 0;
                const initials = (user.name || user.username || "U")[0].toUpperCase();
                return (
                  <React.Fragment key={user._id}>
                    <TableRow
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" }, bgcolor: isExpanded ? "#f0f4ff" : "inherit" }}
                      onClick={() => setExpandedId(isExpanded ? null : user._id)}
                    >
                      <TableCell width={40}>
                        <IconButton size="small">
                          <Box sx={{
                            width: 20, height: 20, borderRadius: "50%",
                            border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                          }}>
                            <Box sx={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                              borderTop: "5px solid #64748b", mt: "1px" }} />
                          </Box>
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColors[idx], color: textColors[idx], fontWeight: 700, fontSize: 14 }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={600}>{user.name || user.username || "—"}</Typography>
                            <Typography fontSize={11} color="text.secondary" fontFamily="monospace">
                              #{user._id?.slice(-6).toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography fontSize={12}>{user.email || "—"}</Typography>
                          {user.isVerified && (
                            <Tooltip title="Email verified">
                              <VerifiedUser sx={{ fontSize: 14, color: "#16a34a" }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13}>{user.phone || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={600} color="#4f46e5">
                          {user.orderCount ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip blocked={user.isBlocked} />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12} color="text.secondary">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Edit user">
                            <IconButton size="small" onClick={() => setEditUser(user)}
                              sx={{ bgcolor: "#eef2ff", "&:hover": { bgcolor: "#e0e7ff" } }}>
                              <Edit fontSize="small" sx={{ color: "#4f46e5" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.isBlocked ? "Unblock user" : "Block user"}>
                            <IconButton size="small" onClick={() => setBlockTarget(user)}
                              sx={{ bgcolor: user.isBlocked ? "#f0fdf4" : "#fffbeb", "&:hover": { bgcolor: user.isBlocked ? "#dcfce7" : "#fef3c7" } }}>
                              {user.isBlocked
                                ? <LockOpen fontSize="small" sx={{ color: "#16a34a" }} />
                                : <Block fontSize="small" sx={{ color: "#d97706" }} />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton size="small" onClick={() => setDeleteTarget(user)}
                              sx={{ bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" } }}>
                              <Delete fontSize="small" sx={{ color: "#dc2626" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                          <UserDetailRow
                            user={user}
                            onEdit={setEditUser}
                            onBlock={setBlockTarget}
                            onDelete={setDeleteTarget}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <EditUserDialog
        open={!!editUser} user={editUser}
        onClose={() => setEditUser(null)}
        onUpdated={notify}
      />

      {/* Block/Unblock Confirm */}
      <ConfirmDialog
        open={!!blockTarget}
        title={blockTarget?.isBlocked ? "Unblock User?" : "Block User?"}
        message={blockTarget?.isBlocked
          ? `This will restore access for ${blockTarget?.name || blockTarget?.email}. They will be able to log in and place orders again.`
          : `This will prevent ${blockTarget?.name || blockTarget?.email} from logging in or placing orders.`}
        confirmLabel={blockTarget?.isBlocked ? "Unblock" : "Block"}
        confirmColor={blockTarget?.isBlocked ? "success" : "warning"}
        onConfirm={handleBlockConfirm}
        onClose={() => setBlockTarget(null)}
        loading={actionLoading}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User?"
        message={`This will permanently delete ${deleteTarget?.name || deleteTarget?.email} and all their data. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={actionLoading}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}