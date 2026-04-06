import { Box, Typography } from "@mui/material";

export default function Header() {
  return (
    <Box
      sx={{
        height: 60,
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        px: 3,
        boxShadow: 1
      }}
    >
      <Typography variant="h6">Lab Dashboard</Typography>
    </Box>
  );
}
