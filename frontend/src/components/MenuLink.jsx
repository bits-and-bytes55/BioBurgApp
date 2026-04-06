const MenuLink = ({ to, children }) => (
  <Button
    component={Link}
    to={to}
    fullWidth
    sx={{ justifyContent: "flex-start", mt: 1 }}
  >
    {children}
  </Button>
);
export default MenuLink;