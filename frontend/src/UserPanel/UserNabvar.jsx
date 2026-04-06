import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Container,
  Divider,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { Link, useNavigate } from 'react-router-dom'

import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LoginIcon from '@mui/icons-material/Login'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import { logout as authLogout } from '../../utils/auth'
import { useCart } from '../context/useCart'

// ================= Styling =================
const PrimaryNav = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  boxShadow: 'none'
}))

const LogoBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textDecoration: 'none',
  color: 'inherit'
})

const SiteTitle = styled(Typography)({
  fontWeight: 'bold',
  fontSize: '1.3rem'
})

const NavActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
})

const NavLinkButton = styled(Button)({
  color: '#fff',
  textTransform: 'none',
  fontWeight: 500
})

const SignUpButton = styled(Button)({
  color: '#fff',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.1)'
  }
})

const CartButton = styled(IconButton)({
  color: '#fff'
})

// ======================== MAIN NAVBAR ========================
export default function Navbar () {
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))
  const isLoggedIn = Boolean(token)

  const { cart } = useCart()

  //Cart count
  const cartCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0

  const handleLogout = () => {
  authLogout(); // clears everything
  navigate('/')
  window.location.reload()
}

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // ================= DRAWER CONTENT =================
  const drawerContent = (
    <Box sx={{ width: 260 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5 }}>
        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
          Menu
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <ListItemButton component={Link} to='/offers'>
        <ListItemIcon>
          <LocalOfferIcon />
        </ListItemIcon>
        <ListItemText primary='Offers' />
      </ListItemButton>

      <ListItemButton component={Link} to='/cart'>
        <ListItemIcon>
          <Badge badgeContent={cartCount} color='error'>
            <ShoppingCartIcon />
          </Badge>
        </ListItemIcon>
        <ListItemText primary='Cart' />
      </ListItemButton>

      <Divider />

      {!isLoggedIn ? (
        <>
          <ListItemButton component={Link} to='/userlogin'>
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary='Login' />
          </ListItemButton>

          <ListItemButton component={Link} to='/userregister'>
            <ListItemIcon>
              <HowToRegIcon />
            </ListItemIcon>
            <ListItemText primary='Register' />
          </ListItemButton>
        </>
      ) : (
        <>
          <ListItemButton component={Link} to='/userprofile'>
            <ListItemIcon>
              <AccountCircleOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary='Profile' />
          </ListItemButton>

          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <CloseIcon />
            </ListItemIcon>
            <ListItemText primary='Logout' />
          </ListItemButton>
        </>
      )}
    </Box>
  )

  // ================= RENDER =================
  return (
    <>
      <PrimaryNav position='static'>
        <Container maxWidth='xl'>
          <Toolbar disableGutters>
            {/* MOBILE */}
            {isMobile ? (
              <>
                <IconButton color='inherit' onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>

                <LogoBox sx={{ flexGrow: 1 }}>
                  <HealthAndSafetyOutlinedIcon sx={{ fontSize: '1.8rem' }} />
                </LogoBox>

                <NavActions>
                  <CartButton component={Link} to='/cart'>
                    <Badge badgeContent={cartCount} color='error'>
                      <ShoppingCartIcon />
                    </Badge>
                  </CartButton>
                </NavActions>
              </>
            ) : (
              /* DESKTOP */
              <>
                <LogoBox component={Link} to='/'>
                  <HealthAndSafetyOutlinedIcon sx={{ fontSize: '2.5rem' }} />
                  <SiteTitle>BioBurg</SiteTitle>
                </LogoBox>

                <Box sx={{ flexGrow: 1 }} />

                <NavActions>
                  {!isLoggedIn ? (
                    <>
                      <NavLinkButton component={Link} to='/login'>
                        <LoginIcon /> Login
                      </NavLinkButton>

                      <SignUpButton component={Link} to='/signup'>
                        <HowToRegIcon /> Signup
                      </SignUpButton>
                    </>
                  ) : (
                    <>
                      <NavLinkButton component={Link} to='/userprofile'>
                        <AccountCircleOutlinedIcon />
                        {user?.name || 'Account'}
                      </NavLinkButton>

                      <NavLinkButton onClick={handleLogout}>
                        Logout
                      </NavLinkButton>
                    </>
                  )}

                  <NavLinkButton component={Link} to='/offers'>
                    <LocalOfferIcon />
                  </NavLinkButton>

                  <CartButton component={Link} to='/cart'>
                    <Badge badgeContent={cartCount} color='error'>
                      <ShoppingCartIcon />
                    </Badge>
                  </CartButton>
                </NavActions>
              </>
            )}
          </Toolbar>
        </Container>
      </PrimaryNav>

      {/* DRAWER */}
      <Drawer
        anchor='left'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawerContent}
      </Drawer>
    </>
  )
}
