import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

export default function HospitalLayout() {
  const token = localStorage.getItem('hospitalToken');

  if (!token) return <Navigate to="/hospital/login" />;

  return (
  <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
    <Outlet />
  </Box>
);
}