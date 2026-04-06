import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  AdminFranchisePage,
  AdminFranchisePanel,
  adminDialogPaperSx,
  adminFieldSx,
  adminTableSx,
  formatCurrency,
} from "./adminFranchiseUi";

const emptySettlementForm = {
  commissionRate: 12,
  settlementHoldDays: 7,
  minimumPayoutAmount: 0,
  settlementNotes: "",
};

export default function AdminFranchiseAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [settlementForm, setSettlementForm] = useState(emptySettlementForm);
  const [savingRules, setSavingRules] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await adminFranchiseApi.get("/admin/franchise/accounts");
      setAccounts(res.data.accounts || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, newStatus) => {
    try {
      await adminFranchiseApi.put(`/admin/franchise/${id}/status`, {
        status: newStatus,
      });
      fetchAccounts();
    } catch (err) {
      console.error("Status change error", err);
      window.alert(err.response?.data?.message || "Action failed");
    }
  };

  const openSettlementRules = (account) => {
    setSelectedAccount(account);
    setSettlementForm({
      commissionRate: account.settlementConfig?.commissionRate ?? 12,
      settlementHoldDays: account.settlementConfig?.settlementHoldDays ?? 7,
      minimumPayoutAmount: account.settlementConfig?.minimumPayoutAmount ?? 0,
      settlementNotes: account.settlementConfig?.settlementNotes || "",
    });
  };

  const closeSettlementRules = () => {
    setSelectedAccount(null);
    setSettlementForm(emptySettlementForm);
  };

  const saveSettlementRules = async () => {
    if (!selectedAccount) return;

    try {
      setSavingRules(true);
      await adminFranchiseApi.put(
        `/admin/franchise/${selectedAccount._id}/settlement-config`,
        settlementForm,
      );
      await fetchAccounts();
      closeSettlementRules();
    } catch (err) {
      console.error("Settlement config update error", err);
      window.alert(err.response?.data?.message || "Failed to update settlement rules");
    } finally {
      setSavingRules(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : account.status === statusFilter;
      const haystack = [
        account.email,
        account.zoneId?.name,
        account.franchiseApplicationId?.fullName,
        account.franchiseApplicationId?.mobile,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = search
        ? haystack.includes(search.trim().toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [accounts, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: accounts.length,
      active: accounts.filter((account) => account.status === "ACTIVE").length,
      blocked: accounts.filter((account) => account.status === "BLOCKED").length,
      avgCommission: accounts.length
        ? Math.round(
            accounts.reduce(
              (sum, account) =>
                sum + Number(account.settlementConfig?.commissionRate ?? 12),
              0,
            ) / accounts.length,
          )
        : 0,
    }),
    [accounts],
  );

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading franchise accounts..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Franchise Accounts"
          description="Manage account activation, control settlement rules, and review how each franchise is currently configured for payouts."
          badges={
            <>
              <AdminFranchiseBadge tone="blue">{summary.total} accounts</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="green">{summary.active} active</AdminFranchiseBadge>
              <AdminFranchiseBadge tone={summary.blocked ? "rose" : "gold"}>
                {summary.blocked} blocked
              </AdminFranchiseBadge>
            </>
          }
          actions={
            <AdminFranchiseButton variant="secondary" onClick={fetchAccounts}>
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
          <AdminFranchiseMetric label="Total Accounts" value={summary.total} helper="Approved franchise logins" />
          <AdminFranchiseMetric label="Active" value={summary.active} helper="Currently operational accounts" />
          <AdminFranchiseMetric label="Blocked" value={summary.blocked} helper="Temporarily restricted accounts" />
          <AdminFranchiseMetric label="Avg Commission" value={`${summary.avgCommission}%`} helper="Average default rule across accounts" accent />
        </Box>

        <AdminFranchisePanel
          title="Account Rules Desk"
          subtitle="Search an account, change status, and open settlement rules when commission policy needs adjustment."
          action={
            <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search franchise, email, zone"
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
                <MenuItem value="ALL">All statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="BLOCKED">Blocked</MenuItem>
              </Select>
            </Box>
          }
        >
          <Box sx={{ overflowX: "auto" }}>
            {!filteredAccounts.length ? (
              <AdminFranchiseEmpty
                title="No accounts found"
                text="The selected search and filter combination returned no franchise accounts."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Franchise</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Hold Days</TableCell>
                    <TableCell>Min Payout</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>
                        <Box sx={{ fontWeight: 800 }}>
                          {account.franchiseApplicationId?.fullName || "-"}
                        </Box>
                        <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          {account.franchiseApplicationId?.mobile || "-"}
                        </Box>
                      </TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.zoneId?.name || "-"}</TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={account.status === "ACTIVE" ? "green" : "rose"}>
                          {account.status}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>
                        {Number(account.settlementConfig?.commissionRate ?? 12)}%
                      </TableCell>
                      <TableCell>
                        {Number(account.settlementConfig?.settlementHoldDays ?? 7)} days
                      </TableCell>
                      <TableCell>
                        {formatCurrency(account.settlementConfig?.minimumPayoutAmount ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Select
                            size="small"
                            value={account.status}
                            onChange={(event) => toggleStatus(account._id, event.target.value)}
                            sx={adminFieldSx}
                          >
                            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                            <MenuItem value="BLOCKED">BLOCKED</MenuItem>
                          </Select>
                          <AdminFranchiseButton
                            variant="secondary"
                            onClick={() => openSettlementRules(account)}
                          >
                            Rules
                          </AdminFranchiseButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </AdminFranchisePanel>
      </Box>

      <Dialog
        open={Boolean(selectedAccount)}
        onClose={closeSettlementRules}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: adminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.03em" }}>
          Settlement Rules
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Box sx={{ display: "grid", gap: 2, mt: 0.5 }}>
            <Typography sx={{ color: "#8da0ad" }}>
              {selectedAccount?.franchiseApplicationId?.fullName || "Franchise"} - {selectedAccount?.zoneId?.name || "No zone"}
            </Typography>
            <TextField
              label="Commission Rate (%)"
              type="number"
              value={settlementForm.commissionRate}
              onChange={(event) =>
                setSettlementForm((current) => ({
                  ...current,
                  commissionRate: event.target.value,
                }))
              }
              inputProps={{ min: 0, max: 100 }}
              sx={adminFieldSx}
            />
            <TextField
              label="Settlement Hold Days"
              type="number"
              value={settlementForm.settlementHoldDays}
              onChange={(event) =>
                setSettlementForm((current) => ({
                  ...current,
                  settlementHoldDays: event.target.value,
                }))
              }
              inputProps={{ min: 0, max: 90 }}
              sx={adminFieldSx}
            />
            <TextField
              label="Minimum Payout Amount"
              type="number"
              value={settlementForm.minimumPayoutAmount}
              onChange={(event) =>
                setSettlementForm((current) => ({
                  ...current,
                  minimumPayoutAmount: event.target.value,
                }))
              }
              inputProps={{ min: 0 }}
              sx={adminFieldSx}
            />
            <TextField
              multiline
              rows={4}
              label="Settlement Notes"
              value={settlementForm.settlementNotes}
              onChange={(event) =>
                setSettlementForm((current) => ({
                  ...current,
                  settlementNotes: event.target.value,
                }))
              }
              helperText="Use this note to explain why this payout rule differs from the default."
              sx={adminFieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <AdminFranchiseButton variant="secondary" onClick={closeSettlementRules}>
            Close
          </AdminFranchiseButton>
          <AdminFranchiseButton onClick={saveSettlementRules} disabled={savingRules}>
            {savingRules ? "Saving..." : "Save Rules"}
          </AdminFranchiseButton>
        </DialogActions>
      </Dialog>
    </AdminFranchisePage>
  );
}
