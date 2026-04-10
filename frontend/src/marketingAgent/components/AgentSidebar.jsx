import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Divider, Collapse, IconButton, Tooltip, Avatar, Typography,
  useMediaQuery, useTheme
} from '@mui/material'

import {
  Home, WorkHistory, QuestionAnswer, Inventory2, ShoppingCart,
  Receipt, MenuBook, EmojiEvents, Logout, ExpandLess, ExpandMore,
  ChevronLeft, ChevronRight, Close as CloseIcon
} from '@mui/icons-material'

import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

const SIDEBAR_WIDTH = 248
const COLLAPSED_WIDTH = 68

const AgentSidebar = ({ darkMode, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [openOrders, setOpenOrders] = useState(false)
  const [openBilling, setOpenBilling] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const isCollapsed = !isMobile && collapsed

  const menu = [
    { text: 'Home',               icon: <Home />,         path: '/agent/dashboard' },
    { text: 'Job Activity',       icon: <WorkHistory />,  path: '/agent/job-activity' },
    { text: 'Responses',          icon: <QuestionAnswer />, path: '/agent/responses' },
    { text: 'Products',           icon: <Inventory2 />,   path: '/agent/products' },
    {
      text: 'Orders', icon: <ShoppingCart />,
      children: [
        { text: 'Create Bill/Challan/Quote',    path: '/agent/orders/create-bill' },
      ]
    },
    {
      text: 'Billing', icon: <Receipt />,
      children: [
        { text: 'Invoices',        path: '/agent/orders/invoices' },
        { text: 'Payment History', path: '/agent/orders/payments' }
      ]
    },
    { text: 'Training & Meeting', icon: <MenuBook />,     path: '/agent/training-meeting' },
    { text: 'Points & Payout',    icon: <EmojiEvents />,  path: '/agent/points-payout' },
    { text: ' Profile',    icon: <Avatar />,  path: '/agent/profile' },

  ]

  useEffect(() => {
    if (['/agent/orders/create-bill', '/agent/orders/create-challan'].includes(location.pathname))
      setOpenOrders(true)
    if (['/agent/billing/invoices', '/agent/billing/payment-history'].includes(location.pathname))
      setOpenBilling(true)
  }, [location.pathname])

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) onMobileClose?.()
  }, [location.pathname])

  const logout = () => {
    localStorage.removeItem('agentToken')
    toast.success('Logged out successfully')
    navigate('/agent/login')
  }

  const toggleMap = {
    Orders: { state: openOrders, setter: setOpenOrders },
    Billing: { state: openBilling, setter: setOpenBilling }
  }

  const bg = darkMode ? '#0f172a' : '#1d4ed8'
  const activeBg = 'rgba(255,255,255,0.18)'
  const hoverBg  = 'rgba(255,255,255,0.10)'
  const accent   = '#facc15'

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        px: isCollapsed ? 0 : 2, py: 1.5, minHeight: 64,
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}>
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Avatar sx={{
              width: 34, height: 34, bgcolor: accent,
              color: '#1d4ed8', fontWeight: 800, fontSize: 14
            }}>MA</Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'white', lineHeight: 1.2 }}>
                Marketing Agent
              </Typography>
              <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
                FIELD PORTAL
              </Typography>
            </Box>
          </Box>
        )}

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small" sx={{
            color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)', width: 28, height: 28,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', color: 'white' }
          }}>
            {collapsed ? <ChevronRight sx={{ fontSize: 16 }} /> : <ChevronLeft sx={{ fontSize: 16 }} />}
          </IconButton>
        )}

        {/* Mobile close (X) button inside drawer header */}
        {isMobile && (
          <IconButton onClick={onMobileClose} size="small" sx={{ color: 'white', ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* ── NAV ITEMS ── */}
      <List sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.5, px: 0.75 }}>
        {menu.map(item => {
          const isActive = location.pathname === item.path

          if (item.children) {
            const { state: isOpen, setter: setIsOpen } = toggleMap[item.text]
            const isChildActive = item.children.some(sub => sub.path === location.pathname)

            return (
              <Box key={item.text}>
                <Tooltip title={isCollapsed ? item.text : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => {
                      if (isCollapsed) { setCollapsed(false); setTimeout(() => setIsOpen(true), 220) }
                      else setIsOpen(!isOpen)
                    }}
                    sx={{
                      borderRadius: '10px', mb: 0.4, px: 1.5,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      bgcolor: isChildActive ? activeBg : 'transparent',
                      borderLeft: isChildActive ? `3px solid ${accent}` : '3px solid transparent',
                      '&:hover': { bgcolor: hoverBg }, transition: 'all 0.15s ease',
                    }}
                  >
                    <ListItemIcon sx={{
                      color: isChildActive ? accent : 'rgba(255,255,255,0.8)',
                      minWidth: isCollapsed ? 0 : 38, justifyContent: 'center',
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                      <>
                        <ListItemText primary={item.text} primaryTypographyProps={{
                          fontSize: 13.5, fontWeight: isChildActive ? 700 : 500,
                          color: isChildActive ? 'white' : 'rgba(255,255,255,0.85)',
                        }} />
                        {isOpen
                          ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                          : <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                        }
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>

                {!isCollapsed && (
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding
                      sx={{ ml: 1.5, pl: 1, borderLeft: '1px dashed rgba(255,255,255,0.2)' }}>
                      {item.children.map(sub => {
                        const subActive = location.pathname === sub.path
                        return (
                          <ListItemButton key={sub.text} onClick={() => navigate(sub.path)} sx={{
                            borderRadius: '8px', mb: 0.3, py: 0.7, pl: 2,
                            bgcolor: subActive ? activeBg : 'transparent',
                            '&:hover': { bgcolor: hoverBg }, transition: 'all 0.15s ease',
                          }}>
                            <Box sx={{
                              width: 6, height: 6, borderRadius: '50%',
                              bgcolor: subActive ? accent : 'rgba(255,255,255,0.35)',
                              mr: 1.5, flexShrink: 0
                            }} />
                            <ListItemText primary={sub.text} primaryTypographyProps={{
                              fontSize: 12.5, fontWeight: subActive ? 700 : 400,
                              color: subActive ? 'white' : 'rgba(255,255,255,0.7)',
                            }} />
                          </ListItemButton>
                        )
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            )
          }

          return (
            <Tooltip key={item.text} title={isCollapsed ? item.text : ''} placement="right" arrow>
              <ListItemButton onClick={() => navigate(item.path)} sx={{
                borderRadius: '10px', mb: 0.4, px: 1.5,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                bgcolor: isActive ? activeBg : 'transparent',
                borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                '&:hover': { bgcolor: hoverBg }, transition: 'all 0.15s ease',
              }}>
                <ListItemIcon sx={{
                  color: isActive ? accent : 'rgba(255,255,255,0.8)',
                  minWidth: isCollapsed ? 0 : 38, justifyContent: 'center',
                }}>
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText primary={item.text} primaryTypographyProps={{
                    fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.85)',
                  }} />
                )}
              </ListItemButton>
            </Tooltip>
          )
        })}
      </List>

      {/* ── LOGOUT ── */}
      <Box sx={{ px: 0.75, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Tooltip title={isCollapsed ? 'Logout' : ''} placement="right" arrow>
          <ListItemButton onClick={logout} sx={{
            borderRadius: '10px', px: 1.5,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.18)' }, transition: 'all 0.15s ease',
          }}>
            <ListItemIcon sx={{
              color: 'rgba(255,150,150,0.85)',
              minWidth: isCollapsed ? 0 : 38, justifyContent: 'center',
            }}>
              <Logout />
            </ListItemIcon>
            {!isCollapsed && (
              <ListItemText primary="Logout" primaryTypographyProps={{
                fontSize: 13.5, fontWeight: 500, color: 'rgba(255,150,150,0.85)',
              }} />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  )

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }} // Better mobile performance
      sx={{
        width: isMobile ? SIDEBAR_WIDTH : currentWidth,
        flexShrink: 0,
        transition: 'width 0.25s ease',
        '& .MuiDrawer-paper': {
          width: isMobile ? SIDEBAR_WIDTH : currentWidth,
          boxSizing: 'border-box',
          background: bg,
          color: 'white',
          border: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          transition: 'width 0.25s ease',
          overflowX: 'hidden',
        }
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default AgentSidebar