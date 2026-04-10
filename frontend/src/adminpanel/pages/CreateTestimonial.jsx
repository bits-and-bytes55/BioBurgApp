import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Box, TextField, Button, Typography, Grid, Card, CardContent,
  Container, IconButton, Avatar, Paper, InputAdornment, Divider,
  CircularProgress, MenuItem,
} from '@mui/material'
import CloudUploadIcon       from '@mui/icons-material/CloudUpload'
import DeleteIcon            from '@mui/icons-material/Delete'
import SendIcon              from '@mui/icons-material/Send'
import VideoCameraBackIcon   from '@mui/icons-material/VideoCameraBack'
import PersonIcon            from '@mui/icons-material/Person'
import WorkIcon              from '@mui/icons-material/Work'
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark'
import DescriptionIcon       from '@mui/icons-material/Description'
import CalendarTodayIcon     from '@mui/icons-material/CalendarToday'
import { compressAndUpload } from '../../../utils/mediaCompressor'

const API_BASE      = import.meta.env.VITE_API_BASE_URL;
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const INITIAL_FORM = {
  description: '', clientName: '', position: '',
  birthDate: '', brandId: '', brandName: '',
}

const th = { textAlign: 'left', padding: '12px', fontSize: '13px', fontWeight: 600 }
const td = { padding: '12px', fontSize: '13px' }

/* ── UploadBox ──────────────────────────────────────────────────────────── */
function UploadBox({ label, icon, preview, onFileChange, onRemove, accept, type, progress }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2, textAlign: 'center', borderStyle: 'dashed',
        borderColor: preview ? 'primary.main' : 'grey.400',
        bgcolor: preview ? 'primary.50' : 'grey.50',
        cursor: 'pointer', position: 'relative', transition: '0.3s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.100' },
        minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {preview ? (
        <Box position="relative" width="100%" height="100%">
          {type === 'video'
            ? <video src={preview} controls style={{ width: '100%', borderRadius: 8 }} />
            : <Avatar src={preview} variant="rounded" sx={{ width: 120, height: 120, mx: 'auto' }} />
          }
          {progress > 0 && progress < 100 && (
            <Box sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              bgcolor: 'rgba(0,0,0,0.5)', color: 'white', py: 0.5,
              borderRadius: '0 0 8px 8px', textAlign: 'center',
            }}>
              <Typography variant="caption">Uploading {progress}%</Typography>
            </Box>
          )}
          <IconButton
            size="small" color="error"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onRemove() }}
            sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#ffebee' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box component="label" sx={{ width: '100%', height: '100%', cursor: 'pointer', textAlign: 'center' }}>
          {icon}
          <Typography variant="body2" fontWeight={600} mt={1}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">Click to browse</Typography>
          <input type="file" accept={accept} hidden onChange={onFileChange} />
        </Box>
      )}
    </Paper>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function CreateTestimonial() {
  const [loading,       setLoading]       = useState(false)
  const [brands,        setBrands]        = useState([])
  const [testimonials,  setTestimonials]  = useState([])
  const [listLoading,   setListLoading]   = useState(false)
  const [formData,      setFormData]      = useState(INITIAL_FORM)
  const [videoFile,     setVideoFile]     = useState(null)
  const [imageFile,     setImageFile]     = useState(null)
  const [previewVideo,  setPreviewVideo]  = useState(null)
  const [previewImage,  setPreviewImage]  = useState(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [imageProgress, setImageProgress] = useState(0)
  const [statusMsg,     setStatusMsg]     = useState('')

  const brandFetchedRef = useRef(false)

  const cloudinaryConfig = { cloudName: CLOUD_NAME, uploadPreset: UPLOAD_PRESET }

  /* ── Load brands ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (brandFetchedRef.current) return
    brandFetchedRef.current = true
    const token = localStorage.getItem('adminToken')
    axios.get(`${API_BASE}/api/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        const productList = res.data?.products || res.data || []
        const unique = [...new Set(productList.map(p => p.brandName).filter(Boolean))]
        setBrands(unique)
      })
      .catch(() => toast.error('Could not load brand list — type manually', { id: 'brand-load-err' }))
  }, [])

  /* ── Fetch testimonials ─────────────────────────────────────────────── */
  const fetchTestimonials = async () => {
    try {
      setListLoading(true)
      const res = await axios.get(`${API_BASE}/api/testimonial/all`)
      setTestimonials(res.data.data || [])
    } catch {
      toast.error('Failed to load testimonials')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => { fetchTestimonials() }, [])

  /* ── File handlers ──────────────────────────────────────────────────── */
  const handleVideoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file); setPreviewVideo(URL.createObjectURL(file)); setVideoProgress(0)
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file); setPreviewImage(URL.createObjectURL(file)); setImageProgress(0)
  }

  const removeVideo = () => { setVideoFile(null); setPreviewVideo(null); setVideoProgress(0) }
  const removeImage = () => { setImageFile(null); setPreviewImage(null); setImageProgress(0) }

  /* ── Brand / field handlers ─────────────────────────────────────────── */
  const handleBrandSelect = e => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setFormData(prev => ({ ...prev, brandName: name, brandId: slug }))
  }

  const handleField = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  /* ── Delete ─────────────────────────────────────────────────────────── */
  const handleDelete = async id => {
    if (!window.confirm('Delete this testimonial?')) return
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE}/api/testimonial/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Testimonial deleted')
      fetchTestimonials()
    } catch {
      toast.error('Failed to delete testimonial')
    }
  }

  /* ── Submit ─────────────────────────────────────────────────────────── */
  const handleSubmit = async e => {
    e.preventDefault()
    if (!videoFile || !imageFile) {
      toast.error('Video and Client Image are required')
      return
    }

    setLoading(true)
    try {
      // 1. Compress + upload video
      setStatusMsg('Compressing & uploading video…')
      const videoResult = await compressAndUpload(
        videoFile,
        { ...cloudinaryConfig, folder: 'testimonials/videos' },
        {},                           // imageOptions (not used for video)
        { maxWidth: 1280 },           // videoOptions
        pct => setVideoProgress(pct)  // progress
      )

      // 2. Compress + upload image
      setStatusMsg('Compressing & uploading image…')
      const imageResult = await compressAndUpload(
        imageFile,
        { ...cloudinaryConfig, folder: 'testimonials/images' },
        { maxWidthOrHeight: 1280, quality: 0.75, outputFormat: 'image/jpeg' },
        {},
        pct => setImageProgress(pct)
      )

      // 3. Save to backend
      setStatusMsg('Saving testimonial…')
      const token = localStorage.getItem('adminToken')
      await axios.post(
        `${API_BASE}/api/testimonial/create`,
        {
          ...formData,
          video:       { url: videoResult.secure_url, public_id: videoResult.public_id },
          clientImage: { url: imageResult.secure_url, public_id: imageResult.public_id },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Testimonial created successfully!')
      setFormData(INITIAL_FORM)
      removeVideo(); removeImage()
      fetchTestimonials()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create testimonial'
      toast.error(msg)
      console.error('Testimonial create error:', err)
    } finally {
      setLoading(false); setStatusMsg('')
      setVideoProgress(0); setImageProgress(0)
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 5 }}>
      <Container maxWidth="md">
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Box bgcolor="primary.main" p={3} color="white">
            <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
              <VideoCameraBackIcon /> Create New Testimonial
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Upload client reviews, videos, and details.
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>

                {/* Media */}
                <Grid size={12}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2}>
                    MEDIA ASSETS
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <UploadBox
                        type="video" label="Upload Testimonial Video"
                        icon={<VideoCameraBackIcon fontSize="large" color="primary" />}
                        accept="video/*" preview={previewVideo} progress={videoProgress}
                        onFileChange={handleVideoChange} onRemove={removeVideo}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <UploadBox
                        type="image" label="Upload Client Photo"
                        icon={<CloudUploadIcon fontSize="large" color="secondary" />}
                        accept="image/*" preview={previewImage} progress={imageProgress}
                        onFileChange={handleImageChange} onRemove={removeImage}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={12}><Divider /></Grid>

                {/* Client & Brand */}
                <Grid size={12}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2}>
                    CLIENT &amp; BRAND DETAILS
                  </Typography>
                  <Grid container spacing={3}>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Client Name" name="clientName"
                        value={formData.clientName} onChange={handleField}
                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Profession / Designation" name="position"
                        value={formData.position} onChange={handleField}
                        InputProps={{ startAdornment: <InputAdornment position="start"><WorkIcon color="action" /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="Birth Date" name="birthDate" type="date"
                        value={formData.birthDate} onChange={handleField}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon color="action" /></InputAdornment> }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {brands.length > 0 ? (
                        <TextField select fullWidth label="Select Brand"
                          value={formData.brandName} onChange={handleBrandSelect}
                          InputProps={{ startAdornment: <InputAdornment position="start"><BrandingWatermarkIcon color="action" /></InputAdornment> }}
                        >
                          <MenuItem value=""><em>-- Select Brand --</em></MenuItem>
                          {brands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                        </TextField>
                      ) : (
                        <TextField fullWidth label="Brand Name" name="brandName"
                          value={formData.brandName} placeholder="Type brand name manually"
                          onChange={e => {
                            const name = e.target.value
                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                            setFormData(prev => ({ ...prev, brandName: name, brandId: slug }))
                          }}
                          InputProps={{ startAdornment: <InputAdornment position="start"><BrandingWatermarkIcon color="action" /></InputAdornment> }}
                        />
                      )}
                    </Grid>

                  </Grid>
                </Grid>

                {/* Description */}
                <Grid size={12}>
                  <TextField fullWidth label="Testimonial Description" name="description"
                    multiline rows={4} value={formData.description} onChange={handleField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <DescriptionIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Status message */}
                {statusMsg && (
                  <Grid size={12}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">{statusMsg}</Typography>
                    </Box>
                  </Grid>
                )}

                {/* Submit */}
                <Grid size={12} display="flex" justifyContent="flex-end">
                  <Button
                    type="submit" variant="contained" size="large" disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    sx={{ px: 5, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                  >
                    {loading ? 'Creating…' : 'Publish Testimonial'}
                  </Button>
                </Grid>

              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* Testimonials list */}
        <Box mt={6}>
          <Typography variant="h6" fontWeight={700} mb={2}>Testimonials List</Typography>

          {listLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">Loading testimonials…</Typography>
            </Box>
          ) : testimonials.length === 0 ? (
            <Typography color="text.secondary">No testimonials found</Typography>
          ) : (
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        {['Video','Client','Position','Brand','Description','Actions'].map(h => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testimonials.map(item => (
                        <tr key={item._id} style={{ borderTop: '1px solid #eee' }}>
                          <td style={td}>
                            <video src={item.videoUrl} muted
                              style={{ width: 80, height: 55, borderRadius: 6, objectFit: 'cover' }} />
                          </td>
                          <td style={td}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar src={item.clientImage} sx={{ width: 32, height: 32 }} />
                              <Typography fontSize={13}>{item.clientName}</Typography>
                            </Box>
                          </td>
                          <td style={td}><Typography fontSize={13}>{item.position}</Typography></td>
                          <td style={td}><Typography fontSize={13} color="primary">{item.brandName}</Typography></td>
                          <td style={td}>
                            <Typography fontSize={13} noWrap sx={{ maxWidth: 220 }}>{item.description}</Typography>
                          </td>
                          <td style={td}>
                            <Button size="small" variant="contained" color="error"
                              onClick={() => handleDelete(item._id)}>
                              <DeleteIcon />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  )
}