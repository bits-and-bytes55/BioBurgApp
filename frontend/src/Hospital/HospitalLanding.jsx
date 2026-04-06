import React from "react";
import { Container, Typography, Button, Box, Card, CardContent, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LocalHospital } from "@mui/icons-material";

export default function HospitalLanding() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f1f5f9", py: 6 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box textAlign="center" mb={5}>
          <Typography variant="h3" fontWeight={700} color="#0077a3" gutterBottom>
            Hospital Login
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Hospitals & Clinics
          </Typography>
          <Box sx={{ display:"inline-flex", alignItems:"center", gap:1, mt:2, px:2, py:0.5,
              border:"1px solid #00897b", borderRadius:2, bgcolor:"#e0f2f1" }}>
            <Box sx={{ width:8, height:8, borderRadius:"50%", bgcolor:"#00897b" }} />
            <Typography variant="body2" color="#00897b" fontWeight={600}>SSL Encrypted</Typography>
          </Box>
        </Box>

        {/* Card */}
        <Box sx={{ display:"flex", justifyContent:"center" }}>
          <Card elevation={3} sx={{ width:"100%", maxWidth:400,
              transition:"all 0.3s ease", "&:hover":{ transform:"translateY(-8px)", boxShadow:6 } }}>
            <CardContent sx={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", p:4 }}>
              <Avatar sx={{ width:80, height:80, bgcolor:"#0077a3", mb:3 }}>
                <LocalHospital sx={{ fontSize:45 }} />
              </Avatar>
              <Typography variant="h5" fontWeight={600} gutterBottom>Hospital Login</Typography>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Hospitals, Clinics & Nursing Homes
              </Typography>
              <Button fullWidth variant="contained"
                sx={{ bgcolor:"#0077a3", color:"#fff", fontWeight:600, py:1.5, fontSize:"1rem",
                  "&:hover":{ bgcolor:"#005f8a" } }}
                onClick={() => navigate("/hospital/login")}>
                Access Portal →
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box textAlign="center" mt={6}>
          <Typography variant="body2" color="text.secondary">
            New hospital?{" "}
            <Typography component="span" variant="body2" color="#0077a3" fontWeight={600}
              sx={{ cursor:"pointer", textDecoration:"underline" }}
              onClick={() => navigate("/register/hospital")}>
              Register Here
            </Typography>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}