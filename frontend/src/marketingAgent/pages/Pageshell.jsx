// PageShell.jsx

import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const PageShell = ({ title, subtitle, action, breadcrumb = [], children }) => {
  const navigate = useNavigate()
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* ── header ── */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          {breadcrumb.length > 0 && (
            <Breadcrumbs sx={{ mb: 0.5, fontSize: 12 }}>
              {breadcrumb.map((b, i) =>
                b.path
                  ? <Link key={i} underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: 12 }} onClick={() => navigate(b.path)}>{b.label}</Link>
                  : <Typography key={i} sx={{ fontSize: 12, color: 'text.primary' }}>{b.label}</Typography>
              )}
            </Breadcrumbs>
          )}
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 22 }, color: 'text.primary', lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>{subtitle}</Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
      {children}
    </Box>
  )
}

export default PageShell