import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'

const THEME_COLOR = '#1976d2'

export default function MyLabProfile () {
  const [lab, setLab] = useState(null)
  const [loading, setLoading] = useState(true)
console.log("LAB 👉", lab)
console.log("LOADING 👉", loading)

  const token = localStorage.getItem('labToken')
  console.log(token)

  useEffect(() => {
    fetchLabProfile()
  }, [])

const fetchLabProfile = async () => {
  try {
    const res = await axios.get(
      'https://bioburglifescience-1.onrender.com/api/labs/profile',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    setLab(res.data.data)
  } catch (err) {
    console.error(
      "PROFILE FETCH ERROR 👉",
      err.response?.data || err.message
    )

    // 🔥 ONLY logout on 401
    if (err.response?.status === 401) {
      localStorage.removeItem("labToken")
      alert("Session expired, please login again")
      // optional redirect
      // navigate("/lab-login")
    }
  } finally {
    setLoading(false)
  }
}



  if (loading) return <Typography>Loading...</Typography>
  if (!lab) return <Typography>No profile found</Typography>

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant='h5' fontWeight='bold'>
        Lab Profile
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* BASIC INFO */}
      <Typography variant='h6' color={THEME_COLOR}>
        Personal Information
      </Typography>

      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} md={6}>
          <Typography>
            <b>Name:</b> {lab.fullName}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography>
            <b>Email:</b> {lab.email}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography>
            <b>Mobile:</b> {lab.mobile}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography>
            <b>Gender:</b> {lab.gender}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography>
            <b>Status:</b>{' '}
            <Chip
              label={lab.status}
              color={lab.status === 'ACTIVE' ? 'success' : 'error'}
              size='small'
            />
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ADDRESS */}
      <Typography variant='h6' color={THEME_COLOR}>
        Address
      </Typography>
      <Typography mt={1}>
        {lab.address?.fullAddress}, {lab.address?.city} - {lab.address?.pincode}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* TESTS */}
      <Typography variant='h6' color={THEME_COLOR}>
        Tests Offered
      </Typography>

      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Test Name</TableCell>
            <TableCell>Price (₹)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lab.selectedTests?.length > 0 ? (
            lab.selectedTests.map((t, i) => (
              <TableRow key={i}>
                <TableCell>{t.testName}</TableCell>
                <TableCell>{t.price}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2}>No tests added</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Divider sx={{ my: 3 }} />

      {/* PREFERENCES */}
      <Typography variant='h6' color={THEME_COLOR}>
        Preferences
      </Typography>

      <Typography>
        <b>Collection Option:</b> {lab.collectionOption}
      </Typography>
      <Typography>
        <b>Preferred Date:</b>{' '}
        {lab.preferredDate
          ? new Date(lab.preferredDate).toLocaleDateString()
          : 'N/A'}
      </Typography>
      <Typography>
        <b>Time Slot:</b> {lab.timeSlot}
      </Typography>
      <Typography>
        <b>Prescription Required:</b> {lab.prescriptionRequired ? 'Yes' : 'No'}
      </Typography>
      <Typography>
        <b>Report Delivery:</b> {lab.reportDelivery?.join(', ')}
      </Typography>
      <Typography>
        <b>Symptoms:</b> {lab.symptoms}
      </Typography>
    </Paper>
  )
}
