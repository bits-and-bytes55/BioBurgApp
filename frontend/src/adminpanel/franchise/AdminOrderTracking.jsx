import React, { useEffect, useState } from "react";
import { Box, Divider, Step, StepLabel, Stepper, Typography } from "@mui/material";
import adminFranchiseApi from "./adminFranchiseApi";
import {
  AdminFranchiseBadge,
  AdminFranchiseEmpty,
  AdminFranchiseHero,
  AdminFranchiseLoading,
  AdminFranchiseNotice,
  AdminFranchisePage,
  AdminFranchisePanel,
  formatDateTime,
} from "./adminFranchiseUi";

export default function AdminOrderTracking({ orderId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await adminFranchiseApi.get(`/admin/orders/${orderId}/tracking`);
      setData(res.data);
    } catch (err) {
      console.error("Tracking fetch error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchTracking();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (!orderId) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseEmpty
          title="No order selected"
          text="Choose a franchise order and use the track action to review its full movement timeline here."
        />
      </AdminFranchisePage>
    );
  }

  if (loading) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseLoading label="Loading order tracking timeline..." />
      </AdminFranchisePage>
    );
  }

  if (!data) {
    return (
      <AdminFranchisePage>
        <AdminFranchiseEmpty
          title="Tracking data unavailable"
          text="This order does not currently have a tracking timeline to display."
        />
      </AdminFranchisePage>
    );
  }

  return (
    <AdminFranchisePage>
      <Box sx={{ display: "grid", gap: 3 }}>
        <AdminFranchiseHero
          title={`Order #${data.orderId}`}
          description="Track the complete operational trail for this franchise order, including customer context, assigned zone, and status timeline."
          badges={
            <>
              <AdminFranchiseBadge tone="blue">
                {data.zone?.name || "No zone"}
              </AdminFranchiseBadge>
              <AdminFranchiseBadge tone="gold">
                {data.trackingHistory?.length || 0} tracking events
              </AdminFranchiseBadge>
            </>
          }
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0,0.9fr) minmax(0,1.1fr)" },
          }}
        >
          <AdminFranchisePanel title="Order Snapshot">
            <Box sx={{ display: "grid", gap: 1.7 }}>
              <Typography sx={{ color: "#8da0ad", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Customer
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {data.user?.name || "Unknown"} {data.user?.email ? `(${data.user.email})` : ""}
              </Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Typography sx={{ color: "#8da0ad", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Zone
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{data.zone?.name || "Unassigned"}</Typography>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Typography sx={{ color: "#8da0ad", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Latest event
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {data.trackingHistory?.[0]?.status || "No events"}
              </Typography>
            </Box>
          </AdminFranchisePanel>

          <AdminFranchisePanel
            title="Tracking Timeline"
            subtitle="The newest or most recent events appear in this order history."
          >
            {!data.trackingHistory?.length ? (
              <AdminFranchiseNotice tone="info">
                No tracking events have been recorded yet for this order.
              </AdminFranchiseNotice>
            ) : (
              <Stepper orientation="vertical">
                {data.trackingHistory.map((entry, index) => (
                  <Step key={`${entry.time || index}-${index}`} active completed>
                    <StepLabel>
                      <Typography sx={{ fontWeight: 700, color: "#edf3f7" }}>
                        {entry.status}
                      </Typography>
                      <Typography sx={{ mt: 0.4, color: "#8da0ad", fontSize: 13.5 }}>
                        {formatDateTime(entry.time)}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}
          </AdminFranchisePanel>
        </Box>
      </Box>
    </AdminFranchisePage>
  );
}
