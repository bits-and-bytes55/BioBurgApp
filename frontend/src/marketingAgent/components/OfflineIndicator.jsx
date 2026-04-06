import { Chip } from "@mui/material";

export default function OfflineIndicator() {
  return (
    <Chip
      label={navigator.onLine ? "Online" : "Offline"}
      color={navigator.onLine ? "success" : "warning"}
      size="small"
      sx={{ mt: 1 }}
    />
  );
}
