// pages/EndOfDay.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Grid, TextField, Button, Typography,
  LinearProgress, CircularProgress, Alert,
} from '@mui/material'
import { CheckCircle, TrendingUp, Assignment, DirectionsCar } from '@mui/icons-material'
import PageShell from './Pageshell'
import StatCard from './Statcard'

const BASE = import.meta.env.VITE_API_URL || ''

export default function EndOfDay() {
  const [summary, setSummary] = useState('')
  const [challenges, setChallenges] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [stats, setStats] = useState({
    visitsToday: 0,
    responsesTotal: 0,
    distanceToday: 0,
    ordersToday: 0,
    orderValueToday: 0,
  })

  const token = localStorage.getItem('agentToken')
  const headers = { Authorization: `Bearer ${token}` }

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [jobRes, respRes] = await Promise.all([
        fetch(`${BASE}/api/agent/job-history`, { headers }),
        fetch(`${BASE}/api/agent/responses`, { headers }),
      ])
      const jobData = await jobRes.json()
      const respData = await respRes.json()

      const today = new Date().toDateString()

      const todayJobs = (jobData.jobs || []).filter(j =>
        j.dutyDate && new Date(j.dutyDate).toDateString() === today
      )

      const todayResponses = (respData.responses || []).filter(r =>
        r.createdAt && new Date(r.createdAt).toDateString() === today
      )

      const distanceToday = todayJobs.reduce((sum, j) => sum + (j.totalDistanceKm || 0), 0)
      const ordersToday = todayResponses.filter(r => r.hasOrder).length
      const orderValueToday = todayResponses
        .filter(r => r.hasOrder && r.orderValue)
        .reduce((sum, r) => sum + Number(r.orderValue || 0), 0)

      setStats({
        visitsToday: todayJobs.length,
        responsesTotal: respData.responses?.length || 0,
        distanceToday: Math.round(distanceToday * 10) / 10,
        ordersToday,
        orderValueToday,
      })
    } catch (err) {
      setError('Failed to load today\'s data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleSubmit = async () => {
    if (!summary.trim()) { setError('Please add a summary before submitting'); return }
    setSubmitting(true)
    setError('')
    try {
      // EOD is saved as a response entry with a special placeType
      const res = await fetch(`${BASE}/api/agent/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          placeName: 'End of Day Report',
          placeType: 'EOD',
          contactPerson: 'Self',
          responseStatus: 'Responded - Positive',
          remarks: summary,
          productDiscussed: challenges,
          nextAction: 'None Required',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const statCards = [
    { label: 'Visits Today', value: loading ? '…' : String(stats.visitsToday), sub: 'From job history', color: '#1d4ed8', icon: <Assignment /> },
    { label: 'Orders Today', value: loading ? '…' : String(stats.ordersToday), sub: stats.orderValueToday ? `₹${stats.orderValueToday.toLocaleString('en-IN')}` : 'No orders', color: '#16a34a', icon: <TrendingUp /> },
    { label: 'Distance', value: loading ? '…' : `${stats.distanceToday} km`, sub: 'Tracked today', color: '#d97706', icon: <DirectionsCar /> },
  ]

  const targets = [
    { label: 'Doctor Visits', done: stats.visitsToday, total: 10 },
    { label: 'Orders', done: stats.ordersToday, total: 5 },
    { label: 'Responses', done: stats.responsesTotal, total: 20 },
  ]

  return (
    <PageShell
      title="End of Day Report"
      subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      breadcrumb={[{ label: 'Field Work' }, { label: 'End of Day Report' }]}
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(s => (
          <Grid item xs={12} sm={4} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Today's Target Progress</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        ) : targets.map(p => (
          <Box key={p.label} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 13 }}>{p.label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{p.done}/{p.total}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((p.done / p.total) * 100, 100)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        ))}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!submitted ? (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>Day Summary</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={4}
                label="Summary of Today's Activities *"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Describe what was accomplished today…"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3}
                label="Challenges / Issues Faced"
                value={challenges}
                onChange={e => setChallenges(e.target.value)}
                placeholder="Any difficulties or escalations to report…"
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                color="success"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                Submit End of Day Report
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Report Submitted Successfully</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1 }}>
            Your end of day report has been sent to your reporting manager.
          </Typography>
        </Paper>
      )}
    </PageShell>
  )
}