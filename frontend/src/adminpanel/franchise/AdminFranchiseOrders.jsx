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
  AdminFranchisePage,
  AdminFranchisePanel,
  adminFieldSx,
  adminTableSx,
  formatCurrency,
  formatDate,
} from "./adminFranchiseUi";

const statusTone = (status) => {
  if (status === "DELIVERED") return "green";
  if (status === "PLACED" || status === "ACCEPTED") return "blue";
  if (status === "CANCELLED" || status === "REJECTED") return "rose";
  return "amber";
};

export default function AdminFranchiseOrders({ onTrackOrder }) {
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminFranchiseApi.get("/admin/franchise/orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Orders fetch failed:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    const res = await adminFranchiseApi.get("/zones");
    setZones(res.data.zones || []);
  };

  const assignZone = async (orderId, zoneId) => {
    await adminFranchiseApi.put(`/admin/orders/${orderId}/assign-zone`, { zoneId });
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
    fetchZones();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : order.orderStatus === statusFilter;
      const haystack = [
        order._id,
        order.userId?.name,
        order.userId?.email,
        order.zoneId?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = search
        ? haystack.includes(search.trim().toLowerCase())
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      withoutZone: orders.filter((order) => !order.zoneId?._id).length,
      delivered: orders.filter((order) => order.orderStatus === "DELIVERED")
        .length,
      gross: orders.reduce(
        (total, order) => total + Number(order.totalAmount || 0),
        0,
      ),
    }),
    [orders],
  );

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading franchise order desk..." />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title="Franchise Orders"
          description="Review zone allocation, monitor current order volume, and jump into tracking when an order needs closer operational attention."
          badges={
            <>
              <AdminFranchiseBadge tone="gold">{summary.total} total orders</AdminFranchiseBadge>
              <AdminFranchiseBadge tone={summary.withoutZone ? "rose" : "green"}>
                {summary.withoutZone} without zone
              </AdminFranchiseBadge>
            </>
          }
          actions={
            <AdminFranchiseButton variant="secondary" onClick={fetchOrders}>
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
          <AdminFranchiseMetric label="All Orders" value={summary.total} helper="Orders managed through franchise flow" />
          <AdminFranchiseMetric label="Delivered" value={summary.delivered} helper="Successfully completed orders" />
          <AdminFranchiseMetric label="Zone Gaps" value={summary.withoutZone} helper="Orders still waiting for mapping" />
          <AdminFranchiseMetric label="Gross Value" value={formatCurrency(summary.gross)} helper="Current visible order book" accent />
        </Box>

        <AdminFranchisePanel
          title="Orders Ledger"
          subtitle="Search by order, customer, or zone, then assign the correct franchise zone or open tracking."
          action={
            <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                placeholder="Search order, customer, zone"
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
                <MenuItem value="PLACED">Placed</MenuItem>
                <MenuItem value="ACCEPTED">Accepted</MenuItem>
                <MenuItem value="PACKED">Packed</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
              </Select>
            </Box>
          }
        >
          <Box sx={{ overflowX: "auto" }}>
            {!filteredOrders.length ? (
              <AdminFranchiseEmpty
                title="No orders found"
                text="The current filter set returned no franchise orders."
              />
            ) : (
              <Table sx={adminTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Assign Zone</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Track</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <Box sx={{ fontWeight: 800 }}>
                          #{String(order._id).slice(-6).toUpperCase()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ fontWeight: 700 }}>
                          {order.userId?.name || "Unknown"}
                        </Box>
                        <Box sx={{ color: "#8da0ad", fontSize: 13, mt: 0.6 }}>
                          {order.userId?.email || "-"}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <AdminFranchiseBadge tone={statusTone(order.orderStatus)}>
                          {order.orderStatus}
                        </AdminFranchiseBadge>
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        {order.zoneId?.name ? (
                          <AdminFranchiseBadge tone="blue">
                            {order.zoneId.name}
                          </AdminFranchiseBadge>
                        ) : (
                          <AdminFranchiseBadge tone="rose">Not assigned</AdminFranchiseBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={order.zoneId?._id || ""}
                          displayEmpty
                          onChange={(event) => assignZone(order._id, event.target.value)}
                          sx={adminFieldSx}
                        >
                          <MenuItem value="">Select Zone</MenuItem>
                          {zones.map((zone) => (
                            <MenuItem key={zone._id} value={zone._id}>
                              {zone.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <AdminFranchiseButton
                          variant="secondary"
                          onClick={() => onTrackOrder && onTrackOrder(order._id)}
                        >
                          Track
                        </AdminFranchiseButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </AdminFranchisePanel>
      </Box>
    </AdminFranchisePage>
  );
}
