import React, { useEffect, useMemo, useState } from "react";
import { Box, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
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
  formatCurrency,
} from "./adminFranchiseUi";

export default function AdminFranchiseZones({ onOpenRequests }) {
  const [summary, setSummary] = useState({});
  const [zones, setZones] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [zoneSelections, setZoneSelections] = useState({});
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminFranchiseApi.get("/admin/franchise/zones/overview");
      const nextSummary = response.data.summary || {};
      const nextZones = response.data.zones || [];
      const nextAccounts = response.data.accounts || [];
      const nextPendingRequests = response.data.pendingRequests || [];

      setSummary(nextSummary);
      setZones(nextZones);
      setAccounts(nextAccounts);
      setPendingRequests(nextPendingRequests);
      setZoneSelections(
        nextAccounts.reduce((accumulator, account) => {
          accumulator[account._id] = account.zoneId || "";
          return accumulator;
        }, {}),
      );
    } catch (err) {
      console.error("Admin franchise zone overview failed", err);
      setError(err.response?.data?.message || "Unable to load franchise zone overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const saveZoneMapping = async (accountId) => {
    const zoneId = zoneSelections[accountId];
    if (!zoneId) {
      window.alert("Please select a zone before saving the mapping.");
      return;
    }

    try {
      setSavingId(accountId);
      await adminFranchiseApi.put(`/admin/franchise/accounts/${accountId}/zone`, {
        zoneId,
        lifecycleNote: notes[accountId] || "",
      });
      await fetchOverview();
    } catch (err) {
      console.error("Admin franchise zone mapping failed", err);
      window.alert(err.response?.data?.message || "Unable to save franchise zone mapping");
    } finally {
      setSavingId("");
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const haystack = [
        account.franchiseName,
        account.email,
        account.zoneName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return search ? haystack.includes(search.trim().toLowerCase()) : true;
    });
  }, [accounts, search]);

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading franchise zone overview..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Zone Mapping & Load Control"
          description="Wire franchise accounts to the correct existing zones, inspect load distribution, and check whether pending requests still need assignment attention."
          badges={
            <>
              <AdminFranchiseBadge tone="blue">{summary.totalZones || 0} zones</AdminFranchiseBadge>
              <AdminFranchiseBadge tone="gold">{summary.mappedAccounts || 0} mapped</AdminFranchiseBadge>
              <AdminFranchiseBadge tone={summary.ordersWithoutZone ? "rose" : "green"}>
                {summary.ordersWithoutZone || 0} orders without zone
              </AdminFranchiseBadge>
            </>
          }
          actions={
            <>
              {onOpenRequests ? (
                <AdminFranchiseButton variant="secondary" onClick={onOpenRequests}>
                  Open Requests Desk
                </AdminFranchiseButton>
              ) : null}
              <AdminFranchiseButton variant="secondary" onClick={fetchOverview}>
                Refresh
              </AdminFranchiseButton>
            </>
          }
        />

        {error ? <AdminFranchiseNotice tone="error">{error}</AdminFranchiseNotice> : null}
        <AdminFranchiseNotice tone="info">
          This desk uses the existing franchise zone setup already present in the
          admin panel. Reassignments here update zone ownership history and future order routing visibility.
        </AdminFranchiseNotice>

        {Number(summary.ordersWithoutZone || 0) > 0 ? (
          <AdminFranchiseNotice tone="warning">
            {summary.ordersWithoutZone} orders are still missing a zone assignment.
            Review franchise orders after adjusting mappings.
          </AdminFranchiseNotice>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          <AdminFranchiseMetric label="Total Zones" value={summary.totalZones || 0} helper={`${summary.activeZones || 0} active`} />
          <AdminFranchiseMetric label="Mapped Accounts" value={summary.mappedAccounts || 0} helper={`${summary.unmappedAccounts || 0} unmapped`} />
          <AdminFranchiseMetric label="Pending Requests" value={summary.pendingRequests || 0} helper={`${summary.approvedRequests || 0} approved`} />
          <AdminFranchiseMetric label="Franchise Orders" value={summary.totalOrders || 0} helper={`${summary.ordersWithoutZone || 0} without zone`} accent />
        </Box>

        <AdminFranchisePanel title="Zone Load Snapshot" subtitle="Compare account load, requests, orders, and gross sales across every existing zone.">
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={adminTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell>Zone</TableCell>
                  <TableCell>Pincodes</TableCell>
                  <TableCell>Accounts</TableCell>
                  <TableCell>Requests</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Sales</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone._id}>
                    <TableCell>
                      <Box sx={{ fontWeight: 800 }}>{zone.name}</Box>
                      <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                        {zone.status}
                      </Box>
                    </TableCell>
                    <TableCell>{zone.pincodeCount || 0}</TableCell>
                    <TableCell>
                      {zone.activeAccounts || 0} active / {zone.assignedAccounts || 0} total
                    </TableCell>
                    <TableCell>
                      {zone.pendingRequests || 0} pending / {zone.approvedRequests || 0} approved
                    </TableCell>
                    <TableCell>
                      {zone.deliveredOrders || 0} delivered / {zone.totalOrders || 0} total
                    </TableCell>
                    <TableCell>{formatCurrency(zone.grossSales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </AdminFranchisePanel>

        <AdminFranchisePanel
          title="Franchise Account Reassignment"
          subtitle="Change the operating zone for a franchise account and capture why the mapping changed."
          action={
            <TextField
              size="small"
              placeholder="Search franchise, email, zone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={adminFieldSx}
            />
          }
        >
          <Box sx={{ overflowX: "auto" }}>
            {!filteredAccounts.length ? (
              <AdminFranchiseEmpty
                title="No accounts found"
                text="No franchise accounts matched your current search term."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Franchise</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Current Zone</TableCell>
                    <TableCell>Orders</TableCell>
                    <TableCell>Gross Sales</TableCell>
                    <TableCell>New Zone</TableCell>
                    <TableCell>Admin Note</TableCell>
                    <TableCell>Save</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>
                        <Box sx={{ fontWeight: 800 }}>{account.franchiseName}</Box>
                        <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          {account.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={account.status === "ACTIVE" ? "green" : "rose"}>
                          {account.status}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>{account.zoneName || "Unmapped"}</TableCell>
                      <TableCell>
                        {account.deliveredOrders || 0} delivered / {account.totalOrders || 0} total
                      </TableCell>
                      <TableCell>{formatCurrency(account.grossSales)}</TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={zoneSelections[account._id] || ""}
                          onChange={(event) =>
                            setZoneSelections((current) => ({
                              ...current,
                              [account._id]: event.target.value,
                            }))
                          }
                          displayEmpty
                          sx={{ ...adminFieldSx, minWidth: 180 }}
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
                        <TextField
                          size="small"
                          placeholder="Reason for mapping change"
                          value={notes[account._id] || ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [account._id]: event.target.value,
                            }))
                          }
                          sx={adminFieldSx}
                        />
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseButton
                          onClick={() => saveZoneMapping(account._id)}
                          disabled={savingId === account._id}
                        >
                          {savingId === account._id ? "Saving..." : "Save"}
                        </AdminFranchiseButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </AdminFranchisePanel>

        <AdminFranchisePanel title="Pending Requests Waiting for Zone Assignment">
          {!pendingRequests.length ? (
            <AdminFranchiseEmpty
              title="No pending requests"
              text="No pending franchise requests are waiting for zone review right now."
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>City</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>{request.fullName}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.mobile || "-"}</TableCell>
                      <TableCell>{request.citiesOfInterest || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </AdminFranchisePanel>
      </Box>
    </AdminFranchisePage>
  );
}
