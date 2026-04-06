// src/Pharmacy/Pharmacylayout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

export default function PharmacyLayout() {
  const token = localStorage.getItem('pharmacyToken');

  if (!token) return <Navigate to="/pharmacy/login" />;

  return (
  <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
    <Outlet />
  </Box>
);
}