import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Divider, Collapse, IconButton, Tooltip, Avatar, Typography,
  useMediaQuery, useTheme
} from '@mui/material'

import {
  WorkHistory,
  QuestionAnswer,
  Inventory2,
  ShoppingCart,
  Receipt,
  MenuBook,
  Logout,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Close as CloseIcon,
  Dashboard,
  Assignment,
  Map,
  GpsFixed,
  AttachMoney,
  TrendingUp,
  Person,
  Campaign,
  Image,
  CalendarMonth,
  SupportAgent,
  Analytics,
  Speed,
  TrackChanges,
  Stars,
  Biotech,
  Route,
  Feedback,
  Leaderboard,
  ManageAccounts,
  BubbleChart,
} from '@mui/icons-material'

import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'

const SIDEBAR_WIDTH = 260
const COLLAPSED_WIDTH = 68

const readJson = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const hasPermission = (permissions, key) => {
  if (!key) return true
  return permissions?.[key] === true
}

const filterMenuByPermissions = (menu, permissions) =>
  menu
    .map((group) => {
      const items = group.items
        .map((item) => {
          if (!hasPermission(permissions, item.permission)) return null

          if (item.children) {
            const children = item.children.filter((child) =>
              hasPermission(permissions, child.permission || item.permission)
            )

            if (children.length === 0) return null

            return { ...item, children }
          }

          return item
        })
        .filter(Boolean)

      return { ...group, items }
    })
    .filter((group) => group.items.length > 0)

const getInitials = (name = 'Marketing Agent') =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MA'

const formatRole = (role = 'marketing_agent') =>
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const AgentSidebar = ({ darkMode, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState({})

  const permissions = useMemo(() => readJson('agentPermissions', {}), [])
  const agentProfile = useMemo(() => readJson('agentProfile', {}), [])

  const isCollapsed = !isMobile && collapsed

  const fullMenu = [
    {
      section: 'Main',
      items: [
        {
          text: 'Dashboard',
          icon: <Dashboard />,
          path: '/agent/dashboard',
          permission: 'dashboard',
        },
      ],
    },

    {
      section: 'Field Work',
      items: [
        {
          text: 'Working Plan',
          icon: <Map />,
          key: 'plan',
          permission: 'workingPlan',
          children: [
            {
              text: 'Everyday Plans',
              path: '/agent/plan/daily',
              permission: 'workingPlan',
            },
          ],
        },
        {
          text: 'Daily Call Report',
          icon: <Assignment />,
          key: 'dcr',
          permission: 'dcr',
          children: [
            { text: 'New DCR Entry', path: '/agent/dcr/new', permission: 'dcr' },
            { text: 'DCR History', path: '/agent/dcr/history', permission: 'dcr' },
            { text: 'End of Day Report', path: '/agent/dcr/eod', permission: 'dcr' },
          ],
        },
        {
          text: 'Geo-Tracking',
          icon: <GpsFixed />,
          path: '/agent/geo-tracking',
          permission: 'geoTracking',
        },
        {
          text: 'Route Planning',
          icon: <Route />,
          path: '/agent/route-planning',
          permission: 'routePlanning',
        },
        {
          text: 'Daily Expenses',
          icon: <AttachMoney />,
          path: '/agent/daily-expenses',
          permission: 'dailyExpenses',
        },
        {
          text: 'Work Performance',
          icon: <Speed />,
          path: '/agent/work-performance',
          permission: 'workPerformance',
        },
      ],
    },

    {
      section: 'CRM',
      items: [
        {
          text: 'Job Activity',
          icon: <WorkHistory />,
          path: '/agent/job-activity',
          permission: 'jobActivity',
        },
        {
          text: 'Responses',
          icon: <QuestionAnswer />,
          path: '/agent/responses',
          permission: 'responses',
        },
      ],
    },

    {
      section: 'Products',
      items: [
        {
          text: 'Product List',
          icon: <Inventory2 />,
          path: '/agent/products',
          permission: 'products',
        },
        {
          text: 'Gift Management',
          icon: <Biotech />,
          path: '/agent/giftmanagement',
          permission: 'giftManagement',
        },
        {
          text: 'Products Feedback',
          icon: <Feedback />,
          path: '/agent/feedback',
          permission: 'productFeedback',
        },
      ],
    },

    {
      section: 'Orders & Billing',
      items: [
        {
          text: 'Create Bill / Challan / Quote',
          icon: <ShoppingCart />,
          path: '/agent/orders/create-bill',
          permission: 'orders',
        },
        {
          text: 'Billing',
          icon: <Receipt />,
          key: 'billing',
          permission: 'billing',
          children: [
            {
              text: 'Invoices',
              path: '/agent/billing/invoices',
              permission: 'billing',
            },
            {
              text: 'Payment History',
              path: '/agent/hr/payment-history',
              permission: 'billing',
            },
            {
              text: 'Bioburg Payments',
              path: '/agent/billing/bioburg-payments',
              permission: 'billing',
            },
          ],
        },
      ],
    },

    {
      section: 'Targets & Payouts',
      items: [
        {
          text: 'Target Management',
          icon: <TrackChanges />,
          path: '/agent/targets/monthly',
          permission: 'targets',
        },
        {
          text: 'Top Performers',
          icon: <Leaderboard />,
          path: '/agent/targets/leaderboard',
          permission: 'targets',
        },
        {
          text: 'Points & Payout',
          icon: <Stars />,
          path: '/agent/points-payout',
          permission: 'pointsPayout',
        },
      ],
    },

    {
      section: 'Marketing',
      items: [
        {
          text: 'Campaign Management',
          icon: <Campaign />,
          path: '/agent/marketing',
          permission: 'marketing',
        },
        {
          text: 'Visual / Digital Ads',
          icon: <Image />,
          path: '/agent/visual-ads',
          permission: 'visualAds',
        },
        {
          text: 'Lead Management',
          icon: <BubbleChart />,
          path: '/agent/leads',
          permission: 'leads',
        },
      ],
    },

    {
      section: 'Reports & Analytics',
      items: [
        {
          text: 'Marketing Chart',
          icon: <Analytics />,
          path: '/agent/marketing-chart',
          permission: 'reports',
        },
        {
          text: 'MR Performance Chart',
          icon: <TrendingUp />,
          path: '/agent/mr-chart',
          permission: 'reports',
        },
      ],
    },

    {
      section: 'HR & Staff',
      items: [
        {
          text: 'Staff Management',
          icon: <ManageAccounts />,
          key: 'staff',
          permission: 'staff',
          children: [
            {
              text: 'Appointment / Designation',
              path: '/agent/hr/appointment',
              permission: 'staff',
            },
            {
              text: 'Staff List',
              path: '/agent/hr/staff-list',
              permission: 'staff',
            },
            {
              text: 'Working Status',
              path: '/agent/hr/working-status',
              permission: 'staff',
            },
          ],
        },
      ],
    },

    {
      section: 'Training & Communication',
      items: [
        {
          text: 'Training & Meeting',
          icon: <MenuBook />,
          path: '/agent/training-meeting',
          permission: 'training',
        },
        {
          text: 'Customer Service',
          icon: <SupportAgent />,
          key: 'support',
          permission: 'support',
          children: [
            {
              text: 'Support Tickets',
              path: '/agent/support-tickets',
              permission: 'support',
            },
            {
              text: 'Workflow Status',
              path: '/agent/workflow-status',
              permission: 'support',
            },
          ],
        },
      ],
    },

    {
      section: 'Planning & Calendar',
      items: [
        {
          text: 'Company Calendar',
          icon: <CalendarMonth />,
          path: '/agent/calendar/company',
          permission: 'calendar',
        },
      ],
    },

    {
      section: 'Account',
      items: [
        {
          text: 'My Profile',
          icon: <Person />,
          path: '/agent/profile',
          permission: 'profile',
        },
      ],
    },
  ]

  const menu = filterMenuByPermissions(fullMenu, permissions)

  const toggleSection = (key) => {
    if (isCollapsed) {
      setCollapsed(false)
      setTimeout(() => setOpenSections((prev) => ({ ...prev, [key]: true })), 220)
    } else {
      setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    }
  }

  useEffect(() => {
    menu.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children) {
          const matched = item.children.some((sub) =>
            location.pathname.startsWith(sub.path)
          )
          if (matched) setOpenSections((prev) => ({ ...prev, [item.key]: true }))
        }
      })
    })
  }, [location.pathname])

  useEffect(() => {
    if (isMobile) onMobileClose?.()
  }, [location.pathname, isMobile, onMobileClose])

  const logout = () => {
    localStorage.removeItem('agentToken')
    localStorage.removeItem('agentProfile')
    localStorage.removeItem('agentPermissions')
    toast.success('Logged out successfully')
    navigate('/agent/login')
  }

  const bg = darkMode ? '#0f172a' : '#1d4ed8'
  const activeBg = 'rgba(255,255,255,0.18)'
  const hoverBg = 'rgba(255,255,255,0.10)'
  const accent = '#facc15'

  const renderItem = (item) => {
    if (item.children) {
      const isOpen = !!openSections[item.key]
      const isChildActive = item.children.some((sub) =>
        location.pathname.startsWith(sub.path)
      )

      return (
        <Box key={item.key}>
          <Tooltip title={isCollapsed ? item.text : ''} placement="right" arrow>
            <ListItemButton
              onClick={() => toggleSection(item.key)}
              sx={{
                borderRadius: '10px',
                mb: 0.4,
                px: 1.5,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                bgcolor: isChildActive ? activeBg : 'transparent',
                borderLeft: isChildActive
                  ? `3px solid ${accent}`
                  : '3px solid transparent',
                '&:hover': { bgcolor: hoverBg },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon
                sx={{
                  color: isChildActive ? accent : 'rgba(255,255,255,0.8)',
                  minWidth: isCollapsed ? 0 : 38,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>

              {!isCollapsed && (
                <>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 13,
                      fontWeight: isChildActive ? 700 : 500,
                      color: isChildActive ? 'white' : 'rgba(255,255,255,0.85)',
                    }}
                  />
                  {isOpen ? (
                    <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                  ) : (
                    <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                  )}
                </>
              )}
            </ListItemButton>
          </Tooltip>

          {!isCollapsed && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List
                component="div"
                disablePadding
                sx={{
                  ml: 1.5,
                  pl: 1,
                  borderLeft: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                {item.children.map((sub) => {
                  const subActive = location.pathname === sub.path

                  return (
                    <ListItemButton
                      key={sub.text}
                      onClick={() => navigate(sub.path)}
                      sx={{
                        borderRadius: '8px',
                        mb: 0.3,
                        py: 0.6,
                        pl: 2,
                        bgcolor: subActive ? activeBg : 'transparent',
                        '&:hover': { bgcolor: hoverBg },
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: subActive ? accent : 'rgba(255,255,255,0.35)',
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      />
                      <ListItemText
                        primary={sub.text}
                        primaryTypographyProps={{
                          fontSize: 12,
                          fontWeight: subActive ? 700 : 400,
                          color: subActive ? 'white' : 'rgba(255,255,255,0.7)',
                        }}
                      />
                    </ListItemButton>
                  )
                })}
              </List>
            </Collapse>
          )}
        </Box>
      )
    }

    const isActive = location.pathname === item.path

    return (
      <Tooltip key={item.text} title={isCollapsed ? item.text : ''} placement="right" arrow>
        <ListItemButton
          onClick={() => navigate(item.path)}
          sx={{
            borderRadius: '10px',
            mb: 0.4,
            px: 1.5,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            bgcolor: isActive ? activeBg : 'transparent',
            borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
            '&:hover': { bgcolor: hoverBg },
            transition: 'all 0.15s ease',
          }}
        >
          <ListItemIcon
            sx={{
              color: isActive ? accent : 'rgba(255,255,255,0.8)',
              minWidth: isCollapsed ? 0 : 38,
              justifyContent: 'center',
            }}
          >
            {item.icon}
          </ListItemIcon>

          {!isCollapsed && (
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'white' : 'rgba(255,255,255,0.85)',
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    )
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          px: isCollapsed ? 0 : 2,
          py: 1.5,
          minHeight: 64,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: accent,
                color: '#1d4ed8',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {getInitials(agentProfile.name)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'white',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 145,
                }}
              >
                {agentProfile.name || 'Marketing Agent'}
              </Typography>

              <Typography
                sx={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatRole(agentProfile.role)} · L{agentProfile.level || 1}
              </Typography>
            </Box>
          </Box>
        )}

        {!isMobile && (
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              bgcolor: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              width: 28,
              height: 28,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', color: 'white' },
            }}
          >
            {collapsed ? (
              <ChevronRight sx={{ fontSize: 16 }} />
            ) : (
              <ChevronLeft sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        )}

        {isMobile && (
          <IconButton onClick={onMobileClose} size="small" sx={{ color: 'white', ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <List
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          px: 0.75,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: 2,
          },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        }}
      >
        {menu.map((group) => (
          <Box key={group.section}>
            {!isCollapsed && (
              <Typography
                sx={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.35)',
                  px: 1.5,
                  pt: 1.5,
                  pb: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {group.section}
              </Typography>
            )}

            {isCollapsed && (
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 0.5 }} />
            )}

            {group.items.map((item) => renderItem(item))}
          </Box>
        ))}
      </List>

      <Box sx={{ px: 0.75, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Tooltip title={isCollapsed ? 'Logout' : ''} placement="right" arrow>
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: '10px',
              px: 1.5,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.18)' },
              transition: 'all 0.15s ease',
            }}
          >
            <ListItemIcon
              sx={{
                color: 'rgba(255,150,150,0.85)',
                minWidth: isCollapsed ? 0 : 38,
                justifyContent: 'center',
              }}
            >
              <Logout />
            </ListItemIcon>

            {!isCollapsed && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255,150,150,0.85)',
                }}
              />
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
      ModalProps={{ keepMounted: true }}
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
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default AgentSidebar