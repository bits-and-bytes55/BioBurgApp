// layouts/AgentLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, IconButton, AppBar, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AgentSidebar from '../components/AgentSidebar' // adjust path as needed

const SIDEBAR_WIDTH   = 248
const COLLAPSED_WIDTH = 68

export default function AgentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme   = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>

      {/* ── SIDEBAR ── */}
      <AgentSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── MAIN AREA ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,          // prevent flex overflow
          display: 'flex',
          flexDirection: 'column',
          // On desktop push content right of sidebar
          ml: isMobile ? 0 : 0, // MUI permanent drawer handles its own width
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: '#1d4ed8',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              zIndex: theme.zIndex.drawer - 1,
            }}
          >
            <Toolbar sx={{ minHeight: '56px !important', px: 1.5 }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1.5 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'white', letterSpacing: '0.02em' }}>
                Marketing Agent Portal
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Page content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}