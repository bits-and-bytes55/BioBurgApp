import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
} from "@mui/material";
import { Add, Remove, Delete, LockOutlined } from "@mui/icons-material";
import { useCart } from "../../../context/useCart";
import { useNavigate } from "react-router-dom";
import { isAnyUserLoggedIn } from "../../../api/authHelpers";
import toast from "react-hot-toast";

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Typography variant="h5">Your cart is empty</Typography>
        <Typography color="text.secondary">
          Looks like you haven't added anything yet
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          Continue Shopping
        </Button>
      </Box>
    );
  }

  const handleCheckout = () => {
    if (!isAnyUserLoggedIn()) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/userlogin", {
        state: {
          redirectTo: "/cart",
          message: "Please login to proceed to checkout. Your cart is saved!",
        },
      });
      return;
    }
    navigate("/checkout");
  };

  const isGuest = !isAnyUserLoggedIn();

  const total = cart.items.reduce((sum, item) => {
    const price =
      item.priceAtAdded ||
      item.price ||
      item.productId?.rolePrice?.finalRate ||
      0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, md: 3 } }}>
      {isGuest && (
        <Alert
          severity="info"
          icon={<LockOutlined />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          You're browsing as a <strong>guest</strong>. Items are saved locally —
          you'll need to <strong>login at checkout</strong> to complete your
          order.
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "flex-start",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* LEFT: Cart Items */}
        <Box sx={{ flex: 1, width: "100%" }}>
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #e0e0e0",
                fontWeight: 700,
              }}
            >
              My Cart ({cart.items.length} item
              {cart.items.length > 1 ? "s" : ""})
            </Typography>

            {cart.items.map((item, index) => {
              const productId = item.productId?._id || item.productId;
              const rawVariant = item.variantName || null;
              const variantName = rawVariant
                ? typeof rawVariant === "object"
                  ? Object.entries(rawVariant)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")
                  : String(rawVariant)
                : null;

              // ── Bundle detection ──
              const bundleData = item.bundleData || null;
              const isBundle = bundleData?.isBundleItem === true;
              const bundleProducts = isBundle
                ? bundleData.bundleProducts || []
                : [];

              const name =
                item.productId?.brandName ||
                item.productId?.title ||
                item.productId?.genericName ||
                item.productId?.name ||
                item.name ||
                item.brandName ||
                "Unknown Product";

              const displayName = isBundle ? variantName || name : name;

              const image =
                item.productId?.images?.[0]?.url ||
                item.productId?.image ||
                item.image ||
                item.images?.[0]?.url ||
                "/no-image.png";

              const genericName =
                (!isBundle &&
                  (item.productId?.genericName ||
                    item.productId?.genericCompositions)) ||
                "";

              const price =
                item.priceAtAdded ||
                item.price ||
                item.productId?.rolePrice?.finalRate ||
                0;
              const mrp = item.mrp || item.productId?.mrp || 0;
              const discount =
                mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

              const availableStock = (() => {
                const ts = item.productId?.totalStocks;
                const s = item.productId?.stocks;
                const st = item.productId?.stock;
                if (ts != null) return ts;
                if (s != null) return s;
                if (st != null) return st;
                return Infinity;
              })();

              const atStockLimit = item.quantity >= availableStock;
              const stockWarning =
                availableStock !== Infinity && item.quantity > availableStock;

              const handleIncrease = () => {
                if (item.quantity >= availableStock) {
                  toast.error(
                    `Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available in stock`,
                  );
                  return;
                }
                updateQuantity(productId, item.quantity + 1, variantName);
              };

              const handleDecrease = () =>
                updateQuantity(productId, item.quantity - 1, variantName);

              return (
                <Box key={`${productId}-${variantName || "base"}-${index}`}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      p: { xs: 2, md: 3 },
                      alignItems: "flex-start",
                      "&:hover": { bgcolor: "#fafafa" },
                      transition: "background 0.2s",
                    }}
                  >
                    {/* Image */}
                    <Box
                      sx={{
                        width: { xs: 80, md: 110 },
                        height: { xs: 80, md: 110 },
                        flexShrink: 0,
                        borderRadius: 2,
                        border: isBundle
                          ? "2px solid #e0e7ff"
                          : "1px solid #eee",
                        overflow: "hidden",
                        bgcolor: isBundle ? "#f5f3ff" : "#f9f9f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        !isBundle && navigate(`/product-details/${productId}`)
                      }
                    >
                      <img
                        src={image}
                        alt={name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: 6,
                        }}
                        onError={(e) => {
                          e.target.src = "/no-image.png";
                        }}
                      />
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Bundle badge */}
                      {isBundle && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            bgcolor: "#ede9fe",
                            border: "1px solid #c4b5fd",
                            borderRadius: 1,
                            px: 1,
                            py: 0.25,
                            mb: 0.75,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="#4f46e5"
                            fontWeight={700}
                            sx={{ fontSize: 10 }}
                          >
                            BUNDLE
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        fontWeight={600}
                        fontSize={{ xs: 14, md: 16 }}
                        sx={{
                          cursor: isBundle ? "default" : "pointer",
                          "&:hover": {
                            color: isBundle ? "inherit" : "primary.main",
                          },
                          mb: 0.5,
                          lineHeight: 1.3,
                        }}
                        onClick={() =>
                          !isBundle && navigate(`/product-details/${productId}`)
                        }
                      >
                        {displayName}
                      </Typography>

                      {/* Bundle products list */}
                      {isBundle && bundleProducts.length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mb: 1,
                          }}
                        >
                          {bundleProducts.map((bp, bi) => (
                            <Box
                              key={bi}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                bgcolor: "white",
                                border: "1px solid #c7d2fe",
                                borderRadius: 1,
                                px: 1,
                                py: 0.25,
                              }}
                            >
                              {bp.image && (
                                <img
                                  src={bp.image}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    objectFit: "contain",
                                  }}
                                  alt=""
                                />
                              )}
                              <Typography
                                variant="caption"
                                color="#4338ca"
                                fontWeight={600}
                                sx={{ fontSize: 11 }}
                              >
                                {bp.name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Generic name for non-bundle */}
                      {!isBundle && genericName && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          {genericName}
                        </Typography>
                      )}

                      {/* Variant label for non-bundle */}
                      {!isBundle && variantName && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{ display: "block", mb: 1, fontWeight: 600 }}
                        >
                          Variant: {variantName}
                        </Typography>
                      )}

                      {/* Price Row */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          fontWeight={700}
                          fontSize={18}
                          color={isBundle ? "#4f46e5" : "text.primary"}
                        >
                          ₹{price.toLocaleString()}
                        </Typography>
                        {!isBundle && mrp > price && (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: "line-through",
                                color: "text.disabled",
                              }}
                            >
                              ₹{mrp.toLocaleString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "green", fontWeight: 600 }}
                            >
                              {discount}% off
                            </Typography>
                          </>
                        )}
                      </Box>

                      {stockWarning && (
                        <Alert
                          severity="error"
                          sx={{ py: 0, mb: 1, fontSize: 12 }}
                        >
                          Only {availableStock} unit
                          {availableStock === 1 ? "" : "s"} in stock. Please
                          reduce quantity.
                        </Alert>
                      )}
                      {!stockWarning &&
                        availableStock !== Infinity &&
                        availableStock <= 5 && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "warning.main",
                              display: "block",
                              mb: 1,
                              fontWeight: 600,
                            }}
                          >
                            ⚠ Only {availableStock} unit
                            {availableStock === 1 ? "" : "s"} left
                          </Typography>
                        )}

                      {/* Quantity Controls */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={handleDecrease}
                            disabled={item.quantity <= 1}
                            sx={{ borderRadius: 0, px: 1 }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography
                            sx={{
                              px: 2,
                              py: 0.5,
                              fontWeight: 600,
                              minWidth: 32,
                              textAlign: "center",
                              color: stockWarning
                                ? "error.main"
                                : "text.primary",
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <Tooltip
                            title={
                              atStockLimit
                                ? `Max ${availableStock} unit${availableStock === 1 ? "" : "s"} available`
                                : ""
                            }
                            arrow
                          >
                            <span>
                              <IconButton
                                size="small"
                                onClick={handleIncrease}
                                disabled={atStockLimit}
                                sx={{
                                  borderRadius: 0,
                                  px: 1,
                                  color: atStockLimit
                                    ? "error.main"
                                    : "inherit",
                                  "&.Mui-disabled": {
                                    color: "error.light",
                                    bgcolor: "#fff5f5",
                                  },
                                }}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>

                        {availableStock !== Infinity && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: atStockLimit
                                ? "error.main"
                                : "text.disabled",
                              fontWeight: atStockLimit ? 700 : 400,
                            }}
                          >
                            {atStockLimit
                              ? "🚫 Max qty reached"
                              : `${availableStock} available`}
                          </Typography>
                        )}

                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeItem(productId, variantName)}
                          sx={{ ml: "auto" }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Item Total */}
                    <Typography
                      fontWeight={700}
                      fontSize={17}
                      sx={{
                        display: { xs: "none", sm: "block" },
                        minWidth: 80,
                        textAlign: "right",
                        color: isBundle ? "#4f46e5" : "text.primary",
                      }}
                    >
                      ₹{(price * item.quantity).toLocaleString()}
                    </Typography>
                  </Box>
                  {index < cart.items.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* RIGHT: Order Summary */}
        <Box
          sx={{
            width: { xs: "100%", md: 300 },
            flexShrink: 0,
            bgcolor: "white",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            p: 3,
            position: { md: "sticky" },
            top: { md: 80 },
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Order Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="text.secondary">
              Subtotal ({cart.items.length} item
              {cart.items.length > 1 ? "s" : ""})
            </Typography>
            <Typography fontWeight={500}>₹{total.toLocaleString()}</Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography color="text.secondary">Delivery</Typography>
            <Typography fontWeight={500} color="green">
              FREE
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography fontWeight={700} fontSize={17}>
              Total
            </Typography>
            <Typography fontWeight={700} fontSize={17}>
              ₹{total.toLocaleString()}
            </Typography>
          </Box>

          {(() => {
            const hasOverStock = cart.items.some((item) => {
              const ts = item.productId?.totalStocks;
              const s = item.productId?.stocks;
              const st = item.productId?.stock;
              const avail =
                ts != null ? ts : s != null ? s : st != null ? st : Infinity;
              return avail !== Infinity && item.quantity > avail;
            });
            return (
              <>
                {hasOverStock && (
                  <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: 12 }}>
                    Some items exceed available stock. Please reduce quantities.
                  </Alert>
                )}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={hasOverStock}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                  onClick={() => navigate("/checkout")}
                >
                  {isGuest ? "Proceed to Checkout" : "Proceed to Checkout"}
                </Button>
              </>
            );
          })()}

          {isGuest && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", mt: 1.5 }}
            >
              Already have an account?{" "}
              <span
                style={{ color: "#1976d2", cursor: "pointer", fontWeight: 600 }}
                onClick={() =>
                  navigate("/userlogin", {
                    state: {
                      redirectTo: "/cart",
                      message:
                        "Login to complete your purchase. Your cart is saved!",
                    },
                  })
                }
              >
                Login now
              </span>
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
