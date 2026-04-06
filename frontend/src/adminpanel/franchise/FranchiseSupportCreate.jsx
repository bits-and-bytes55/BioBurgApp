import React, { useState } from "react";
import { Box, MenuItem, TextField } from "@mui/material";
import franchiseApi from "../../Franchise/franchiseApi";
import {
  AdminFranchiseButton,
  AdminFranchiseHero,
  AdminFranchiseNotice,
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
} from "./adminFranchiseUi";

export default function FranchiseSupportCreate() {
  const [form, setForm] = useState({
    subject: "",
    category: "OTHER",
    message: "",
    orderId: "",
  });
  const [notice, setNotice] = useState("");

  const submitTicket = async () => {
    if (!form.subject || !form.message) {
      window.alert("Subject and message are required.");
      return;
    }

    await franchiseApi.post("/support", form);
    setNotice("Ticket created successfully.");
    setForm({
      subject: "",
      category: "OTHER",
      message: "",
      orderId: "",
    });
  };

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Create Support Ticket"
          description="Raise a fresh support request with enough context for the admin or operations team to respond quickly."
        />

        {notice ? <AdminFranchiseNotice tone="success">{notice}</AdminFranchiseNotice> : null}

        <AdminFranchisePanel title="Ticket Composer">
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              fullWidth
              label="Subject"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              sx={adminFieldSx}
            />
            <TextField
              fullWidth
              select
              label="Category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              sx={adminFieldSx}
            >
              <MenuItem value="ORDER">Order</MenuItem>
              <MenuItem value="PAYMENT">Payment</MenuItem>
              <MenuItem value="INVENTORY">Inventory</MenuItem>
              <MenuItem value="TECHNICAL">Technical</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Order ID (optional)"
              value={form.orderId}
              onChange={(event) => setForm({ ...form, orderId: event.target.value })}
              sx={adminFieldSx}
            />
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Message"
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              sx={adminFieldSx}
            />
            <Box>
              <AdminFranchiseButton onClick={submitTicket}>
                Submit Ticket
              </AdminFranchiseButton>
            </Box>
          </Box>
        </AdminFranchisePanel>
      </Box>
    </AdminFranchisePage>
  );
}
