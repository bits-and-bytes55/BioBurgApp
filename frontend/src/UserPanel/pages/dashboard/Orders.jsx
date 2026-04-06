import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { getMyOrdersAPI } from '../../../api/order.api'

const statusColor = status => {
  switch (status) {
    case 'DELIVERED':
      return 'success'
    case 'SHIPPED':
      return 'info'
    case 'CANCELLED':
      return 'error'
    default:
      return 'warning' // PLACED
  }
}

export default function Orders () {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrdersAPI()
        setOrders(res.data.orders || [])
      } catch (err) {
        console.error('Fetch orders error', err)
        console.log(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // ⏳ Loader
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // 📭 Empty Orders
  if (orders.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <Typography variant='h5'>📦 No orders yet</Typography>
        <Typography color='text.secondary'>
          You haven’t placed any orders
        </Typography>
        <Button variant='contained' onClick={() => navigate('/')}>
          Start Shopping
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Typography variant='h5' gutterBottom>
        📦 My Orders
      </Typography>

      {orders.map(order => (
        <Paper key={order._id} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}
          >
            <Typography fontWeight='bold'>Order ID: {order._id}</Typography>

            <Chip label={order.status} color={statusColor(order.status)} />
          </Box>

          <Typography variant='body2' color='text.secondary'>
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* ITEMS */}
          {order.items.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1
              }}
            >
              <Typography>
                {item.product?.title} × {item.quantity}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography fontWeight='bold'>
              Total: ₹{order.totalAmount}
            </Typography>

            <Button
              size='small'
              variant='outlined'
              onClick={() => navigate(`/orders/track/${order._id}`)}
            >
              Track Order
            </Button>
            <Button
              size='small'
              variant='contained'
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              View Details
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}
