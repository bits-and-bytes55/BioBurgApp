import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Badge,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  Collapse,
} from "@mui/material";
import {
  Search,
  Notifications,
  People,
  Business,
  MonetizationOn,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  Add,
  FilterList,
  Visibility,
  VisibilityOff,
  DarkMode,
  LightMode,
  GridView,
  ViewList,
  Refresh,
  Email,
  Phone,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Pause,
  Stop,
  Settings,
} from "@mui/icons-material";

const AgentDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showLeads, setShowLeads] = useState(true);
  const [snackbar, setSnackbar] = useState("");

  const stats = [
    { title: "Total Leads", value: "1,248", change: "+12%", icon: <People /> },
    { title: "Active Vendors", value: "42", change: "+5%", icon: <Business /> },
    { title: "Monthly Target", value: "85%", change: "+8%", icon: <MonetizationOn /> },
    { title: "Conversion Rate", value: "24.5%", change: "+3.2%", icon: <TrendingUp /> },
  ];

  const leads = [
    { id: 1, name: "John Smith", company: "Tech Corp", status: "New", value: "$12,500" },
    { id: 2, name: "Sarah Johnson", company: "Global Solutions", status: "Contacted", value: "$8,200" },
    { id: 3, name: "Mike Wilson", company: "Innovate Ltd", status: "Qualified", value: "$25,000" },
  ];

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3, bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Delivery Agent Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="grid"><GridView /></ToggleButton>
            <ToggleButton value="list"><ViewList /></ToggleButton>
          </ToggleButtonGroup>

          <FormControlLabel
            control={<Switch checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />}
            label="Auto Refresh"
          />

          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>

          <Fab size="small" color="primary" onClick={() => setSnackbar("Add Lead clicked")}>
            <Add />
          </Fab>
        </Box>
      </Box>

      {/* CONTROLS */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Typography fontWeight="bold">Dashboard Controls</Typography>
          <Box>
            <Button startIcon={<Refresh />} onClick={() => setSnackbar("Data refreshed")}>
              Refresh
            </Button>
            <Button
              startIcon={showStats ? <VisibilityOff /> : <Visibility />}
              onClick={() => setShowStats(!showStats)}
            >
              Toggle Stats
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* STATS */}
      <Collapse in={showStats}>
        <Grid container spacing={3} mb={4}>
          {stats.map((s) => (
            <Grid item xs={12} sm={6} md={3} key={s.title}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2">{s.title}</Typography>
                      <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <ArrowUpward fontSize="small" color="success" />
                        <Typography color="success.main" variant="body2">{s.change}</Typography>
                      </Box>
                    </Box>
                    <Avatar>{s.icon}</Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Collapse>

      {/* LEADS TABLE */}
      <Collapse in={showLeads}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography fontWeight="bold">Recent Leads</Typography>
              <Button startIcon={<FilterList />}>Filter</Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>
                        <Chip label={lead.status} size="small" />
                      </TableCell>
                      <TableCell>{lead.value}</TableCell>
                      <TableCell>
                        <IconButton size="small"><Phone /></IconButton>
                        <IconButton size="small"><Email /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Collapse>

      {/* SNACKBAR */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="info">{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AgentDashboard;
