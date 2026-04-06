import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  MenuItem,
  FormControl,
  Select,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Download,
  FilterList,
  Refresh,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  ShowChart,
  DateRange,
  MoreVert
} from '@mui/icons-material';

// Mock data for charts and tables
const salesData = [
  { month: 'Jan', revenue: 12500, growth: 12 },
  { month: 'Feb', revenue: 18900, growth: 18 },
  { month: 'Mar', revenue: 15200, growth: 8 },
  { month: 'Apr', revenue: 21800, growth: 22 },
  { month: 'May', revenue: 19400, growth: 15 },
  { month: 'Jun', revenue: 25600, growth: 28 },
];

const categoryData = [
  { name: 'Electronics', value: 35, color: '#4e79a7' },
  { name: 'Clothing', value: 25, color: '#f28e2c' },
  { name: 'Home Goods', value: 20, color: '#e15759' },
  { name: 'Books', value: 12, color: '#76b7b2' },
  { name: 'Other', value: 8, color: '#59a14f' },
];

const recentReports = [
  { id: 1, name: 'Q2 Sales Analysis', date: '2023-06-30', type: 'Sales', status: 'Completed' },
  { id: 2, name: 'Customer Demographics', date: '2023-07-15', type: 'Marketing', status: 'In Progress' },
  { id: 3, name: 'Inventory Audit', date: '2023-07-10', type: 'Operations', status: 'Completed' },
  { id: 4, name: 'Website Traffic', date: '2023-07-18', type: 'Web Analytics', status: 'Pending' },
  { id: 5, name: 'Financial Summary', date: '2023-07-05', type: 'Finance', status: 'Completed' },
];

const Reports = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('monthly');
  const [reportType, setReportType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate data loading
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleDownloadReport = (id) => {
    alert(`Downloading report #${id}`);
  };

  // Simple chart components (in a real app, you'd use a charting library)
  const renderSimpleBarChart = () => {
    const maxRevenue = Math.max(...salesData.map(item => item.revenue));
    
    return (
      <Box sx={{ mt: 2 }}>
        {salesData.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ width: 40 }}>{item.month}</Typography>
            <Box sx={{ flexGrow: 1, ml: 2, mr: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={(item.revenue / maxRevenue) * 100}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              />
            </Box>
            <Box sx={{ textAlign: 'right', minWidth: 100 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ${item.revenue.toLocaleString()}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: item.growth >= 0 ? 'success.main' : 'error.main',
                  display: 'flex', 
                  alignItems: 'center'
                }}
              >
                {item.growth >= 0 ? <TrendingUp fontSize="inherit" /> : <TrendingDown fontSize="inherit" />}
                {Math.abs(item.growth)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const renderSimplePieChart = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
          {categoryData.map((item, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                width: '45%'
              }}
            >
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: item.color,
                  mr: 1
                }} 
              />
              <Typography variant="body2" sx={{ flexGrow: 1 }}>{item.name}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.value}%</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analyze your data and generate insights
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => alert('Export all reports')}
          >
            Export All
          </Button>
          <Button
            variant="contained"
            startIcon={<FilterList />}
            onClick={() => alert('Open filter panel')}
          >
            Filters
          </Button>
        </Box>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Time Range
                </Typography>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  startAdornment={<DateRange sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Report Type
                </Typography>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="all">All Reports</MenuItem>
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="operations">Operations</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BarChart sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                $124,580
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +18.5% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChart sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg. Order Value
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                $84.20
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +5.2% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PieChart sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Conversion Rate
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                3.42%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
                <Typography variant="body2" color="error.main">
                  -0.8% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DateRange sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Reports Generated
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                142
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Last 30 days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Revenue Trends
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {renderSimpleBarChart()}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Sales by Category
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {renderSimplePieChart()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Reports Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Recent Reports
            </Typography>
            <Button size="small" onClick={() => alert('View all reports')}>
              View All
            </Button>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableRow>
                  <TableCell>Report Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {report.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(report.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.type} 
                        size="small" 
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.status} 
                        size="small"
                        color={
                          report.status === 'Completed' ? 'success' : 
                          report.status === 'In Progress' ? 'warning' : 'default'
                        }
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Quick Actions Footer */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={() => alert('Schedule a new report')}>
          Schedule Report
        </Button>
        <Button variant="contained" onClick={() => alert('Generate a new report')}>
          Generate New Report
        </Button>
      </Box>
    </Box>
  );
};

export default Reports;