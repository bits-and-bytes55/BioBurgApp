import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Button, Paper, Chip, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Snackbar, Radio, RadioGroup, FormControlLabel, FormControl, Divider
} from '@mui/material'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL;
const API  = `${BASE}/api/training/agent`
const getToken   = () => localStorage.getItem('agentToken')
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

export default function AgentTraining() {
  const [modules, setModules]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeModule, setActiveModule] = useState(null)  // full module data
  const [loadingModule, setLoadingModule] = useState(false)

  // Video state
  const [watchedPct, setWatchedPct]     = useState(0)
  const [quizUnlocked, setQuizUnlocked] = useState(false)
  const [isCompleted, setIsCompleted]   = useState(false)
  const [completing, setCompleting]     = useState(false)
  const videoRef     = useRef(null)
  const startTimeRef = useRef(null)
  const maxWatchedRef = useRef(0)  

  // Quiz state
  const [answers, setAnswers]         = useState([])
  const [submitted, setSubmitted]     = useState(false)
  const [result, setResult]           = useState(null)
  const [submitting, setSubmitting]   = useState(false)

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' })
  const toast = (msg, severity = 'info') => setSnack({ open: true, msg, severity })

  /* ── Fetch module list ── */
  const fetchModules = async () => {
    try {
      const { data } = await axios.get(`${API}/modules`, { headers: authHeader() })
      if (data.success) setModules(data.modules)
    } catch { toast('Failed to load modules', 'error') }
    setLoading(false)
  }
  useEffect(() => { fetchModules() }, [])

  /* ── Open a module ── */
  const openModule = async (mod) => {
    setLoadingModule(true)
    try {
      const { data } = await axios.get(`${API}/modules/${mod._id}`, { headers: authHeader() })
      if (data.success) {
        const m = data.module
        setActiveModule(m)
        setAnswers(new Array(m.questions?.length || 0).fill(null))
        setSubmitted(false)
        setResult(null)
        setWatchedPct(0)
        setQuizUnlocked(!m.hasVideo || m.watchPercent === 0)
        setIsCompleted(m.hasPassed || false)
        setCompleting(false)
        maxWatchedRef.current = 0
        startTimeRef.current = Date.now()
      }
    } catch { toast('Failed to load module', 'error') }
    setLoadingModule(false)
  }

  // AFTER
  const closeModule = () => {
    setActiveModule(null); setAnswers([]); setSubmitted(false)
    setResult(null); setWatchedPct(0); setQuizUnlocked(false)
    setIsCompleted(false); setCompleting(false)
    maxWatchedRef.current = 0
  }

  /* ── Video time tracking ── */
  // AFTER
  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return

    // Prevent skipping forward — rewind if jumped > 2s ahead of max watched
    if (v.currentTime > maxWatchedRef.current + 2) {
      v.currentTime = maxWatchedRef.current
    } else {
      maxWatchedRef.current = Math.max(maxWatchedRef.current, v.currentTime)
    }

    const pct = Math.round((v.currentTime / v.duration) * 100)
    setWatchedPct(pct)
    if (activeModule?.hasQuiz && pct >= (activeModule.watchPercent || 0)) {
      setQuizUnlocked(true)
    }
  }

  // NEW — fires when video reaches the end naturally
  const handleVideoEnded = async () => {
    if (isCompleted || completing || activeModule?.hasQuiz) return
    setCompleting(true)
    try {
      await axios.post(
        `${BASE}/api/training/agent/modules/${activeModule._id}/complete`,
        {},
        { headers: authHeader() }
      )
      setIsCompleted(true)
      toast('🎉 Module completed! Great work.', 'success')
      fetchModules()  // updates Available/Completed counts on dashboard
    } catch (err) {
      toast(err?.response?.data?.message || 'Could not save completion', 'error')
    } finally {
      setCompleting(false)
    }
  }

  /* ── Submit quiz ── */
  const handleSubmit = async () => {
    if (answers.some(a => a === null)) {
      return toast('Please answer all questions before submitting', 'warning')
    }
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    const mins  = Math.floor(elapsed / 60)
    const secs  = elapsed % 60
    const timeTaken = `${mins}m ${secs}s`

    setSubmitting(true)
    try {
      const { data } = await axios.post(
        `${API}/modules/${activeModule._id}/attempt`,
        { answers: answers.map(Number), timeTaken, watchedPct },
        { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
      )
      if (data.success) {
        setResult(data.result)
        setSubmitted(true)
        // Refresh module list — passed modules auto-disappear from list
        fetchModules()
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Submission failed', 'error')
    }
    setSubmitting(false)
  }

  const available  = modules.filter(m => !m.hasPassed)
  const completed  = modules.filter(m => m.hasPassed)

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress sx={{ color: '#1d4ed8' }} />
      <Typography sx={{ color: '#64748b', fontSize: 14 }}>Loading training modules...</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Training & Meeting
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
          Complete your training modules to build your product knowledge.
        </Typography>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Available', value: available.length, color: '#1d4ed8' },
          { label: 'Completed', value: completed.length, color: '#16a34a' },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderLeft: `3px solid ${s.color}`, borderRadius: 3, px: 2.5, py: 2, bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Available modules */}
      {available.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 6, textAlign: 'center', bgcolor: 'white', mb: 3 }}>
          <Typography sx={{ color: '#16a34a', fontWeight: 700, fontSize: 16, mb: 0.5 }}>All done!</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: 14 }}>You have completed all available training modules.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>AVAILABLE ({available.length})</Typography>
          {available.map(mod => (
            <Paper key={mod._id} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{mod.title}</Typography>
                    {mod.hasVideo && <Chip label="Video" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }} />}
                    {mod.hasQuiz  && <Chip label="Quiz" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fdf4ff', color: '#7c3aed', fontWeight: 700 }} />}
                    {mod.attempted && !mod.hasPassed && (
                      <Chip label="Attempted" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700 }} />
                    )}
                  </Box>
                  {mod.description && (
                    <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1 }}>{mod.description}</Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {mod.hasQuiz && (
                      <Box>
                        <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>PASS LIMIT</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{mod.passPercent}%</Typography>
                      </Box>
                    )}
                    {mod.hasQuiz && (
                      <Box>
                        <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>QUESTIONS</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>{mod.questionCount}</Typography>
                      </Box>
                    )}
                    {mod.lastScore && (
                      <Box>
                        <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>LAST SCORE</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>{mod.lastScore}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Button variant="contained" size="small" onClick={() => openModule(mod)} disabled={loadingModule}
                  sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 2.5, py: 1, borderRadius: 2, fontSize: 12 }}>
                  {mod.attempted ? 'RETRY' : 'START'}
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Completed modules */}
      {completed.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>COMPLETED ({completed.length})</Typography>
          {completed.map(mod => (
            <Paper key={mod._id} elevation={0}
              sx={{ border: '1px solid #e2e8f0', borderRadius: 3, px: 3, py: 2, bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#f0fdf4', border: '2px solid #bbf7d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 13, color: '#16a34a' }}>✓</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#475569' }}>{mod.title}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {mod.lastScore && <Typography sx={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{mod.lastScore}</Typography>}
                <Chip label="Passed" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700 }} />
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* ─────────── MODULE VIEW DIALOG ─────────── */}
      <Dialog open={!!activeModule} onClose={closeModule} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        {activeModule && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: 17, borderBottom: '1px solid #f1f5f9', pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {activeModule.title}
              <Chip label="SECURED" size="small" sx={{ fontSize: 10, height: 20, bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700 }} />
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>

              {/* ── RESULT SCREEN ── */}
              {submitted && result && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 2,
                    bgcolor: result.passed ? '#f0fdf4' : '#fef2f2',
                    border: `3px solid ${result.passed ? '#16a34a' : '#dc2626'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 32 }}>{result.passed ? '✓' : '✗'}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: result.passed ? '#15803d' : '#dc2626', mb: 1 }}>
                    {result.passed ? 'Congratulations!' : 'Better luck next time!'}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: '#475569', mb: 3 }}>{result.message}</Typography>
                  <Box sx={{ display: 'inline-flex', gap: 4, px: 4, py: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    {[
                      { label: 'YOUR SCORE', value: `${result.scorePct}%` },
                      { label: 'PASS MARK', value: `${result.passPercent}%` },
                      { label: 'RESULT', value: result.passed ? 'PASS' : 'FAIL' },
                    ].map(x => (
                      <Box key={x.label} sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.07em' }}>{x.label}</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace',
                          color: x.label === 'RESULT' ? (result.passed ? '#15803d' : '#dc2626') : '#0f172a' }}>{x.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* ── VIDEO ── */}
              {!submitted && activeModule.hasVideo && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="error" sx={{ mb: 1.5, fontSize: 12, borderRadius: 2 }}>
                    ⚠️ This training video is confidential. Downloading, screen recording, or sharing is strictly prohibited and may result in disciplinary action.
                  </Alert>

                  {/* Secured video player */}
                  <Box sx={{ position: 'relative', paddingTop: '56.25%', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}
                    onContextMenu={e => e.preventDefault()}>
                    
                    // AFTER
                  {activeModule.videoUrl.includes('youtube.com') || activeModule.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={`${activeModule.videoUrl}?controls=0&modestbranding=1&rel=0&fs=0&disablekb=1`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope"
                        allowFullScreen={false}
                        title={activeModule.title}
                      />
                    ) : (
                      <>
                        <style>{`
                          video::-webkit-media-controls-timeline { display: none !important; }
                          video::-webkit-media-controls-current-time-display { display: none !important; }
                          video::-webkit-media-controls-time-remaining-display { display: none !important; }
                        `}</style>
                        <video
                          ref={videoRef}
                          src={activeModule.videoUrl}
                          controls
                          controlsList="nodownload noremoteplayback noplaybackrate"
                          disablePictureInPicture
                          onContextMenu={e => e.preventDefault()}
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={handleVideoEnded}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                      </>
                    )}
                    {/* Blocks right-click on YouTube iframe top half */}
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '60px', zIndex: 1, cursor: 'default' }}
                      onContextMenu={e => e.preventDefault()} />
                  </Box>

                  {activeModule.hasQuiz && activeModule.watchPercent > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                          {quizUnlocked ? 'Quiz unlocked!' : `Watch ${activeModule.watchPercent}% to unlock quiz`}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{watchedPct}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Math.min(100, watchedPct)}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': { bgcolor: quizUnlocked ? '#16a34a' : '#1d4ed8', borderRadius: 3 } }} />
                    </Box>
                  )}
                </Box>
              )}

              {/* ── QUIZ ── */}
              {!submitted && activeModule.hasQuiz && activeModule.questions.length > 0 && (
                <Box>
                  {!quizUnlocked && activeModule.hasVideo ? (
                    <Alert severity="warning" sx={{ borderRadius: 2, fontSize: 13 }}>
                      Watch at least {activeModule.watchPercent}% of the video to unlock the quiz.
                    </Alert>
                  ) : (
                    <>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a', mb: 2, mt: activeModule.hasVideo ? 1 : 0 }}>
                        Quiz — {activeModule.questions.length} questions · Pass mark {activeModule.passPercent}%
                      </Typography>
                      {activeModule.questions.map((q, qi) => (
                        <Box key={qi} sx={{ mb: 3 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a', mb: 1 }}>
                            Q{qi + 1}. {q.text}
                          </Typography>
                          <FormControl component="fieldset">
                            <RadioGroup value={answers[qi] ?? ''} onChange={e => {
                              const newAns = [...answers]; newAns[qi] = Number(e.target.value); setAnswers(newAns)
                            }}>
                              {q.options.map((opt, oi) => (
                                <FormControlLabel key={oi} value={oi}
                                  control={<Radio size="small" sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#1d4ed8' } }} />}
                                  label={<Typography sx={{ fontSize: 13, color: '#334155' }}>{opt}</Typography>}
                                  sx={{ mb: 0.5, px: 1, borderRadius: 1,
                                    bgcolor: answers[qi] === oi ? '#eff6ff' : 'transparent',
                                    border: answers[qi] === oi ? '1px solid #bfdbfe' : '1px solid transparent' }} />
                              ))}
                            </RadioGroup>
                          </FormControl>
                          {qi < activeModule.questions.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              )}

              {/* Video-only module message + completion status */}
              {!submitted && activeModule.hasVideo && !activeModule.hasQuiz && (
                isCompleted ? (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2, fontSize: 13, fontWeight: 700 }}>
                    You have completed this module!
                  </Alert>
                ) : completing ? (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: 13 }}>
                    Saving your completion...
                  </Alert>
                ) : (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2, fontSize: 13 }}>
                    This is a video-only module. Watch the video above to complete your training.
                  </Alert>
                )
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={closeModule} sx={{ color: '#64748b', fontWeight: 600 }}>
                {submitted ? 'Close' : 'Cancel'}
              </Button>
              {!submitted && activeModule.hasQuiz && quizUnlocked && (
                <Button variant="contained" onClick={handleSubmit} disabled={submitting || answers.some(a => a === null)}
                  sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
                  {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'SUBMIT QUIZ'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  )
}