// pages/reports/Reports.jsx  — unified reports hub
import { useState } from 'react'
import {
  Box, Paper, Grid, Typography, Button, Tabs, Tab, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Chip,
} from '@mui/material'
import { FileDownload, BarChart, Print } from '@mui/icons-material'
import PageShell from './Pageshell'
import StatCard from './Statcard'

const REPORT_TABS = [
  'Daily Call Report', 'Monthly Sales', 'Product-Wise Sales',
  'Doctor Coverage', 'Chemist Coverage', 'MR Performance',
  'Incentive Report', 'Sample Distribution', 'Work Profile',
]

const MOCK_DCR = Array.from({ length: 8 }, (_, i) => ({
  date: `2025-04-${String(i + 1).padStart(2, '0')}`, doctor: ['Dr. Sharma', 'Dr. Kapoor', 'Dr. Singh'][i % 3],
  area: ['Andheri', 'Bandra', 'Juhu'][i % 3], calls: 8 + i, orders: i % 3, samples: 5 + i,
}))

const MOCK_SALES = [
  { product: 'Biocef 500mg', units: 340, value: '₹68,000', growth: '+12%' },
  { product: 'BioPain Gel',  units: 280, value: '₹42,000', growth: '+5%'  },
  { product: 'BioFlu Tab',   units: 410, value: '₹41,000', growth: '-3%'  },
  { product: 'BioVit Syrup', units: 190, value: '₹28,500', growth: '+18%' },
]

export default function Reports() {
  const [tab, setTab] = useState(0)

  const renderTable = () => {
    switch (tab) {
      case 0: return (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'background.default' }}>
              {['Date', 'Doctor', 'Area', 'Calls', 'Orders', 'Samples'].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {MOCK_DCR.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontSize: 12 }}>{r.date}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{r.doctor}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{r.area}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{r.calls}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{r.orders}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{r.samples}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
      case 1: case 2: return (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'background.default' }}>
              {['Product', 'Units Sold', 'Revenue', 'Growth'].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {MOCK_SALES.map(r => (
                <TableRow key={r.product} hover>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{r.product}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{r.units}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{r.value}</TableCell>
                  <TableCell><Chip label={r.growth} size="small" color={r.growth.startsWith('+') ? 'success' : 'error'} sx={{ fontSize: 11 }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
      default: return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <BarChart sx={{ fontSize: 56, opacity: 0.3, mb: 1 }} />
          <Typography>Select filters and click Generate Report to view data</Typography>
        </Box>
      )
    }
  }

  return (
    <PageShell title="Reports" subtitle="Generate and export field reports"
      breadcrumb={[{ label: 'Reports & Analytics' }, { label: 'Reports' }]}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<FileDownload />} variant="outlined" size="small">Export CSV</Button>
          <Button startIcon={<Print />} variant="outlined" size="small">Print</Button>
        </Box>
      }
    >
      {/* filter bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="From Date" type="date" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="To Date" type="date" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth size="small" select label="Area" defaultValue="All"><MenuItem value="All">All Areas</MenuItem>{['Andheri','Bandra','Juhu'].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} sm={3}><Button fullWidth variant="contained" size="small">Generate Report</Button></Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ '& .MuiTab-root': { fontSize: 12, minWidth: 'auto', px: 2, py: 1.5 } }}>
            {REPORT_TABS.map((r, i) => <Tab key={i} label={r} />)}
          </Tabs>
        </Box>
        {renderTable()}
      </Paper>
    </PageShell>
  )
}