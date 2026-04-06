import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Paper, Link, Menu, MenuItem } from "@mui/material";
import { Avatar, ListItemIcon } from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNav } from "../context/NavContext";

const SecondaryNavWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(1.5, 0),
}));

const MenuPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  padding: theme.spacing(1.5, 3),
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid #e0e0e0",
}));

const MenuLink = styled(Link)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.secondary,
  textDecoration: "none",
  cursor: "pointer",
  padding: "6px 14px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minWidth: "130px",
  lineHeight: "18px",
  whiteSpace: "normal",
  "&:hover": { color: theme.palette.primary.main, backgroundColor: "#e3f2fd" },
}));

function formatLabel(text) {
  const words = text.trim().split(" ");
  if (words.length === 1) return text;
  const mid = Math.ceil(words.length / 2);
  return (
    <>
      <span>{words.slice(0, mid).join(" ")}</span>
      <span>{words.slice(mid).join(" ")}</span>
    </>
  );
}

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {sub.link?.includes("type=brand") && (
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Avatar sx={{ width: 20, height: 20, fontSize: 11 }}>{sub.label[0]}</Avatar>
            </ListItemIcon>
          )}
          {sub.label}
        </Box>
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

export default function TopCategories() {
  const navigate = useNavigate();
  const { activeTopNav } = useNav();
  const [anchors, setAnchors] = useState({});

  const openMenu  = (id, el) => setAnchors((prev) => ({ ...prev, [id]: el }));
  const closeMenu = (id)     => setAnchors((prev) => ({ ...prev, [id]: null }));

  return (
    <SecondaryNavWrapper>
      <Container maxWidth="xl">
        <MenuPaper>
          <Box sx={{
            width: "100%", overflowX: "auto",
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#ccc", borderRadius: 3 },
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, minWidth: "max-content" }}>
              {activeTopNav.map((item) => {
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const anchor = anchors[item.id] || null;

                return (
                  <Box key={item.id}>
                    <MenuLink onClick={(e) =>
                      hasSubmenu ? openMenu(item.id, e.currentTarget) : navigate(item.link || "/")
                    }>
                      {formatLabel(item.label)}
                    </MenuLink>

                    {hasSubmenu && (
                      <Menu
                        anchorEl={anchor}
                        open={Boolean(anchor)}
                        onClose={() => closeMenu(item.id)}
                        sx={{
                          mt: 1,
                          "& .MuiPaper-root": { borderRadius: 2, maxHeight: 420, overflowY: "auto", minWidth: 240 },
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
          </Box>
        </MenuPaper>
      </Container>
    </SecondaryNavWrapper>
  );
}