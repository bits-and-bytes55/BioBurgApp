import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha,
  LinearProgress,
  Fade,
  Divider
} from "@mui/material";
import {
  Refresh,
  People,
  PendingActions,
  CheckCircle,
  Block,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  Download,
  MoreVert,
  MedicalServices,
  VerifiedUser,
  ErrorOutline,
  BarChart,
  PieChart,
  Timeline
} from "@mui/icons-material";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ===== COMPACT STAT CARD ===== */
const CompactStatCard = ({ 
  title, 
  value, 
  color, 
  icon: Icon, 
  change, 
  loading,
  onClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card 
      onClick={onClick}
      sx={{
        borderRadius: 2,
        height: '100%',
        minHeight: 120,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        backgroundColor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: color,
        } : {},
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '8px',
            backgroundColor: alpha(color, 0.1),
            color: color,
          }}>
            {Icon && <Icon fontSize="small" />}
          </Box>
          
          {change !== undefined && !loading && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5 
            }}>
              {change >= 0 ? (
                <ArrowUpward sx={{ fontSize: 14, color: '#2e7d32' }} />
              ) : (
                <ArrowDownward sx={{ fontSize: 14, color: '#d32f2f' }} />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: change >= 0 ? '#2e7d32' : '#d32f2f',
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }}
              >
                {Math.abs(change)}%
              </Typography>
            </Box>
          )}
        </Box>
        
        {loading ? (
          <Skeleton 
            variant="text" 
            width={40} 
            height={32} 
            sx={{ mt: 0.5 }} 
          />
        ) : (
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            sx={{ 
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              color: 'text.primary'
            }}
          >
            {value}
          </Typography>
        )}
        
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            fontWeight: 500,
            fontSize: '0.75rem',
            display: 'block',
            mt: 0.5
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

/* ===== STATUS DISTRIBUTION CHART ===== */
const StatusDistributionChart = ({ data, loading }) => {
  const theme = useTheme();
  
  const chartData = data ? [
    { name: 'Active', value: data.approved, color: '#2e7d32' },
    { name: 'Pending', value: data.pending, color: '#ed6c02' },
    { name: 'Blocked', value: data.blocked, color: '#d32f2f' },
  ] : [];
  
  const total = data ? data.total : 1;
  
  return (
    <Card sx={{ 
      borderRadius: 2,
      height: '100%',
      minHeight: 280
    }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Typography 
          variant="subtitle1" 
          fontWeight="600" 
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PieChart fontSize="small" /> Status Distribution
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => [`${value} doctors`, 'Count']}
                  contentStyle={{ borderRadius: 8 }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
              {chartData.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: item.color 
                  }} />
                  <Typography variant="caption">
                    {item.name} ({((item.value / total) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/* ===== MONTHLY TREND CHART ===== */
const MonthlyTrendChart = ({ data, loading }) => {
  const theme = useTheme();
  
  // Mock data for monthly trends
  const monthlyData = [
    { month: 'Jan', active: 45, pending: 12, blocked: 3 },
    { month: 'Feb', active: 52, pending: 8, blocked: 4 },
    { month: 'Mar', active: 48, pending: 15, blocked: 2 },
    { month: 'Apr', active: 60, pending: 10, blocked: 5 },
    { month: 'May', active: 65, pending: 5, blocked: 6 },
    { month: 'Jun', active: 70, pending: 3, blocked: 7 },
  ];
  
  return (
    <Card sx={{ 
      borderRadius: 2,
      height: '100%',
      minHeight: 280
    }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Typography 
          variant="subtitle1" 
          fontWeight="600" 
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Timeline fontSize="small" /> Monthly Trends
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(value) => [value, 'Doctors']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#2e7d32" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Active"
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#ed6c02" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Pending"
                />
                <Line 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#d32f2f" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Blocked"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/* ===== APPROVAL RATE BAR CHART ===== */
const ApprovalRateChart = ({ data, loading }) => {
  const theme = useTheme();
  
  const chartData = data ? [
    { 
      name: 'Approval Rate', 
      value: ((data.approved / Math.max(data.total, 1)) * 100).toFixed(1),
      fill: '#2e7d32'
    },
    { 
      name: 'Pending Rate', 
      value: ((data.pending / Math.max(data.total, 1)) * 100).toFixed(1),
      fill: '#ed6c02'
    },
    { 
      name: 'Block Rate', 
      value: ((data.blocked / Math.max(data.total, 1)) * 100).toFixed(1),
      fill: '#d32f2f'
    },
  ] : [];
  
  return (
    <Card sx={{ 
      borderRadius: 2,
      height: '100%',
      minHeight: 280
    }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Typography 
          variant="subtitle1" 
          fontWeight="600" 
          sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <BarChart fontSize="small" /> Approval Metrics
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="name" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                  label={{ 
                    value: 'Percentage (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fontSize: 12 
                  }}
                />
                <RechartsTooltip 
                  formatter={(value) => [`${value}%`, 'Rate']}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fontSize: 12 }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Doctors
                </Typography>
                <Typography variant="h6" fontWeight="600">
                  {data?.total || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Approval Rate
                </Typography>
                <Typography variant="h6" fontWeight="600" color="#2e7d32">
                  {((data?.approved / Math.max(data?.total, 1)) * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Action Required
                </Typography>
                <Typography variant="h6" fontWeight="600" color="#ed6c02">
                  {data?.pending || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default function DoctorOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const token = localStorage.getItem("adminToken");

  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const res = await axios.get(
        `${BASE_URL}/api/admin/doctors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const doctors = res.data.data || [];

      const total = doctors.length;
      const pending = doctors.filter(
        (d) => d.status === "pending"
      ).length;
      const approved = doctors.filter(
        (d) => d.status === "approved" && d.isActive
      ).length;
      const blocked = doctors.filter(
        (d) => d.status === "approved" && !d.isActive
      ).length;

      setStats({
        total,
        pending,
        approved,
        blocked,
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load doctor statistics");
      
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/login/admin";
      }
    } finally {
      setLoading(false);
      if (showRefresh) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login/admin";
      return;
    }
    fetchStats();
  }, [token]);

  const handleRefresh = () => {
    fetchStats(true);
  };

  const statCards = [
    {
      key: 'total',
      title: "Total Doctors",
      value: stats?.total || 0,
      color: "#1976d2",
      icon: People,
      change: 12,
    },
    {
      key: 'pending',
      title: "Pending",
      value: stats?.pending || 0,
      color: "#ed6c02",
      icon: PendingActions,
      change: -5,
    },
    {
      key: 'approved',
      title: "Active",
      value: stats?.approved || 0,
      color: "#2e7d32",
      icon: VerifiedUser,
      change: 8,
    },
    {
      key: 'blocked',
      title: "Blocked",
      value: stats?.blocked || 0,
      color: "#d32f2f",
      icon: Block,
      change: 3,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Box>
            <Typography 
              variant="h5" 
              fontWeight="700"
            >
              Doctor Dashboard
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              Real-time analytics and insights
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading || refreshing}
            sx={{ borderRadius: 1 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              mb: 2, 
              borderRadius: 1,
              fontSize: '0.875rem'
            }}
            icon={<ErrorOutline fontSize="small" />}
          >
            {error}
          </Alert>
        )}

        {/* Compact Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map((card) => (
            <Grid item xs={6} sm={3} key={card.key}>
              <CompactStatCard
                title={card.title}
                value={card.value}
                color={card.color}
                icon={card.icon}
                change={card.change}
                loading={loading}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Charts Section */}
      <Grid container spacing={2}>
        {/* Status Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <StatusDistributionChart data={stats} loading={loading} />
        </Grid>

        {/* Monthly Trend Line Chart */}
        <Grid item xs={12} md={4}>
          <MonthlyTrendChart data={stats} loading={loading} />
        </Grid>

        {/* Approval Rate Bar Chart */}
        <Grid item xs={12} md={4}>
          <ApprovalRateChart data={stats} loading={loading} />
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      {!loading && stats && (
        <Card sx={{ borderRadius: 2, mt: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            
            <Grid container spacing={1}>
              {[
                { doctor: "Dr. Sarah Johnson", action: "approved", time: "2 hours ago", color: "#2e7d32" },
                { doctor: "Dr. Michael Chen", action: "registered", time: "5 hours ago", color: "#1976d2" },
                { doctor: "Dr. Emily Davis", action: "blocked", time: "1 day ago", color: "#d32f2f" },
                { doctor: "Dr. Robert Wilson", action: "pending review", time: "2 days ago", color: "#ed6c02" },
                { doctor: "Dr. Lisa Brown", action: "approved", time: "3 days ago", color: "#2e7d32" },
              ].map((activity, index) => (
                <Grid item xs={12} key={index}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    py: 1,
                    borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: activity.color 
                      }} />
                      <Typography variant="body2" fontWeight="500">
                        {activity.doctor}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          backgroundColor: alpha(activity.color, 0.1),
                          color: activity.color,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontWeight: 500
                        }}
                      >
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            
            <Button 
              fullWidth 
              size="small" 
              sx={{ mt: 1.5 }}
              endIcon={<MoreVert />}
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !stats && (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={3} key={item}>
              <Card sx={{ borderRadius: 2, minHeight: 120 }}>
                <CardContent sx={{ p: 2 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton variant="text" width="60%" height={32} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="40%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Card sx={{ borderRadius: 2, minHeight: 280 }}>
                <CardContent sx={{ p: 2 }}>
                  <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}