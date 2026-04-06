import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Divider, Box, Avatar, Chip, CircularProgress,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";

const BASE = import.meta.env.VITE_API_BASE_URL;

export default function AssignOrderModal({ open, onClose, order, onSave }) {
  const [agents,   setAgents]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(order?.assignedAgent?._id || order?.assignedAgent || null);
    setLoading(true);

    const token = localStorage.getItem("adminToken");

    // ✅ Correct admin endpoint — returns ALL approved agents with online status
    axios
      .get(`${BASE}/api/delivery/admin/agents`, {
        params: { status: "approved", limit: 100 },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (r.data.success) {
          const list = r.data.agents || r.data.data || [];
          setAgents(list);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, order]);

  const submit = async () => {
    if (!selected) return toast.error("Select an agent");
    if (!order?._id) return toast.error("No order selected");

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");

      // ✅ Correct assign endpoint — same one used everywhere else
      await axios.patch(
        `${BASE}/api/orders/${order._id}/assign-agent`,
        {
          agentId:   selected,
          orderType: order._isD2C ? "delivery" : (order.orderType || "delivery"),
          location:  order.customerAddress || order.deliveryLocation || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Agent assigned successfully!");
      onSave();
      onClose();
    } catch (err) {
      console.error("Assign error:", err);
      toast.error(err.response?.data?.message || "Failed to assign");
    } finally {
      setSaving(false);
    }
  };

  const isOnline = (a) =>
    a.availability === "online" || a.isOnline === true;

  // Sort: online agents first
  const sortedAgents = [...agents].sort((a, b) => {
    const aOn = isOnline(a) ? 1 : 0;
    const bOn = isOnline(b) ? 1 : 0;
    return bOn - aOn;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 17, color: "#1e293b" }}>
          {order?.assignedAgent ? "Reassign Delivery Agent" : "Assign Delivery Agent"}
        </Typography>
        {order && (
          <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.3 }}>
            Order #{order.orderId || order._id?.toString().slice(-8).toUpperCase()} · {order.customerName || "—"}
          </Typography>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : sortedAgents.length === 0 ? (
          <Typography sx={{ color: "#64748b", textAlign: "center", py: 3 }}>
            No approved agents found
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>

            {/* Online agents section label */}
            {sortedAgents.some(isOnline) && (
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: ".08em", mb: 0.5 }}>
                Online Agents
              </Typography>
            )}

            {sortedAgents.map((a, idx) => {
              const online   = isOnline(a);
              const isSelec  = selected === a._id;

              // Separator between online / offline
              const prevOnline = idx > 0 ? isOnline(sortedAgents[idx - 1]) : true;
              const showOfflineLabel = !online && prevOnline && sortedAgents.some(isOnline);

              return (
                <React.Fragment key={a._id}>
                  {showOfflineLabel && (
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: ".08em", mt: 1, mb: 0.5 }}>
                      Offline Agents
                    </Typography>
                  )}
                  <Box
                    onClick={() => setSelected(a._id)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5, p: 1.5,
                      borderRadius: 2.5, cursor: "pointer",
                      border: isSelec ? "2px solid #6366f1" : "2px solid #f1f5f9",
                      background: isSelec ? "#6366f108" : "#fff",
                      opacity: online ? 1 : 0.65,
                      transition: "all .15s",
                      "&:hover": { borderColor: "#6366f1", background: "#6366f108" },
                    }}
                  >
                    <Avatar sx={{
                      width: 38, height: 38, fontSize: 15, fontWeight: 700,
                      background: online ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e2e8f0",
                      color: online ? "#fff" : "#64748b",
                    }}>
                      {a.name?.charAt(0)}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                        {a.name}
                        {a.agentId && (
                          <Typography component="span" sx={{ fontSize: 11, color: "#94a3b8", ml: 1, fontFamily: "monospace" }}>
                            {a.agentId}
                          </Typography>
                        )}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                        {a.phone} · {a.vehicleType || "—"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                      <Chip
                        label={online ? "Online" : "Offline"}
                        size="small"
                        sx={{
                          fontSize: 10, fontWeight: 700,
                          background: online ? "#dcfce7" : "#f1f5f9",
                          color:      online ? "#16a34a" : "#64748b",
                        }}
                      />
                      {/* Show if agent already has an active order */}
                      {a.currentOrder && (
                        <Typography sx={{ fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>
                          On delivery
                        </Typography>
                      )}
                    </Box>

                    {isSelec && (
                      <Box sx={{ width: 20, height: 20, borderRadius: "50%",
                        background: "#6366f1", display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </Box>
                    )}
                  </Box>
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#64748b" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || !selected}
          sx={{
            textTransform: "none", borderRadius: 2, px: 3,
            background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "none",
          }}
        >
          {saving ? "Assigning…" : order?.assignedAgent ? "Reassign Agent" : "Assign Agent"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}