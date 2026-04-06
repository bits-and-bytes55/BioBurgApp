// components/VariantSelector.jsx
import { Chip, Stack } from "@mui/material";

export default function VariantSelector({ variants, onChange, selectedVariant, compact = false }) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {variants.map((variant) => (
        <Chip
          key={variant.id}
          label={variant.name}
          size="small"
          onClick={() => onChange(variant)}
          sx={{
            fontSize: compact ? "0.65rem" : "0.75rem",
            height: compact ? "24px" : "28px",
            fontWeight: selectedVariant?.id === variant.id ? "600" : "400",
            background: selectedVariant?.id === variant.id 
              ? "linear-gradient(135deg, #25D366, #128C7E)"
              : "rgba(37, 211, 102, 0.1)",
            color: selectedVariant?.id === variant.id ? "white" : "#128C7E",
            border: `1px solid ${
              selectedVariant?.id === variant.id 
                ? "#128C7E" 
                : "rgba(37, 211, 102, 0.2)"
            }`,
            "&:hover": {
              background: selectedVariant?.id === variant.id 
                ? "#128C7E"
                : "rgba(37, 211, 102, 0.15)",
            },
          }}
        />
      ))}
    </Stack>
  );
}