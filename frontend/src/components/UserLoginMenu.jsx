export default function UserLoginMenu() {
  return (
    <>
      <Typography variant="h6">User Login</Typography>

      <MenuLink to="/login/vendor">Vendor Login</MenuLink>
      <MenuLink to="/login/doctor">Doctor Login</MenuLink>
      <MenuLink to="/login/franchise">Franchise Login</MenuLink>
      <MenuLink to="/login/manufacturer">Manufacturer Login</MenuLink>
    </>
  );
}
