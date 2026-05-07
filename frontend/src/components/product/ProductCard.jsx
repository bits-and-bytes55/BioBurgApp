import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  Rating
} from '@mui/material'
import {
  ShoppingCart,
  FavoriteBorder,
  Favorite,
  FlashOn
} from '@mui/icons-material'
import { useCart } from '../../context/CartContext'
import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product }) {
  const { addToCart, loading } = useCart()
  const navigate = useNavigate()
  const [wishlisted, setWishlisted] = useState(false)

  if (!product) return null

  const {
    _id,
    brandName,
    genericName,
    images,
    primaryImageIndex = 0,
    mrp,
    ptr,
    discountB2C,
    stock,
    rating,
    reviewCount,
    isOTC
  } = product

  const imageUrl = images?.[primaryImageIndex]?.url || ''
  const displayPrice = ptr ?? mrp ?? 0
  const originalPrice = mrp ?? 0
  const discount =
    discountB2C ??
    (mrp && ptr ? Math.round(((mrp - ptr) / mrp) * 100) : 0)
  const inStock = stock > 0
  const stockCount = stock ?? 0

  const handleBuyNow = () => {
    addToCart(_id, 1)
    navigate('/checkout')
  }

  return (
    <Card
      sx={{
        width: '100%',
        borderRadius: { xs: 2, sm: 2.5 },
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid',
        borderColor: 'grey.100',
        transition: 'all 0.25s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.1)',
          borderColor: 'primary.light'
        }
      }}
    >
      {/* ── Discount Badge — small, floats above top-left corner ── */}
      {discount > 0 && (
        <Chip
          label={`${discount}% off`}
          size='small'
          sx={{
            position: 'absolute',
            top: -10,
            left: 8,
            zIndex: 3,
            bgcolor: '#EF4444',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.6rem',
            height: 18,
            borderRadius: '4px',
            boxShadow: '0 2px 6px rgba(239,68,68,0.35)',
            '& .MuiChip-label': { px: 0.75 }
          }}
        />
      )}

      {/* ── Wishlist Button ── */}
      <IconButton
        size='small'
        onClick={() => setWishlisted(w => !w)}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          bgcolor: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          width: { xs: 26, sm: 30 },
          height: { xs: 26, sm: 30 },
          '&:hover': { bgcolor: '#FFF5F5' }
        }}
      >
        {wishlisted
          ? <Favorite sx={{ fontSize: { xs: 13, sm: 15 }, color: '#EF4444' }} />
          : <FavoriteBorder sx={{ fontSize: { xs: 13, sm: 15 }, color: 'grey.400' }} />
        }
      </IconButton>

      {/* ── Product Image ── */}
      <Box
        sx={{
          width: '100%',
          pt: '75%',
          position: 'relative',
          bgcolor: '#F8FAFC',
          borderRadius: '10px 10px 0 0',
          overflow: 'hidden'
        }}
      >
        {imageUrl ? (
          <CardMedia
            component='img'
            image={imageUrl}
            alt={brandName}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              p: 1.25,
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.05)' }
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#F1F5F9'
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', color: 'grey.400' }}>
              No Image
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Card Content ── */}
      <CardContent
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          pb: { xs: '12px !important', sm: '14px !important' },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        {/* Brand Name */}
        <Typography
          variant='subtitle2'
          sx={{
            fontWeight: 700,
            fontSize: { xs: '0.78rem', sm: '0.85rem' },
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'text.primary',
            minHeight: { xs: '2.1em', sm: '2.2em' }
          }}
        >
          {brandName || 'Product'}
        </Typography>

        {/* Generic Name */}
        {genericName && (
          <Typography
            sx={{
              fontSize: { xs: '0.68rem', sm: '0.72rem' },
              color: 'text.secondary',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {genericName}
          </Typography>
        )}

        {/* Rating */}
        {rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Rating
              value={rating}
              readOnly
              precision={0.5}
              size='small'
              sx={{ fontSize: { xs: '0.72rem', sm: '0.8rem' } }}
            />
            {reviewCount > 0 && (
              <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                ({reviewCount})
              </Typography>
            )}
          </Box>
        )}

        {/* Divider */}
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'grey.100',
            my: 0.5
          }}
        />

        {/* Price Row */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: 'text.primary'
            }}
          >
            ₹{displayPrice}
          </Typography>
          {discount > 0 && (
            <Typography
              sx={{
                fontSize: { xs: '0.68rem', sm: '0.72rem' },
                color: 'text.disabled',
                textDecoration: 'line-through'
              }}
            >
              ₹{originalPrice}
            </Typography>
          )}
          {discount > 0 && (
            <Typography
              sx={{
                fontSize: { xs: '0.65rem', sm: '0.7rem' },
                color: '#16A34A',
                fontWeight: 600
              }}
            >
              Save ₹{originalPrice - displayPrice}
            </Typography>
          )}
        </Box>

        {/* Stock Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: inStock ? '#22C55E' : '#EF4444',
              flexShrink: 0
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: '0.62rem', sm: '0.68rem' },
              color: inStock ? '#16A34A' : '#DC2626',
              fontWeight: 500
            }}
          >
            {inStock ? `${stockCount} units available` : 'Out of stock'}
          </Typography>
        </Box>

        {/* OTC Badge */}
        {isOTC && (
          <Chip
            label='OTC'
            size='small'
            sx={{
              alignSelf: 'flex-start',
              height: 17,
              fontSize: '0.6rem',
              bgcolor: '#DCFCE7',
              color: '#15803D',
              fontWeight: 700,
              '& .MuiChip-label': { px: 0.75 }
            }}
          />
        )}

        {/* ── Action Buttons ── */}
        {inStock ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0.75,
              mt: 1
            }}
          >
            {/* Add to Cart */}
            <Button
              variant='contained'
              size='small'
              disabled={loading}
              onClick={() => addToCart(_id, 1)}
              startIcon={<ShoppingCart sx={{ fontSize: { xs: 12, sm: 14 } }} />}
              sx={{
                py: { xs: 0.7, sm: 0.85 },
                borderRadius: 2,
                fontWeight: 700,
                fontSize: { xs: '0.65rem', sm: '0.72rem' },
                textTransform: 'none',
                bgcolor: '#1D4ED8',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#1E40AF',
                  boxShadow: '0 4px 12px rgba(29,78,216,0.3)'
                }
              }}
            >
              Add to Cart
            </Button>

            {/* Buy Now */}
            <Button
              variant='contained'
              size='small'
              disabled={loading}
              onClick={handleBuyNow}
              startIcon={<FlashOn sx={{ fontSize: { xs: 12, sm: 14 } }} />}
              sx={{
                py: { xs: 0.7, sm: 0.85 },
                borderRadius: 2,
                fontWeight: 700,
                fontSize: { xs: '0.65rem', sm: '0.72rem' },
                textTransform: 'none',
                bgcolor: '#EA580C',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#C2410C',
                  boxShadow: '0 4px 12px rgba(234,88,12,0.3)'
                }
              }}
            >
              Buy Now
            </Button>
          </Box>
        ) : (
          <Button
            variant='contained'
            fullWidth
            size='small'
            disabled
            sx={{
              mt: 1,
              py: { xs: 0.7, sm: 0.85 },
              borderRadius: 2,
              fontWeight: 700,
              fontSize: { xs: '0.65rem', sm: '0.72rem' },
              textTransform: 'none',
              bgcolor: 'grey.200',
              color: 'grey.400',
              boxShadow: 'none'
            }}
          >
            Out of Stock
          </Button>
        )}
      </CardContent>
    </Card>
  )
}