export const shareOnWhatsApp = (product, variant) => {
  const text = `
🩺 ${product.title}
💰 ₹${variant?.price || product.price || product.mrp}
📦 ${variant?.title || ""}
🎁 ${product.offerText || ""}

${product.images?.[0]?.url || ""}
`;

  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank"
  );
};
