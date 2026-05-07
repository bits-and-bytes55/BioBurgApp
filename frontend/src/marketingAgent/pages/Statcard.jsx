// StatCard.jsx — reusable KPI card
import { Box, Typography, Paper } from '@mui/material'

const StatCard = ({ label, value, sub, color = '#1d4ed8', icon }) => (
  <Paper elevation={0} sx={{
    p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
    display: 'flex', alignItems: 'center', gap: 2,
    transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 },
  }}>
    {icon && (
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </Box>
    )}
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.3 }}>{sub}</Typography>}
    </Box>
  </Paper>
)

export default StatCard