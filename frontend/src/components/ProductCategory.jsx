import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Link, Menu, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ArrowDropDown } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNav } from "../context/NavContext";

const SecondaryNavWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(1.5, 0),
}));

const MenuLink = styled(Link)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.secondary,
  textDecoration: "none",
  cursor: "pointer",
  padding: "8px 12px",
  borderRadius: "8px",
  transition: "color 0.2s",
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  "&:hover": { color: theme.palette.primary.main },
}));

// Level 2 item — shows a flyout for its children (level 3) on hover
function SubMenuItem({ sub, onClose }) {
  const navigate = useNavigate();
  const [nestedAnchor, setNestedAnchor] = useState(null);
  const hasChildren = sub.children && sub.children.length > 0;

  return (
    <Box
      onMouseEnter={(e) => hasChildren && setNestedAnchor(e.currentTarget)}
      onMouseLeave={() => hasChildren && setNestedAnchor(null)}
      sx={{ position: "relative" }}
    >
      <MenuItem
        onClick={() => {
          if (!hasChildren) { onClose(); navigate(sub.link || "/"); }
        }}
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: hasChildren ? 1 : 2 }}
      >
        {sub.label}
        {hasChildren && <ChevronRightIcon sx={{ fontSize: 16, color: "text.disabled", ml: 1 }} />}
      </MenuItem>

      {/* Level 3 flyout */}
      {hasChildren && (
        <Menu
          anchorEl={nestedAnchor}
          open={Boolean(nestedAnchor)}
          onClose={() => setNestedAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          sx={{
            pointerEvents: "none",
            "& .MuiPaper-root": {
              pointerEvents: "auto",
              borderRadius: 2,
              minWidth: 200,
              maxHeight: 350,
              overflowY: "auto",
            },
          }}
        >
          {sub.children.map((child) => (
            <MenuItem
              key={child.id}
              onClick={() => { setNestedAnchor(null); onClose(); navigate(child.link || "/"); }}
            >
              {child.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
}

export default function BottomCategories() {
  const navigate = useNavigate();
  const { activeBottomNav } = useNav();
  const [anchors, setAnchors] = useState({});

  const openMenu  = (id, el) => setAnchors((prev) => ({ ...prev, [id]: el }));
  const closeMenu = (id)     => setAnchors((prev) => ({ ...prev, [id]: null }));

  return (
    <SecondaryNavWrapper>
      <Container maxWidth="xl">
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1, rowGap: 0 }}>
          {activeBottomNav.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const anchor = anchors[item.id] || null;

            return (
              <Box
                key={item.id}
                onMouseEnter={(e) => hasSubmenu && openMenu(item.id, e.currentTarget)}
                onMouseLeave={() => hasSubmenu && closeMenu(item.id)}
              >
                <MenuLink onClick={() => !hasSubmenu && navigate(item.link || "/")}>
                  {item.label}
                  {hasSubmenu && <ArrowDropDown sx={{ ml: 0.5 }} />}
                </MenuLink>

                {hasSubmenu && (
                  <Menu
                    anchorEl={anchor}
                    open={Boolean(anchor)}
                    onClose={() => closeMenu(item.id)}
                    MenuListProps={{ onMouseLeave: () => closeMenu(item.id) }}
                    sx={{
                      pointerEvents: "auto",
                      "& .MuiPaper-root": { width: "240px", pointerEvents: "auto", borderRadius: 2 },
                    }}
                  >
                    {item.submenu.map((sub) => (
                      <SubMenuItem
                        key={sub.id}
                        sub={sub}
                        onClose={() => closeMenu(item.id)}
                      />
                    ))}
                  </Menu>
                )}
              </Box>
            );
          })}
        </Box>
      </Container>
    </SecondaryNavWrapper>
  );
}