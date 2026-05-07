// pages/edetailing/Presentations.jsx
import { useState } from 'react'
import {
  Box, Paper, Grid, Typography, Button, Chip, LinearProgress,
  Card, CardContent, CardActions, IconButton,
} from '@mui/material'
import { PlayArrow, BarChart, Visibility, Download, Slideshow } from '@mui/icons-material'
import PageShell from './Pageshell'
import StatCard from './Statcard'

const PRESENTATIONS = [
  { id: 1, title: 'Biocef 500mg — Physician Detailing', slides: 18, views: 142, avgTime: '4m 20s', tag: 'Anti-infective', color: '#1d4ed8' },
  { id: 2, title: 'BioPain Gel — Mode of Action',        slides: 12, views: 98,  avgTime: '3m 10s', tag: 'Analgesic',      color: '#16a34a' },
  { id: 3, title: 'BioFlu — Scientific Data Dossier',    slides: 24, views: 67,  avgTime: '6m 45s', tag: 'Anti-cold',      color: '#d97706' },
  { id: 4, title: 'BioCal Plus — Calcium Science',       slides: 15, views: 55,  avgTime: '3m 55s', tag: 'Nutraceutical',  color: '#7c3aed' },
]

export default function Presentations() {
  const [selected, setSelected] = useState(null)

  return (
    <PageShell title="E-Detailing" subtitle="Interactive product presentations for HCPs"
      breadcrumb={[{ label: 'Products' }, { label: 'E-Detailing' }]}
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}><StatCard label="Total Presentations" value="4" color="#1d4ed8" icon={<Slideshow />} /></Grid>
        <Grid item xs={12} sm={3}><StatCard label="Total Views" value="362" sub="All time" color="#16a34a" icon={<Visibility />} /></Grid>
        <Grid item xs={12} sm={3}><StatCard label="Avg. View Time" value="4m 30s" color="#d97706" icon={<BarChart />} /></Grid>
        <Grid item xs={12} sm={3}><StatCard label="Slides Viewed" value="2,840" sub="Total slide engagements" color="#7c3aed" icon={<Slideshow />} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        {PRESENTATIONS.map(p => (
          <Grid item xs={12} sm={6} md={6} key={p.id}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden',
              transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
              {/* preview area */}
              <Box sx={{ height: 120, bgcolor: p.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Slideshow sx={{ fontSize: 48, color: p.color, opacity: 0.5 }} />
                <Chip label={p.tag} size="small" sx={{ position: 'absolute', top: 10, right: 10, bgcolor: p.color, color: 'white', fontSize: 11 }} />
              </Box>

              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>{p.title}</Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={4}><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Slides</Typography><Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.slides}</Typography></Grid>
                  <Grid item xs={4}><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Views</Typography><Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.views}</Typography></Grid>
                  <Grid item xs={4}><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Avg Time</Typography><Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.avgTime}</Typography></Grid>
                </Grid>

                {/* slide-by-slide engagement */}
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>Slide Engagement</Typography>
                <LinearProgress variant="determinate" value={Math.round((p.views / 200) * 100)} sx={{ height: 6, borderRadius: 3, mb: 2 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<PlayArrow />} variant="contained" size="small" sx={{ flex: 1 }}>Present</Button>
                  <Button startIcon={<BarChart />} variant="outlined" size="small">Analytics</Button>
                  <IconButton size="small"><Download sx={{ fontSize: 18 }} /></IconButton>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </PageShell>
  )
}