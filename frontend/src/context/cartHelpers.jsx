// src/context/cartHelpers.jsx
import { ShoppingCart } from '@mui/icons-material'
import toast from 'react-hot-toast'

export const hasStorefrontUserSession = () =>
  !!(localStorage.getItem('token') || localStorage.getItem('userToken'))

export const getActiveToken = () =>
  localStorage.getItem('token')         ||
  localStorage.getItem('userToken')     ||
  localStorage.getItem('vendorToken')   ||
  localStorage.getItem('hospitalToken') ||
  localStorage.getItem('pharmacyToken') ||
  localStorage.getItem('doctorToken')   ||
  null

export const isAnyUserLoggedIn = () =>
  !!(
    localStorage.getItem('token')            ||
    localStorage.getItem('userToken')        ||
    localStorage.getItem('vendorToken')      ||
    localStorage.getItem('hospitalToken')    ||
    localStorage.getItem('pharmacyToken')    ||
    localStorage.getItem('doctorToken')      ||
    localStorage.getItem('manufacturerToken')||
    localStorage.getItem('franchiseToken')   ||
    localStorage.getItem('adminToken')
  )

// ─── Guest Cart ───────────────────────────────────────────────────────────────
const GUEST_CART_KEY = 'guest_cart'

export const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) ||
      { items: [], totalItems: 0, totalPrice: 0 }
  } catch {
    return { items: [], totalItems: 0, totalPrice: 0 }
  }
}

export const saveGuestCart  = (cart) =>
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))

export const clearGuestCart = () =>
  localStorage.removeItem(GUEST_CART_KEY)

export const addToGuestCart = (product, quantity = 1, variant = null) => {
  const cart = getGuestCart()
  const idx = cart.items.findIndex(
    (i) =>
      i.productId === (product._id || product.productId) &&
      i.variant === variant
  )
  if (idx >= 0) {
    cart.items[idx].quantity += quantity
  } else {
    cart.items.push({
      productId : product._id || product.productId,
      brandName : product.brandName || product.name,
      price     : variant?.price || product.ptr || product.mrp || 0,
      image     : product.images?.[0]?.url || '',
      quantity,
      variant,
    })
  }
  cart.totalItems = cart.items.reduce((s, i) => s + i.quantity, 0)
  cart.totalPrice = cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  saveGuestCart(cart)
  return cart
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export const showCartToast = (productName, quantity, isGuest) => {
  toast.custom(
    (t) => (
      <div style={{
        display      : 'flex',
        alignItems   : 'center',
        gap          : '12px',
        background   : '#1a1a2e',
        color        : '#fff',
        padding      : '14px 18px',
        borderRadius : '14px',
        boxShadow    : '0 8px 32px rgba(0,0,0,0.3)',
        minWidth     : '300px',
        maxWidth     : '380px',
        opacity      : t.visible ? 1 : 0,
        transform    : t.visible ? 'translateY(0)' : 'translateY(-20px)',
        transition   : 'all 0.3s ease',
        borderLeft   : '4px solid #4f8ef7',
      }}>
        <div style={{
          background    : '#4f8ef7',
          borderRadius  : '10px',
          padding       : '8px',
          display       : 'flex',
          alignItems    : 'center',
          justifyContent: 'center',
          flexShrink    : 0,
        }}>
          <ShoppingCart style={{ fontSize: 20, color: '#fff' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
            Added to Cart!
          </div>
          <div style={{ fontSize: '12px', color: '#aab4c8' }}>
            {productName} × {quantity}
            {isGuest && (
              <span style={{
                display    : 'inline-block',
                marginLeft : '6px',
                background : '#f59e0b',
                color      : '#1a1a2e',
                fontSize   : '10px',
                fontWeight : 700,
                padding    : '1px 6px',
                borderRadius: '4px',
              }}>
                Guest
              </span>
            )}
          </div>
          {isGuest && (
            <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
              Login to save your cart &amp; checkout
            </div>
          )}
        </div>
      </div>
    ),
    { duration: 3000, position: 'top-right' }
  )
}