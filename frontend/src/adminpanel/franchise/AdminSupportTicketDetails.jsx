import React, { useEffect, useState } from "react";
import { Box, Divider, TextField, Typography } from "@mui/material";
import adminFranchiseApi from "./adminFranchiseApi";
import {
  AdminFranchiseBadge,
  AdminFranchiseButton,
  AdminFranchiseEmpty,
  AdminFranchiseHero,
  AdminFranchiseLoading,
  AdminFranchiseNotice,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
  formatDateTime,
} from "./adminFranchiseUi";

const statusTone = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

export default function AdminSupportTicketDetails({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await adminFranchiseApi.get(`/support/admin/${ticketId}`);
      setTicket(res.data.ticket);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const sendReply = async () => {
    if (!reply.trim()) {
      return;
    }

    try {
      setSending(true);
      await adminFranchiseApi.post(`/support/admin/${ticketId}/reply`, {
        message: reply,
      });
      setReply("");
      fetchTicket();
    } finally {
      setSending(false);
    }
  };

  if (!ticketId) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseEmpty
          title="No support thread selected"
          text="Open a ticket from the support desk to review the conversation timeline here."
        />
      </AdminFranchisePage>
    );
  }

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading support thread..." />
      </AdminFranchisePage>
    );
  }

  if (!ticket) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseEmpty
          title="Support thread unavailable"
          text="The selected ticket could not be loaded. Refresh the support desk and try again."
        />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title={ticket.subject}
          description={`Franchise ${ticket.franchiseId?.email || "-"} raised this ${ticket.category || "general"} support ticket. Review the full message history and send the next admin response from here.`}
          badges={
            <>
              <AdminFranchiseBadge tone={statusTone(ticket.status)}>
                {ticket.status}
              </AdminFranchiseBadge>
              <AdminFranchiseBadge tone="blue">
                {ticket.category || "OTHER"}
              </AdminFranchiseBadge>
              {ticket.orderId ? (
                <AdminFranchiseBadge tone="gold">
                  Linked order #{String(ticket.orderId).slice(-6).toUpperCase()}
                </AdminFranchiseBadge>
              ) : null}
            </>
          }
          actions={
            <AdminFranchiseButton variant="secondary" onClick={onBack}>
              Back to tickets
            </AdminFranchiseButton>
          }
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.6fr) minmax(320px,0.9fr)" },
          }}
        >
          <AdminFranchisePanel
            title="Conversation Timeline"
            subtitle="This includes the original ticket and all subsequent franchise or admin replies."
          >
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box
                sx={{
                  p: 2.2,
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.08)",
                  bgcolor: "rgba(122,180,255,0.07)",
                }}
              >
                <Typography sx={{ fontWeight: 800, color: "#d6e7ff" }}>
                  Franchise
                </Typography>
                <Typography sx={{ mt: 1.1, color: "#edf3f7", lineHeight: 1.85 }}>
                  {ticket.message}
                </Typography>
                <Typography sx={{ mt: 1.3, color: "#8da0ad", fontSize: 12.5 }}>
                  {formatDateTime(ticket.createdAt)}
                </Typography>
              </Box>

              {ticket.replies?.length ? (
                ticket.replies.map((entry, index) => {
                  const isAdmin = String(entry.sender).toLowerCase().includes("admin");
                  return (
                    <Box
                      key={`${entry.createdAt || index}-${index}`}
                      sx={{
                        p: 2.2,
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.08)",
                        bgcolor: isAdmin
                          ? "rgba(215,178,109,0.07)"
                          : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: isAdmin ? "#f0d59d" : "#dbe5eb",
                        }}
                      >
                        {entry.sender}
                      </Typography>
                      <Typography sx={{ mt: 1.1, color: "#edf3f7", lineHeight: 1.85 }}>
                        {entry.message}
                      </Typography>
                      <Typography sx={{ mt: 1.3, color: "#8da0ad", fontSize: 12.5 }}>
                        {formatDateTime(entry.createdAt)}
                      </Typography>
                    </Box>
                  );
                })
              ) : (
                <AdminFranchiseNotice tone="info">
                  No replies yet. Send the first admin response below.
                </AdminFranchiseNotice>
              )}
            </Box>
          </AdminFranchisePanel>

          <Box sx={{ display: "grid", gap: 3 }}>
            <AdminFranchisePanel title="Ticket Snapshot">
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Typography sx={{ color: "#8da0ad", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                  Franchise
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{ticket.franchiseId?.email || "-"}</Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                <Typography sx={{ color: "#8da0ad", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                  Status
                </Typography>
                <Box>
                  <AdminFranchiseBadge tone={statusTone(ticket.status)}>
                    {ticket.status}
                  </AdminFranchiseBadge>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                <Typography sx={{ color: "#8da0ad", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                  Created
                </Typography>
                <Typography>{formatDateTime(ticket.createdAt)}</Typography>
              </Box>
            </AdminFranchisePanel>

            <AdminFranchisePanel
              title="Reply Console"
              subtitle="Send a clear operational response back to the franchise user."
            >
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Admin reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                sx={adminFieldSx}
              />
              <Box sx={{ mt: 2, display: "flex", gap: 1.2, flexWrap: "wrap" }}>
                <AdminFranchiseButton onClick={sendReply} disabled={sending || !reply.trim()}>
                  {sending ? "Sending..." : "Send Reply"}
                </AdminFranchiseButton>
                <AdminFranchiseButton variant="secondary" onClick={fetchTicket}>
                  Refresh thread
                </AdminFranchiseButton>
              </Box>
            </AdminFranchisePanel>
          </Box>
        </Box>
      </Box>
    </AdminFranchisePage>
  );
}
