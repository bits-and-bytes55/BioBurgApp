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
  useTheme,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Switch,
  Tooltip
} from '@mui/material';
import {
  AttachMoney,
  Person,
  Groups,
  TrendingUp,
  TrendingDown,
  Download,
  FilterList,
  Refresh,
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  CalendarToday,
  AccountBalanceWallet,
  PieChart,
  Receipt,
  CheckCircle,
  Pending,
  Error,
  Search,
  DateRange,
  TrendingFlat
} from '@mui/icons-material';

// Mock data
const commissionTiers = [
  { id: 1, name: 'Bronze', target: 5000, rate: 5, color: '#cd7f32' },
  { id: 2, name: 'Silver', target: 15000, rate: 7.5, color: '#c0c0c0' },
  { id: 3, name: 'Gold', target: 30000, rate: 10, color: '#ffd700' },
  { id: 4, name: 'Platinum', target: 50000, rate: 12.5, color: '#e5e4e2' },
];

const agents = [
  { id: 1, name: 'Alex Johnson', avatar: 'AJ', sales: 42500, commission: 4250, tier: 'Gold', status: 'active' },
  { id: 2, name: 'Sarah Miller', avatar: 'SM', sales: 28500, commission: 2137.5, tier: 'Silver', status: 'active' },
  { id: 3, name: 'Mike Chen', avatar: 'MC', sales: 18500, commission: 925, tier: 'Bronze', status: 'active' },
  { id: 4, name: 'Emma Wilson', avatar: 'EW', sales: 62000, commission: 7750, tier: 'Platinum', status: 'active' },
  { id: 5, name: 'David Brown', avatar: 'DB', sales: 12500, commission: 625, tier: 'Bronze', status: 'inactive' },
];

const commissionHistory = [
  { id: 1, agent: 'Alex Johnson', date: '2023-07-15', amount: 1250, type: 'Sale', status: 'paid', reference: 'INV-7894' },
  { id: 2, agent: 'Sarah Miller', date: '2023-07-14', amount: 850, type: 'Sale', status: 'pending', reference: 'INV-7893' },
  { id: 3, agent: 'Mike Chen', date: '2023-07-13', amount: 420, type: 'Bonus', status: 'paid', reference: 'BON-234' },
  { id: 4, agent: 'Emma Wilson', date: '2023-07-12', amount: 2100, type: 'Sale', status: 'paid', reference: 'INV-7891' },
  { id: 5, agent: 'Alex Johnson', date: '2023-07-10', amount: 950, type: 'Sale', status: 'paid', reference: 'INV-7890' },
  { id: 6, agent: 'David Brown', date: '2023-07-09', amount: 375, type: 'Sale', status: 'rejected', reference: 'INV-7889' },
];

const upcomingPayouts = [
  { id: 1, agent: 'Alex Johnson', amount: 2450, dueDate: '2023-07-25', status: 'pending' },
  { id: 2, agent: 'Sarah Miller', amount: 1850, dueDate: '2023-07-25', status: 'pending' },
  { id: 3, agent: 'Mike Chen', amount: 920, dueDate: '2023-07-25', status: 'pending' },
  { id: 4, agent: 'Emma Wilson', amount: 3150, dueDate: '2023-07-25', status: 'pending' },
];

const Commission = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('monthly');
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [commissionRate, setCommissionRate] = useState(8.5);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPayout, setAutoPayout] = useState(true);

  // Calculate totals
  const totalCommission = agents.reduce((sum, agent) => sum + agent.commission, 0);
  const totalSales = agents.reduce((sum, agent) => sum + agent.sales, 0);
  const activeAgents = agents.filter(agent => agent.status === 'active').length;

  // Simulate data loading
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle fontSize="small" />;
      case 'pending': return <Pending fontSize="small" />;
      case 'rejected': return <Error fontSize="small" />;
      default: return null;
    }
  };

  const renderTierProgress = (agent) => {
    const currentTierIndex = commissionTiers.findIndex(tier => tier.name === agent.tier);
    const nextTier = commissionTiers[currentTierIndex + 1];
    
    if (!nextTier) return null;
    
    const progress = (agent.sales / nextTier.target) * 100;
    
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Progress to {nextTier.name}: ${agent.sales.toLocaleString()} / ${nextTier.target.toLocaleString()}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(progress, 100)}
          sx={{ 
            mt: 0.5,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: `linear-gradient(90deg, ${commissionTiers[currentTierIndex].color}, ${nextTier.color})`
            }
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWallet sx={{ mr: 2, color: theme.palette.primary.main }} />
            Commission Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track, calculate, and manage agent commissions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => alert('Export commission data')}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Agent
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Commission
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +12.5% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Sales
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                ${totalSales.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  +8.2% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Groups sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Active Agents
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {activeAgents}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 12 } }}>
                  {agents.filter(a => a.status === 'active').slice(0, 4).map(agent => (
                    <Tooltip key={agent.id} title={agent.name}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>{agent.avatar}</Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PieChart sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg. Commission Rate
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {commissionRate}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <Slider 
                    size="small"
                    value={commissionRate}
                    onChange={(e, newValue) => setCommissionRate(newValue)}
                    min={1}
                    max={20}
                    step={0.5}
                    sx={{ width: 100, mr: 1 }}
                  />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls and Tabs */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search agents or commissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Time Period
                </Typography>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  startAdornment={<DateRange sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="weekly">This Week</MenuItem>
                  <MenuItem value="monthly">This Month</MenuItem>
                  <MenuItem value="quarterly">This Quarter</MenuItem>
                  <MenuItem value="yearly">This Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => alert('Open advanced filters')}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
          
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Agents Overview" icon={<Person />} iconPosition="start" />
            <Tab label="Commission History" icon={<Receipt />} iconPosition="start" />
            <Tab label="Upcoming Payouts" icon={<CalendarToday />} iconPosition="start" />
            <Tab label="Tier Settings" icon={<TrendingFlat />} iconPosition="start" />
          </Tabs>
        </CardContent>
      </Card>

      {/* Tab Content - Agents Overview */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Agent Performance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Auto Payout
                    </Typography>
                    <Switch 
                      size="small" 
                      checked={autoPayout} 
                      onChange={(e) => setAutoPayout(e.target.checked)} 
                    />
                  </Box>
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell align="right">Total Sales</TableCell>
                        <TableCell align="right">Commission</TableCell>
                        <TableCell>Tier</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2, width: 32, height: 32 }}>
                                {agent.avatar}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {agent.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Agent #{agent.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              ${agent.sales.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                              ${agent.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {commissionTiers.find(t => t.name === agent.tier)?.rate}% rate
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={agent.tier}
                              size="small"
                              sx={{ 
                                backgroundColor: commissionTiers.find(t => t.name === agent.tier)?.color + '20',
                                color: commissionTiers.find(t => t.name === agent.tier)?.color,
                                fontWeight: 'bold',
                                borderRadius: 1
                              }}
                            />
                            {renderTierProgress(agent)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={agent.status === 'active' ? 'Active' : 'Inactive'} 
                              size="small"
                              color={agent.status === 'active' ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => setEditDialogOpen(true)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <Visibility fontSize="small" />
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
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Commission Tiers
                </Typography>
                
                {commissionTiers.map((tier) => (
                  <Card 
                    key={tier.id} 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderLeft: `4px solid ${tier.color}`,
                      backgroundColor: tier.color + '10'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: tier.color,
                                mr: 1
                              }} 
                            />
                            {tier.name} Tier
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Target: ${tier.target.toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {tier.rate}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {agents.filter(a => a.tier === tier.name).length} agents in this tier
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                
                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Edit />}
                    onClick={() => alert('Edit commission tiers')}
                  >
                    Configure Tiers
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Content - Commission History */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Commission History
              </Typography>
              <Button size="small" onClick={() => alert('View full history')}>
                View All History
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissionHistory.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.agent}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.reference} 
                          size="small" 
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.type} 
                          size="small" 
                          color={item.type === 'Sale' ? 'primary' : 'secondary'}
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getStatusIcon(item.status)}
                          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          size="small"
                          color={getStatusColor(item.status)}
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => alert(`View details for ${item.reference}`)}>
                          <Visibility fontSize="small" />
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
      )}

      {/* Tab Content - Upcoming Payouts */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Upcoming Payouts
                  <Chip 
                    label="Due: July 25, 2023" 
                    size="small" 
                    color="warning"
                    sx={{ ml: 2 }}
                  />
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.grey[50] }}>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcomingPayouts.map((payout) => (
                        <TableRow key={payout.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {payout.agent}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                              ${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(payout.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="Pending" 
                              size="small"
                              color="warning"
                              sx={{ borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => alert(`Process payment for ${payout.agent}`)}
                            >
                              Process
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Payout: ${upcomingPayouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  <Button 
                    variant="contained"
                    startIcon={<AttachMoney />}
                    onClick={() => alert('Process all payouts')}
                  >
                    Process All Payouts
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Quick Actions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<AttachMoney />}
                    onClick={() => alert('Run commission calculation')}
                  >
                    Calculate Commissions
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Receipt />}
                    onClick={() => alert('Generate commission statements')}
                  >
                    Generate Statements
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Download />}
                    onClick={() => alert('Download payout report')}
                  >
                    Export Payout Report
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => alert('Add manual commission')}
                  >
                    Add Manual Commission
                  </Button>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Commission Summary
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    This Month:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Month:
                  </Typography>
                  <Typography variant="body2">
                    ${(totalCommission * 0.89).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    YTD Total:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    ${(totalCommission * 6.5).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Content - Tier Settings */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Commission Tier Configuration
            </Typography>
            
            <Grid container spacing={3}>
              {commissionTiers.map((tier) => (
                <Grid item xs={12} md={6} key={tier.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              backgroundColor: tier.color,
                              mr: 1
                            }} 
                          />
                          {tier.name} Tier
                        </Typography>
                        <IconButton size="small" onClick={() => alert(`Edit ${tier.name} tier`)}>
                          <Edit />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Sales Target
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          ${tier.target.toLocaleString()}+
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Commission Rate
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                          {tier.rate}%
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Agents in Tier
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 } }}>
                            {agents.filter(a => a.tier === tier.name).slice(0, 4).map(agent => (
                              <Tooltip key={agent.id} title={agent.name}>
                                <Avatar sx={{ bgcolor: tier.color }}>{agent.avatar}</Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                          <Typography variant="body2" sx={{ ml: 2 }}>
                            {agents.filter(a => a.tier === tier.name).length} agents
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<Add />}
                onClick={() => alert('Add new tier')}
              >
                Add New Tier
              </Button>
              <Button 
                variant="contained"
                onClick={() => alert('Save tier configuration')}
              >
                Save Configuration
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Agent</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new agent to the commission system
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email Address" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Initial Tier
                </Typography>
                <Select defaultValue="Bronze">
                  {commissionTiers.map(tier => (
                    <MenuItem key={tier.id} value={tier.name}>{tier.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Commission Rate Override
                </Typography>
                <TextField 
                  size="small"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  defaultValue={5}
                />
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setAddDialogOpen(false); alert('Agent added!'); }}>
            Add Agent
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Agent Commission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Modify agent commission settings
          </Typography>
          {/* Similar form to add dialog but with existing data */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setEditDialogOpen(false); alert('Changes saved!'); }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Commission;