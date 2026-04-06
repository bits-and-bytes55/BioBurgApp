import React from 'react'
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
import { ShoppingCart, FavoriteBorder, Favorite } from '@mui/icons-material'
import { useCart } from '../../context/CartContext'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const { addToCart, loading } = useCart()
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
  const discount = discountB2C ?? (mrp && ptr ? Math.round(((mrp - ptr) / mrp) * 100) : 0)
  const inStock = stock > 0
  const stockCount = stock ?? 0

  return (
    <Card
      sx={{
        width: '100%',
        borderRadius: { xs: 2, sm: 2.5 },
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid',
        borderColor: 'grey.100',
        transition: 'all 0.25s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          borderColor: 'primary.light'
        }
      }}
    >
      {/* ── Discount Badge ── */}
      {discount > 0 && (
        <Chip
          label={`${discount}% OFF`}
          size='small'
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 2,
            bgcolor: '#EF4444',
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '0.65rem', sm: '0.7rem' },
            height: { xs: 20, sm: 22 },
            borderRadius: 1,
            '& .MuiChip-label': { px: 1 }
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
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          '&:hover': { bgcolor: '#FFF5F5' }
        }}
      >
        {wishlisted
          ? <Favorite sx={{ fontSize: { xs: 14, sm: 16 }, color: '#EF4444' }} />
          : <FavoriteBorder sx={{ fontSize: { xs: 14, sm: 16 }, color: 'grey.400' }} />
        }
      </IconButton>

      {/* ── Product Image ── */}
      <Box
        sx={{
          width: '100%',
          pt: '75%',           // 4:3 aspect ratio — responsive
          position: 'relative',
          bgcolor: '#F8FAFC',
          borderRadius: '8px 8px 0 0',
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
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              p: 1,
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.05)' }
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: '#F1F5F9'
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', color: 'grey.400' }}>No Image</Typography>
          </Box>
        )}
      </Box>

      {/* ── Card Content ── */}
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          pb: { xs: '12px !important', sm: '16px !important' },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        {/* Product Name */}
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
              sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
            />
            {reviewCount > 0 && (
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                ({reviewCount})
              </Typography>
            )}
          </Box>
        )}

        {/* Price Row */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              color: 'text.primary'
            }}
          >
            ₹{displayPrice}
          </Typography>
          {discount > 0 && (
            <Typography
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                color: 'text.disabled',
                textDecoration: 'line-through'
              }}
            >
              ₹{originalPrice}
            </Typography>
          )}
          {discount > 0 && (
            <Typography sx={{ fontSize: { xs: '0.68rem', sm: '0.72rem' }, color: '#22C55E', fontWeight: 600 }}>
              Save ₹{originalPrice - displayPrice}
            </Typography>
          )}
        </Box>

        {/* Stock */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: inStock ? '#22C55E' : '#EF4444',
              flexShrink: 0
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
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
              height: 18,
              fontSize: '0.62rem',
              bgcolor: '#DCFCE7',
              color: '#15803D',
              fontWeight: 700,
              '& .MuiChip-label': { px: 0.75 }
            }}
          />
        )}

        {/* Add to Cart Button */}
        <Button
          variant='contained'
          fullWidth
          size='small'
          disabled={loading || !inStock}
          onClick={() => addToCart(_id, 1)}
          startIcon={<ShoppingCart sx={{ fontSize: { xs: 14, sm: 16 } }} />}
          sx={{
            mt: 1,
            py: { xs: 0.75, sm: 1 },
            borderRadius: 2,
            fontWeight: 700,
            fontSize: { xs: '0.72rem', sm: '0.8rem' },
            textTransform: 'none',
            bgcolor: '#1D4ED8',
            '&:hover': { bgcolor: '#1E40AF' },
            '&:disabled': { bgcolor: 'grey.200', color: 'grey.400' }
          }}
        >
          {!inStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardContent>
    </Card>
  )
}