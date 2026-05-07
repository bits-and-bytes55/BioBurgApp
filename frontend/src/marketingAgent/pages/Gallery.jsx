// pages/gallery/Gallery.jsx
import { useState } from 'react'
import {
  Box, Paper, Grid, Typography, Tabs, Tab, Chip, Button,
  Card, CardMedia, CardContent, CardActions, IconButton,
} from '@mui/material'
import { Upload, Download, Delete, PlayCircle, EmojiEvents, Groups } from '@mui/icons-material'
import PageShell from './Pageshell'

const TABS = ['Photos', 'Videos', 'Company Awards', 'Social Activities']

const MOCK_PHOTOS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1, title: `Field Visit ${i + 1}`, date: `2025-04-${String(i + 1).padStart(2, '0')}`,
  tag: ['Doctor Visit', 'Hospital Round', 'Training'][i % 3],
  color: ['#1d4ed8', '#16a34a', '#d97706', '#7c3aed', '#dc2626'][i % 5],
}))

const MOCK_VIDEOS = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1, title: ['Product Training — Biocef', 'Q1 Sales Meet', 'Doctor CME Event', 'Team Awards Ceremony'][i],
  duration: ['12:30', '45:00', '1:20:00', '22:15'][i], date: `2025-0${i + 1}-15`,
}))

export default function Gallery() {
  const [tab, setTab] = useState(0)

  return (
    <PageShell title="Gallery & Media" subtitle="Photos, videos, events & social activities"
      breadcrumb={[{ label: 'Gallery & Media' }, { label: TABS[tab] }]}
      action={<Button startIcon={<Upload />} variant="contained" size="small">Upload</Button>}
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontSize: 13 } }}>
          {TABS.map((t, i) => <Tab key={i} label={t} />)}
        </Tabs>
      </Box>

      {/* Photos */}
      {tab === 0 && (
        <Grid container spacing={2}>
          {MOCK_PHOTOS.map(p => (
            <Grid item xs={6} sm={4} md={3} key={p.id}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ height: 140, bgcolor: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: p.color + '44' }} />
                </Box>
                <CardContent sx={{ p: 1.5, pb: '8px !important' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, noWrap: true }}>{p.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                    <Chip label={p.tag} size="small" sx={{ fontSize: 10, height: 18 }} />
                  </Box>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.5 }}>{p.date}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Videos */}
      {tab === 1 && (
        <Grid container spacing={2}>
          {MOCK_VIDEOS.map(v => (
            <Grid item xs={12} sm={6} key={v.id}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                <Box sx={{ width: 120, minHeight: 90, bgcolor: '#1d4ed820', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PlayCircle sx={{ fontSize: 40, color: '#1d4ed8', opacity: 0.6 }} />
                </Box>
                <Box sx={{ p: 2, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{v.title}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.3 }}>{v.date} • {v.duration}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" sx={{ fontSize: 11 }} startIcon={<PlayCircle sx={{ fontSize: 14 }} />}>Watch</Button>
                    <Button size="small" variant="outlined" sx={{ fontSize: 11 }} startIcon={<Download sx={{ fontSize: 14 }} />}>Download</Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Awards */}
      {tab === 2 && (
        <Grid container spacing={2}>
          {['Best MR — Q1 2025', 'Top Performer — March', 'Sales Champion 2024', 'Consistency Award'].map((a, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 48, color: '#d97706', mb: 1 }} />
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{a}</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>April 2025</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Social */}
      {tab === 3 && (
        <Grid container spacing={2}>
          {['Team Outing — Lonavala', 'Blood Donation Camp', 'Diwali Celebration', 'Annual Day 2024'].map((a, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#1d4ed820', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Groups sx={{ color: '#1d4ed8', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{a}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>2025 • 24 photos</Typography>
                  <Button size="small" sx={{ mt: 0.5, fontSize: 11, p: 0 }}>View Album</Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </PageShell>
  )
}