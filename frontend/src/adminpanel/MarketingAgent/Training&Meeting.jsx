import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Paper, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, LinearProgress, FormControl,
  InputLabel, Select, MenuItem, Alert, Snackbar, CircularProgress,
  Divider, Switch, Tooltip, Checkbox, ListItemText, OutlinedInput,
  Autocomplete
} from '@mui/material'
import axios from 'axios'

const BASE       = import.meta.env.VITE_API_BASE_URL || 'http://https://bioburglifescience-1.onrender.com'
const API        = `${BASE}/api/training/admin`
const UPLOAD_API = `${BASE}/api/upload/video`

const EMPTY_MODULE = {
  title: '', description: '',
  hasVideo: false, videoUrl: '', videoPublicId: '', videoResourceType: 'video',
  hasQuiz: false, passPercent: 70, watchPercent: 70, questions: [],
  assignmentType: 'all', assignedAgents: [], assignedAreas: []
}
const EMPTY_Q = { text: '', options: ['', '', '', ''], correctIndex: 0 }

const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = rej
  r.readAsDataURL(file)
})

const assignBadge = (mod) => {
  if (mod.assignmentType === 'all')      return { label: 'All agents',            bg: '#eff6ff', color: '#1d4ed8' }
  if (mod.assignmentType === 'specific') return { label: `${mod.assignedAgents?.length || 0} agent(s)`, bg: '#fdf4ff', color: '#7c3aed' }
  if (mod.assignmentType === 'area')     return { label: `${mod.assignedAreas?.length || 0} area(s)`,   bg: '#f0fdf4', color: '#16a34a' }
}

export default function TrainingMeeting() {
  const [modules,   setModules]   = useState([])
  const [allAgents, setAllAgents] = useState([])   // [{_id, name, email, assignedArea}]
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const [addDialog,      setAddDialog]      = useState(false)
  const [editTarget,     setEditTarget]     = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [resultsTarget,  setResultsTarget]  = useState(null)
  const [assignDialog,   setAssignDialog]   = useState(null) // view assignments for a module
  const [results,        setResults]        = useState(null)
  const [form,      setForm]     = useState(EMPTY_MODULE)
  const [currentQ,  setCurrentQ] = useState(EMPTY_Q)
  const [agentSearch, setAgentSearch] = useState('')
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' })

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  /* derived: unique areas from allAgents */
  const allAreas = [...new Set(allAgents.map(a => a.assignedArea).filter(Boolean))].sort()

  const fetchAll = async () => {
    try {
      const [modRes, agentRes] = await Promise.all([
        axios.get(`${API}/all`),
        axios.get(`${API}/agents`)
      ])
      if (modRes.data.success)   setModules(modRes.data.modules)
      if (agentRes.data.success) setAllAgents(agentRes.data.agents)
    } catch { toast('Failed to load data', 'error') }
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  /* ── open edit ── */
  const openEdit = async (mod) => {
    try {
      const { data } = await axios.get(`${API}/${mod._id}`)
      if (data.success) {
        const m = data.module
        setForm({
          title: m.title, description: m.description || '',
          hasVideo: m.hasVideo, videoUrl: m.videoUrl || '',
          videoPublicId: m.videoPublicId || '', videoResourceType: m.videoResourceType || 'video',
          hasQuiz: m.hasQuiz, passPercent: m.passPercent, watchPercent: m.watchPercent,
          questions: m.questions || [],
          assignmentType: m.assignmentType || 'all',
          assignedAgents: (m.assignedAgents || []).map(a => a._id || a),
          assignedAreas: m.assignedAreas || []
        })
        setEditTarget(mod._id); setAddDialog(true)
      }
    } catch { toast('Failed to load module', 'error') }
  }

  /* ── video upload ── */
  const handleVideoFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 200 * 1024 * 1024) return toast('Video must be under 200MB', 'warning')
    setUploading(true); setUploadPct(10)
    try {
      const base64 = await toBase64(file)
      setUploadPct(40)
      const { data } = await axios.post(UPLOAD_API, { video: base64 }, {
        onUploadProgress: ev => setUploadPct(40 + Math.round((ev.loaded / ev.total) * 55))
      })
      setUploadPct(100)
      if (data.success) {
        setForm(f => ({ ...f, hasVideo: true, videoUrl: data.url, videoPublicId: data.public_id, videoResourceType: 'video' }))
        toast('Video uploaded')
      }
    } catch { toast('Upload failed. You can paste a YouTube embed URL.', 'error') }
    setUploading(false); setUploadPct(0); e.target.value = ''
  }

  /* ── questions ── */
  const addQuestion = () => {
    if (!currentQ.text.trim() || currentQ.options.some(o => !o.trim()))
      return toast('Fill question text and all 4 options', 'warning')
    setForm(f => ({ ...f, questions: [...f.questions, { ...currentQ }] }))
    setCurrentQ(EMPTY_Q)
  }

  /* ── save ── */
  const handleSave = async () => {
    if (!form.title.trim()) return toast('Title is required', 'warning')
    if (form.hasVideo && !form.videoUrl) return toast('Add or upload a video', 'warning')
    if (form.hasQuiz && form.questions.length < 1) return toast('Add at least one question', 'warning')
    if (form.assignmentType === 'specific' && form.assignedAgents.length === 0)
      return toast('Select at least one agent', 'warning')
    if (form.assignmentType === 'area' && form.assignedAreas.length === 0)
      return toast('Select at least one area', 'warning')

    setSaving(true)
    try {
      if (editTarget) {
        const { data } = await axios.put(`${API}/${editTarget}`, form)
        if (data.success) { toast('Module updated'); fetchAll() }
      } else {
        const { data } = await axios.post(`${API}/create`, form)
        if (data.success) { toast('Module created'); fetchAll() }
      }
      closeDialog()
    } catch (e) { toast(e.response?.data?.message || 'Save failed', 'error') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/${deleteTarget._id}`)
      toast('Module deleted'); setDeleteTarget(null); fetchAll()
    } catch { toast('Delete failed', 'error') }
  }

  const handleRemoveVideo = async () => {
    if (!editTarget) return
    try {
      await axios.delete(`${API}/${editTarget}/video`)
      setForm(f => ({ ...f, hasVideo: false, videoUrl: '', videoPublicId: '' }))
      toast('Video removed from Cloudinary')
    } catch { toast('Failed', 'error') }
  }

  const handleToggleVisibility = async (mod) => {
    try {
      const { data } = await axios.patch(`${API}/${mod._id}/visibility`)
      toast(data.message); fetchAll()
    } catch { toast('Update failed', 'error') }
  }

  const openResults = async (mod) => {
    setResultsTarget(mod); setResults(null)
    try {
      const { data } = await axios.get(`${API}/${mod._id}/results`)
      if (data.success) setResults(data)
    } catch { toast('Failed to load results', 'error') }
  }

  const closeDialog = () => {
    setAddDialog(false); setEditTarget(null); setForm(EMPTY_MODULE); setCurrentQ(EMPTY_Q); setAgentSearch('')
  }

  /* filtered agents for picker */
  const filteredAgents = allAgents.filter(a =>
    !agentSearch ||
    a.name?.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.assignedArea?.toLowerCase().includes(agentSearch.toLowerCase())
  )

  const totalAttempts = modules.reduce((s, m) => s + m.totalAttempts, 0)
  const totalPassed   = modules.reduce((s, m) => s + m.passedAttempts, 0)

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#1d4ed8' }} />
      <Typography sx={{ color: '#64748b', fontSize: 14 }}>Loading...</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Training & Meeting</Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
            Assign modules to all agents, specific agents, or by area.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setAddDialog(true)}
          sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, px: 3, py: 1.2, borderRadius: 2, fontWeight: 700 }}>
          + ADD MODULE
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'MODULES',        value: modules.length,              color: '#1d4ed8' },
          { label: 'TOTAL ATTEMPTS', value: totalAttempts,               color: '#7c3aed' },
          { label: 'PASSED',         value: totalPassed,                 color: '#16a34a' },
          { label: 'FAILED',         value: totalAttempts - totalPassed, color: '#dc2626' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 3, p: 2.5, bgcolor: 'white' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'monospace', mt: 0.5 }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Module cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {modules.length === 0 && (
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 6, textAlign: 'center', bgcolor: 'white' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>No modules yet.</Typography>
          </Paper>
        )}

        {modules.map(mod => {
          const ab = assignBadge(mod)
          return (
            <Paper key={mod._id} elevation={0}
              sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white', opacity: mod.isVisible ? 1 : 0.65 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{mod.title}</Typography>
                    {mod.hasVideo && <Chip label="Video" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }} />}
                    {mod.hasQuiz  && <Chip label="Quiz"  size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fdf4ff', color: '#7c3aed', fontWeight: 700 }} />}
                    {!mod.isVisible && <Chip label="Hidden" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700 }} />}
                    {/* Assignment badge */}
                    <Chip
                      label={ab.label} size="small"
                      onClick={() => setAssignDialog(mod)}
                      sx={{ fontSize: 10, height: 20, bgcolor: ab.bg, color: ab.color, fontWeight: 700, cursor: 'pointer' }} />
                  </Box>
                  {mod.description && <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1.5 }}>{mod.description}</Typography>}
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {[
                      mod.hasQuiz && { label: 'PASS LIMIT', value: `${mod.passPercent}%` },
                      mod.hasVideo && mod.hasQuiz && { label: 'WATCH BEFORE QUIZ', value: `${mod.watchPercent}%` },
                      mod.hasQuiz && { label: 'QUESTIONS', value: mod.questionCount },
                      { label: 'ATTEMPTS', value: mod.totalAttempts },
                      mod.passRate !== null && { label: 'PASS RATE', value: `${mod.passRate}%` },
                      { label: 'CREATED', value: new Date(mod.createdAt).toLocaleDateString('en-IN') },
                    ].filter(Boolean).map(x => (
                      <Box key={x.label}>
                        <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{x.label}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{x.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Tooltip title={mod.isVisible ? 'Hide from agents' : 'Show to agents'}>
                    <Button size="small" variant="outlined" onClick={() => handleToggleVisibility(mod)}
                      sx={{ fontSize: 11, fontWeight: 700, borderRadius: 2,
                        borderColor: mod.isVisible ? '#16a34a' : '#94a3b8',
                        color:       mod.isVisible ? '#16a34a' : '#94a3b8' }}>
                      {mod.isVisible ? 'VISIBLE' : 'HIDDEN'}
                    </Button>
                  </Tooltip>
                  <Button size="small" variant="outlined" onClick={() => openEdit(mod)}
                    sx={{ fontSize: 11, fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>EDIT</Button>
                  {mod.totalAttempts > 0 && (
                    <Button size="small" variant="outlined" onClick={() => openResults(mod)}
                      sx={{ fontSize: 11, fontWeight: 700, borderRadius: 2, borderColor: '#7c3aed', color: '#7c3aed' }}>RESULTS</Button>
                  )}
                  <Button size="small" variant="outlined" onClick={() => setDeleteTarget(mod)}
                    sx={{ fontSize: 11, fontWeight: 700, borderRadius: 2, borderColor: '#dc2626', color: '#dc2626' }}>DELETE</Button>
                </Box>
              </Box>
              {mod.totalAttempts > 0 && mod.passRate !== null && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={mod.passRate}
                    sx={{ height: 5, borderRadius: 3, bgcolor: '#fee2e2',
                      '& .MuiLinearProgress-bar': { bgcolor: mod.passRate >= (mod.passPercent || 70) ? '#16a34a' : '#dc2626', borderRadius: 3 } }} />
                </Box>
              )}
            </Paper>
          )
        })}
      </Box>

      {/* ADD / EDIT DIALOG  */}
      <Dialog open={addDialog} onClose={closeDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0f172a', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          {editTarget ? 'Edit Training Module' : 'Add Training Module'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Basic */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>BASIC INFO</Typography>
            <TextField fullWidth size="small" label="Module Title *"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <TextField fullWidth size="small" label="Description (optional)" multiline rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <Divider />

            {/* ── ASSIGNMENT SECTION ── */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>ASSIGN TO</Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {[
                { value: 'all',      label: 'All agents', desc: `${allAgents.length} agents` },
                { value: 'specific', label: 'Specific agents', desc: 'Choose by name' },
                { value: 'area',     label: 'By area', desc: 'Choose by assigned area' },
              ].map(opt => (
                <Box key={opt.value} onClick={() => setForm(f => ({ ...f, assignmentType: opt.value, assignedAgents: [], assignedAreas: [] }))}
                  sx={{ flex: 1, minWidth: 140, p: 2, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${form.assignmentType === opt.value ? '#1d4ed8' : '#e2e8f0'}`,
                    bgcolor: form.assignmentType === opt.value ? '#eff6ff' : 'white' }}>
                  <Typography sx={{ fontSize: 20, mb: 0.5 }}>{opt.icon}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: form.assignmentType === opt.value ? '#1e40af' : '#334155' }}>
                    {opt.label}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{opt.desc}</Typography>
                </Box>
              ))}
            </Box>

            {/* Specific agents picker */}
            {form.assignmentType === 'specific' && (
              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    SELECT AGENTS ({form.assignedAgents.length} selected)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => setForm(f => ({ ...f, assignedAgents: allAgents.map(a => a._id) }))}
                      sx={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>Select all</Button>
                    <Button size="small" onClick={() => setForm(f => ({ ...f, assignedAgents: [] }))}
                      sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Clear</Button>
                  </Box>
                </Box>
                <TextField fullWidth size="small" placeholder="Search by name or area..."
                  value={agentSearch} onChange={e => setAgentSearch(e.target.value)}
                  sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <Box sx={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {filteredAgents.length === 0 && (
                    <Typography sx={{ color: '#94a3b8', fontSize: 13, py: 2, textAlign: 'center' }}>No agents found.</Typography>
                  )}
                  {filteredAgents.map(a => {
                    const selected = form.assignedAgents.includes(a._id)
                    return (
                      <Box key={a._id} onClick={() => setForm(f => ({
                        ...f,
                        assignedAgents: selected
                          ? f.assignedAgents.filter(id => id !== a._id)
                          : [...f.assignedAgents, a._id]
                      }))}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer',
                          bgcolor: selected ? '#eff6ff' : 'transparent',
                          border: `1px solid ${selected ? '#bfdbfe' : 'transparent'}`,
                          '&:hover': { bgcolor: selected ? '#eff6ff' : '#f8fafc' } }}>
                        <Checkbox size="small" checked={selected}
                          sx={{ p: 0, color: '#94a3b8', '&.Mui-checked': { color: '#1d4ed8' } }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{a.email}</Typography>
                        </Box>
                        {a.assignedArea && (
                          <Chip label={a.assignedArea} size="small"
                            sx={{ fontSize: 10, height: 18, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                        )}
                      </Box>
                    )
                  })}
                </Box>
                {form.assignedAgents.length > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {form.assignedAgents.map(id => {
                      const ag = allAgents.find(a => a._id === id)
                      return ag ? (
                        <Chip key={id} label={ag.name} size="small" onDelete={() =>
                          setForm(f => ({ ...f, assignedAgents: f.assignedAgents.filter(x => x !== id) }))}
                          sx={{ fontSize: 11, height: 22, bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 600 }} />
                      ) : null
                    })}
                  </Box>
                )}
              </Box>
            )}

            {/* Area picker */}
            {form.assignmentType === 'area' && (
              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    SELECT AREAS ({form.assignedAreas.length} selected)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => setForm(f => ({ ...f, assignedAreas: allAreas }))}
                      sx={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Select all</Button>
                    <Button size="small" onClick={() => setForm(f => ({ ...f, assignedAreas: [] }))}
                      sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Clear</Button>
                  </Box>
                </Box>
                {allAreas.length === 0 ? (
                  <Alert severity="info" sx={{ fontSize: 12, borderRadius: 2 }}>
                    No assigned areas found. Assign areas to agents first from the agent profile.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {allAreas.map(area => {
                      const selected = form.assignedAreas.includes(area)
                      const agentCount = allAgents.filter(a => a.assignedArea === area).length
                      return (
                        <Box key={area} onClick={() => setForm(f => ({
                          ...f,
                          assignedAreas: selected
                            ? f.assignedAreas.filter(x => x !== area)
                            : [...f.assignedAreas, area]
                        }))}
                          sx={{ px: 2, py: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center', minWidth: 100,
                            border: `2px solid ${selected ? '#16a34a' : '#e2e8f0'}`,
                            bgcolor: selected ? '#f0fdf4' : 'white' }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: selected ? '#15803d' : '#334155' }}>{area}</Typography>
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{agentCount} agent{agentCount !== 1 ? 's' : ''}</Typography>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Box>
            )}

            <Divider />

            {/* VIDEO */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Training Video</Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Optional — upload MP4/WebM or paste YouTube embed URL</Typography>
              </Box>
              <Switch checked={form.hasVideo}
                onChange={e => setForm(f => ({ ...f, hasVideo: e.target.checked, videoUrl: e.target.checked ? f.videoUrl : '', videoPublicId: '' }))} />
            </Box>

            {form.hasVideo && (
              <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="warning" sx={{ fontSize: 12, borderRadius: 2 }}>
                  Agents cannot download, skip, or share this video.
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button variant="outlined" component="label" size="small" disabled={uploading}
                    sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#0369a1', color: '#0369a1', fontSize: 12, flexShrink: 0 }}>
                    {uploading ? <><CircularProgress size={13} sx={{ mr: 1 }} />{uploadPct}%</> : 'Upload Video File'}
                    <input type="file" accept="video/mp4,video/webm,video/ogg" hidden onChange={handleVideoFileSelect} />
                  </Button>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>or</Typography>
                  <TextField size="small" label="Paste YouTube embed URL" sx={{ flex: 1, minWidth: 200 }}
                    placeholder="https://www.youtube.com/embed/..."
                    value={form.videoUrl}
                    onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value, videoPublicId: '' }))} />
                </Box>
                {uploading && (
                  <LinearProgress variant="determinate" value={uploadPct}
                    sx={{ height: 5, borderRadius: 3, bgcolor: '#e0f2fe', '& .MuiLinearProgress-bar': { bgcolor: '#0369a1', borderRadius: 3 } }} />
                )}
                {form.videoUrl && !uploading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip label="Video URL set" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700 }} />
                    {editTarget && form.videoPublicId && (
                      <Button size="small" onClick={handleRemoveVideo}
                        sx={{ color: '#dc2626', fontWeight: 700, fontSize: 11 }}>Remove from Cloudinary</Button>
                    )}
                  </Box>
                )}
                {form.hasQuiz && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField size="small" type="number" label="Min. watch % before quiz" sx={{ width: 220 }}
                      inputProps={{ min: 0, max: 100 }} value={form.watchPercent}
                      onChange={e => setForm(f => ({ ...f, watchPercent: Number(e.target.value) }))} />
                    <Typography sx={{ fontSize: 12, color: '#64748b' }}>% of video</Typography>
                  </Box>
                )}
              </Box>
            )}

            <Divider />

            {/* QUIZ */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Paper / Quiz Set</Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>Optional — correct answers never exposed, graded server-side</Typography>
              </Box>
              <Switch checked={form.hasQuiz} onChange={e => setForm(f => ({ ...f, hasQuiz: e.target.checked }))} />
            </Box>

            {form.hasQuiz && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField size="small" type="number" label="Pass percentage" sx={{ width: 160 }}
                    inputProps={{ min: 1, max: 100 }} value={form.passPercent}
                    onChange={e => setForm(f => ({ ...f, passPercent: Number(e.target.value) }))} />
                  <Typography sx={{ fontSize: 12, color: '#64748b' }}>% correct to pass</Typography>
                </Box>

                {form.questions.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#334155', mb: 1, letterSpacing: '0.06em' }}>
                      QUESTIONS ({form.questions.length})
                    </Typography>
                    {form.questions.map((q, i) => (
                      <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Q{i + 1}. {q.text}</Typography>
                          <Button size="small"
                            onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))}
                            sx={{ color: '#dc2626', minWidth: 'auto', p: '2px 6px', fontSize: 11 }}>✕</Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                          {q.options.map((opt, oi) => (
                            <Chip key={oi} label={opt} size="small"
                              sx={{ fontSize: 10, height: 20,
                                bgcolor: oi === q.correctIndex ? '#f0fdf4' : '#f1f5f9',
                                color:   oi === q.correctIndex ? '#15803d' : '#475569',
                                fontWeight: oi === q.correctIndex ? 700 : 400 }} />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                <Box sx={{ p: 2, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.06em' }}>ADD QUESTION</Typography>
                  <TextField fullWidth size="small" label="Question text"
                    value={currentQ.text} onChange={e => setCurrentQ(q => ({ ...q, text: e.target.value }))} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {currentQ.options.map((opt, i) => (
                      <TextField key={i} size="small"
                        label={`Option ${i + 1}${i === currentQ.correctIndex ? '  ✓ correct' : ''}`}
                        value={opt}
                        onChange={e => setCurrentQ(q => ({ ...q, options: q.options.map((o, oi) => oi === i ? e.target.value : o) }))} />
                    ))}
                  </Box>
                  <FormControl size="small" sx={{ width: 220 }}>
                    <InputLabel>Correct answer</InputLabel>
                    <Select label="Correct answer" value={currentQ.correctIndex}
                      onChange={e => setCurrentQ(q => ({ ...q, correctIndex: e.target.value }))}>
                      {currentQ.options.map((o, i) => (
                        <MenuItem key={i} value={i}>Option {i + 1}{o ? `: ${o.slice(0, 28)}` : ''}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="outlined" size="small" onClick={addQuestion}
                    sx={{ alignSelf: 'flex-start', fontWeight: 700, borderRadius: 2, borderColor: '#ca8a04', color: '#ca8a04' }}>
                    + ADD QUESTION
                  </Button>
                </Box>
              </Box>
            )}

            {!form.hasVideo && !form.hasQuiz && (
              <Alert severity="info" sx={{ borderRadius: 2, fontSize: 12 }}>
                Enable Video, Quiz, or both to make this module useful.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeDialog} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || uploading}
            sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : editTarget ? 'UPDATE MODULE' : 'SAVE MODULE'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════ ASSIGNMENT VIEW DIALOG ══════════ */}
      <Dialog open={!!assignDialog} onClose={() => setAssignDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {assignDialog && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 16, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
              Assignment — {assignDialog.title}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {assignDialog.assignmentType === 'all' && (
                <Alert severity="info" sx={{ borderRadius: 2, fontSize: 13 }}>
                  Visible to all {allAgents.length} active agents.
                </Alert>
              )}
              {assignDialog.assignmentType === 'specific' && (
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', mb: 1.5, letterSpacing: '0.07em' }}>
                    ASSIGNED AGENTS ({assignDialog.assignedAgents?.length || 0})
                  </Typography>
                  {(assignDialog.assignedAgents || []).length === 0
                    ? <Typography sx={{ color: '#94a3b8', fontSize: 13 }}>No agents assigned.</Typography>
                    : (assignDialog.assignedAgents || []).map(a => (
                      <Box key={a._id || a} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#eff6ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#1d4ed8', flexShrink: 0 }}>
                          {(a.name || '?')[0].toUpperCase()}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{a.assignedArea || a.email}</Typography>
                        </Box>
                      </Box>
                    ))
                  }
                </Box>
              )}
              {assignDialog.assignmentType === 'area' && (
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', mb: 1.5, letterSpacing: '0.07em' }}>
                    ASSIGNED AREAS ({assignDialog.assignedAreas?.length || 0})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(assignDialog.assignedAreas || []).map(area => (
                      <Box key={area} sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>{area}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                          {allAgents.filter(a => a.assignedArea === area).length} agent(s)
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setAssignDialog(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
              <Button variant="outlined" onClick={() => { setAssignDialog(null); openEdit(assignDialog) }}
                sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#1d4ed8', color: '#1d4ed8' }}>Edit Assignment</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ══════════ DELETE ══════════ */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, color: '#dc2626' }}>Delete Module</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#334155' }}>
            Delete <strong>{deleteTarget?.title}</strong>? Video will be permanently removed from Cloudinary. Cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700, px: 3, borderRadius: 2 }}>DELETE</Button>
        </DialogActions>
      </Dialog>

      {/* ══════════ RESULTS ══════════ */}
      <Dialog open={!!resultsTarget} onClose={() => { setResultsTarget(null); setResults(null) }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {resultsTarget && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2 }}>
              Results — {resultsTarget.title}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {!results
                ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#1d4ed8' }} /></Box>
                : (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                      {[
                        { label: 'ATTEMPTS', value: results.totalAttempts,                           color: '#1d4ed8' },
                        { label: 'PASSED',   value: results.passedAttempts,                          color: '#16a34a' },
                        { label: 'FAILED',   value: results.totalAttempts - results.passedAttempts,  color: '#dc2626' },
                      ].map(s => (
                        <Box key={s.label} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{s.label}</Typography>
                          <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</Typography>
                        </Box>
                      ))}
                    </Box>
                    {results.attempts.length === 0
                      ? <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 3, fontSize: 14 }}>No attempts yet.</Typography>
                      : results.attempts.map((a, i) => {
                          const sp = a.total ? Math.round((a.score / a.total) * 100) : 0
                          return (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                              <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{a.agentName}</Typography>
                                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                                  {new Date(a.createdAt).toLocaleDateString('en-IN')} · {a.timeTaken}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{a.score}/{a.total} ({sp}%)</Typography>
                                <Chip label={a.passed ? 'Passed' : 'Failed'} size="small"
                                  sx={{ fontSize: 10, height: 22, fontWeight: 700,
                                    bgcolor: a.passed ? '#f0fdf4' : '#fef2f2', color: a.passed ? '#15803d' : '#dc2626' }} />
                              </Box>
                            </Box>
                          )
                        })
                    }
                  </>
                )
              }
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => { setResultsTarget(null); setResults(null) }} sx={{ color: '#64748b', fontWeight: 600 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}