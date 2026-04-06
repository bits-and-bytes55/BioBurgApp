import React, { useEffect, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import franchiseApi from "../../Franchise/franchiseApi";
import {
  AdminFranchiseBadge,
  AdminFranchiseButton,
  AdminFranchiseEmpty,
  AdminFranchiseHero,
  AdminFranchiseLoading,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
  formatDateTime,
} from "./adminFranchiseUi";

const toneFromStatus = (status) => {
  if (status === "RESOLVED") return "green";
  if (status === "IN_PROGRESS") return "blue";
  return "amber";
};

export default function FranchiseSupportDetails({ ticketId }) {
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const fetchTicket = async () => {
    const res = await franchiseApi.get(`/support/${ticketId}`);
    setTicket(res.data.ticket);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      setSending(true);
      await franchiseApi.post(`/support/${ticketId}/reply`, { message: reply });
      setReply("");
      fetchTicket();
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId]);

  if (!ticketId) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseEmpty
          title="No support thread selected"
          text="Open a ticket from the list to review its conversation timeline."
        />
      </AdminFranchisePage>
    );
  }

  if (!ticket) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading support details..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title={ticket.subject}
          description="Review the ticket history and send the next franchise-side reply from this focused conversation view."
          badges={<AdminFranchiseBadge tone={toneFromStatus(ticket.status)}>{ticket.status}</AdminFranchiseBadge>}
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.4fr) minmax(320px,0.9fr)" },
          }}
        >
          <AdminFranchisePanel title="Conversation Timeline">
            <Box sx={{ display: "grid", gap: 2 }}>
              {ticket.replies?.map((entry, index) => (
                <Box
                  key={`${entry.createdAt || index}-${index}`}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.03)",
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>{entry.sender}</Typography>
                  <Typography sx={{ mt: 1, lineHeight: 1.8 }}>{entry.message}</Typography>
                  <Typography sx={{ mt: 1, color: "#8da0ad", fontSize: 12.5 }}>
                    {formatDateTime(entry.createdAt)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </AdminFranchisePanel>

          <AdminFranchisePanel title="Reply Console">
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Reply"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              sx={adminFieldSx}
            />
            <Box sx={{ mt: 2 }}>
              <AdminFranchiseButton onClick={sendReply} disabled={sending || !reply.trim()}>
                {sending ? "Sending..." : "Send Reply"}
              </AdminFranchiseButton>
            </Box>
          </AdminFranchisePanel>
        </Box>
      </Box>
    </AdminFranchisePage>
  );
}
