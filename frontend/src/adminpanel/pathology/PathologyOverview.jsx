import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
  alpha,
  useTheme,
  LinearProgress,
  Chip,
  Avatar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Science as LabIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Analytics as AnalyticsIcon,
  ArrowUpward,
  ArrowDownward,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  ViewList as ListIcon,
} from "@mui/icons-material";

// Recharts Components
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// const BASE_API = import.meta.env.VITE_API_BASE_URL;
const BASE_API = import.meta.env.VITE_API_BASE_URL;


export default function PathologyOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [timeRange, setTimeRange] = useState("monthly");
  const theme = useTheme();

  const token = localStorage.getItem("adminToken");

  // Sample data for charts (replace with actual API data)
  const monthlyData = [
    { month: "Jan", total: 45, approved: 38, pending: 7 },
    { month: "Feb", total: 52, approved: 42, pending: 10 },
    { month: "Mar", total: 48, approved: 40, pending: 8 },
    { month: "Apr", total: 60, approved: 52, pending: 8 },
    { month: "May", total: 55, approved: 48, pending: 7 },
    { month: "Jun", total: 65, approved: 58, pending: 7 },
  ];

  const statusData = [
    { name: "Active", value: 58, color: theme.palette.success.main },
    { name: "Pending", value: 7, color: theme.palette.warning.main },
    { name: "Inactive", value: 5, color: theme.palette.error.main },
  ];

  const categoryData = [
    { category: "General", labs: 25 },
    { category: "Specialized", labs: 18 },
    { category: "Research", labs: 12 },
    { category: "Mobile", labs: 8 },
    { category: "Hospital", labs: 17 },
  ];

  const trendData = [
    { day: "Mon", registrations: 4, approvals: 3 },
    { day: "Tue", registrations: 3, approvals: 2 },
    { day: "Wed", registrations: 6, approvals: 5 },
    { day: "Thu", registrations: 5, approvals: 4 },
    { day: "Fri", registrations: 2, approvals: 1 },
    { day: "Sat", registrations: 1, approvals: 1 },
    { day: "Sun", registrations: 0, approvals: 0 },
  ];

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_API}/api/admin/pathology/labs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        const labs = res.data.data;
        const total = labs.length;
        const approved = labs.filter(l => l.status === "ACTIVE").length;
        const pending = labs.filter(l => l.status === "INACTIVE").length;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        setStats({
          totalLabs: total,
          approvedLabs: approved,
          pendingLabs: pending,
          approvalRate: approvalRate,
          labs: labs,
        });
      }
    } catch{
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOverview();
  }, [token]);

  const StatCard = ({ title, value, icon, color, trend, trendValue}) => (
    <Card 
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 44,
              height: 44,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Stack>
        
        {trend && (
          <Chip
            size="small"
            icon={trend === 'up' ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />}
            label={`${trendValue}% from last month`}
            sx={{
              bgcolor: trend === 'up' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
              color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box mb={4}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={600} mb={0.5}>
              Pathology Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visual insights and laboratory statistics
            </Typography>
          </Box>
          
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => newType && setChartType(newType)}
            size="small"
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="bar">
              <BarChartIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="line">
              <TimelineIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="pie">
              <PieChartIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} mb={4}>
        {[
          {
            title: "Total Labs",
            value: stats.totalLabs,
            icon: <LabIcon />,
            color: theme.palette.primary.main,
            trend: "up",
            trendValue: 12,
          },
          {
            title: "Active",
            value: stats.approvedLabs,
            icon: <ApprovedIcon />,
            color: theme.palette.success.main,
            trend: "up",
            trendValue: 8,
          },
          {
            title: "Pending",
            value: stats.pendingLabs,
            icon: <PendingIcon />,
            color: theme.palette.warning.main,
            trend: "down",
            trendValue: 3,
          },
          {
            title: "Approval Rate",
            value: `${stats.approvalRate}%`,
            icon: <AnalyticsIcon />,
            color: theme.palette.info.main,
            trend: "up",
            trendValue: 5,
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Main Chart */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Laboratory Registrations
                </Typography>
                <ToggleButtonGroup
                  value={timeRange}
                  exclusive
                  onChange={(e, newRange) => newRange && setTimeRange(newRange)}
                  size="small"
                >
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                  <ToggleButton value="yearly">Yearly</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total Labs" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" name="Approved" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Pending" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : chartType === "line" ? (
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="registrations" 
                        name="New Registrations" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="approvals" 
                        name="Approvals" 
                        stroke={theme.palette.success.main} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Side Charts */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Status Distribution Pie Chart */}
            <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Status Distribution
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} labs`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={1} mt={2}>
                  {statusData.map((item, index) => (
                    <Stack key={index} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                        <Typography variant="body2">{item.name}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {item.value} labs
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Category Bar Chart */}
            <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Labs by Category
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        width={80}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="labs" 
                        fill={theme.palette.primary.main}
                        radius={[0, 4, 4, 0]}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={theme.palette.primary.main} opacity={0.7 + (index * 0.05)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Additional Charts Row */}
      <Grid container spacing={3} mt={2}>
        {/* Approval Trend Line Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Approval Trend
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="approved" 
                      name="Approved Labs" 
                      stroke={theme.palette.success.main} 
                      fill={alpha(theme.palette.success.main, 0.1)}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pending" 
                      name="Pending Labs" 
                      stroke={theme.palette.warning.main} 
                      fill={alpha(theme.palette.warning.main, 0.1)}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Comparison Radar Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Performance Metrics
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { metric: 'Approval Rate', value: stats.approvalRate, fullMark: 100 },
                    { metric: 'Active Labs', value: (stats.approvedLabs / stats.totalLabs) * 100, fullMark: 100 },
                    { metric: 'Growth', value: 75, fullMark: 100 },
                    { metric: 'Efficiency', value: 85, fullMark: 100 },
                    { metric: 'Capacity', value: 60, fullMark: 100 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Current"
                      dataKey="value"
                      stroke={theme.palette.primary.main}
                      fill={alpha(theme.palette.primary.main, 0.2)}
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Data Table */}
      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mt: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Laboratory Registrations
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell>Lab Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell align="right">Tests Available</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <TableRow key={row} hover>
                    <TableCell>Lab {row}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={row % 3 === 0 ? "Pending" : "Active"} 
                        color={row % 3 === 0 ? "warning" : "success"}
                      />
                    </TableCell>
                    <TableCell>General Pathology</TableCell>
                    <TableCell>2024-03-{10 + row}</TableCell>
                    <TableCell align="right">{150 + row * 10}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}