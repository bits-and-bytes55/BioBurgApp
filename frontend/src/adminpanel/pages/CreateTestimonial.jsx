import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Container,
  IconButton,
  Avatar,
  Paper,
  InputAdornment,
  Divider,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import CloudUploadIcon        from '@mui/icons-material/CloudUpload'
import DeleteIcon             from '@mui/icons-material/Delete'
import SendIcon               from '@mui/icons-material/Send'
import VideoCameraBackIcon    from '@mui/icons-material/VideoCameraBack'
import PersonIcon             from '@mui/icons-material/Person'
import WorkIcon               from '@mui/icons-material/Work'
import BrandingWatermarkIcon  from '@mui/icons-material/BrandingWatermark'
import DescriptionIcon        from '@mui/icons-material/Description'
import CalendarTodayIcon      from '@mui/icons-material/CalendarToday'
import { compressVideo, compressImage } from '../../../utils/mediaCompressor'

const API_BASE      = import.meta.env.VITE_API_URL || 'http://https://bioburglifescience-1.onrender.com'
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const INITIAL_FORM = {
  description: '',
  clientName:  '',
  position:    '',
  birthDate:   '',
  brandId:     '',
  brandName:   '',
}

const th = { textAlign: 'left', padding: '12px', fontSize: '13px', fontWeight: 600 }
const td = { padding: '12px',   fontSize: '13px' }

/*  UploadBox  */
function UploadBox({ label, icon, preview, onFileChange, onRemove, accept, type }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        textAlign: 'center',
        borderStyle: 'dashed',
        borderColor: preview ? 'primary.main' : 'grey.400',
        bgcolor:     preview ? 'primary.50'   : 'grey.50',
        cursor:      'pointer',
        position:    'relative',
        transition:  '0.3s',
        '&:hover':   { borderColor: 'primary.main', bgcolor: 'grey.100' },
        minHeight:   180,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
      }}
    >
      {preview ? (
        <Box position="relative" width="100%" height="100%">
          {type === 'video' ? (
            <video src={preview} controls style={{ width: '100%', borderRadius: 8 }} />
          ) : (
            <Avatar src={preview} variant="rounded" sx={{ width: 120, height: 120, mx: 'auto' }} />
          )}
          <IconButton
            size="small"
            color="error"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onRemove() }}
            sx={{
              position: 'absolute', top: -10, right: -10,
              bgcolor: 'white', boxShadow: 1,
              '&:hover': { bgcolor: '#ffebee' },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box
          component="label"
          sx={{ width: '100%', height: '100%', cursor: 'pointer', textAlign: 'center' }}
        >
          {icon}
          <Typography variant="body2" fontWeight={600} mt={1}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">Click to browse</Typography>
          <input type="file" accept={accept} hidden onChange={onFileChange} />
        </Box>
      )}
    </Paper>
  )
}

/* ── Cloudinary helpers  */
async function uploadVideoToCloudinary(file) {
  const compressed = await compressVideo(file, { videoBitsPerSecond: 1_000_000 })
  const fd = new FormData()
  fd.append('file', compressed)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'testimonials/videos')
  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, fd
  )
  return { url: data.secure_url, public_id: data.public_id }
}

async function uploadImageToCloudinary(file) {
  const compressed = await compressImage(file, {
    maxWidthOrHeight: 1280,
    quality: 0.75,
    outputFormat: 'image/jpeg',
  })
  const fd = new FormData()
  fd.append('file', compressed)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'testimonials/images')
  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, fd
  )
  return { url: data.secure_url, public_id: data.public_id }
}

/* ── Main component  */
export default function CreateTestimonial() {
  const [loading,      setLoading]      = useState(false)
  const [brands,       setBrands]       = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [listLoading,  setListLoading]  = useState(false)
  const [formData,     setFormData]     = useState(INITIAL_FORM)
  const [videoFile,    setVideoFile]    = useState(null)
  const [imageFile,    setImageFile]    = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  // Prevent double fetch/toast in React StrictMode
  const brandFetchedRef = useRef(false)

  /* ── Load brands ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (brandFetchedRef.current) return
    brandFetchedRef.current = true

    const token = localStorage.getItem('adminToken')
    axios
      .get(`${API_BASE}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const productList = res.data?.products || res.data || []
        const unique = [...new Set(productList.map(p => p.brandName).filter(Boolean))]
        setBrands(unique)
      })
      .catch(() => {
        // Fixed id prevents duplicate toast in StrictMode
        toast.error('Could not load brand list — type a brand name manually', {
          id: 'brand-load-err',
        })
      })
  }, [])

  /* ── Fetch testimonials ──────────────────────────────────────────────── */
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

  /* ── File handlers ───────────────────────────────────────────────────── */
  const handleVideoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setPreviewVideo(URL.createObjectURL(file))
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewImage(URL.createObjectURL(file))
  }

  const removeVideo = () => { setVideoFile(null); setPreviewVideo(null) }
  const removeImage = () => { setImageFile(null); setPreviewImage(null) }

  /* ── Brand select ────────────────────────────────────────────────────── */
  const handleBrandSelect = e => {
    const name = e.target.value
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    setFormData(prev => ({ ...prev, brandName: name, brandId: slug }))
  }

  /* ── Generic field ───────────────────────────────────────────────────── */
  const handleField = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  /* ── Delete ──────────────────────────────────────────────────────────── */
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

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleSubmit = async e => {
    e.preventDefault()
    if (!videoFile || !imageFile) {
      toast.error('Video and Client Image are required')
      return
    }
    setLoading(true)
    try {
      const [uploadedVideo, uploadedImage] = await Promise.all([
        uploadVideoToCloudinary(videoFile),
        uploadImageToCloudinary(imageFile),
      ])
      await axios.post(`${API_BASE}/api/testimonial/create`, {
        ...formData,
        video:       uploadedVideo,
        clientImage: uploadedImage,
      })
      toast.success('Testimonial created successfully!')
      setFormData(INITIAL_FORM)
      removeVideo()
      removeImage()
      fetchTestimonials()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create testimonial')
    } finally {
      setLoading(false)
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
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
              {/* MUI v6 Grid v2: use size prop, drop item / xs / sm / md */}
              <Grid container spacing={4}>

                {/* Media */}
                <Grid size={12}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={2}>
                    MEDIA ASSETS
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <UploadBox
                        type="video"
                        label="Upload Testimonial Video"
                        icon={<VideoCameraBackIcon fontSize="large" color="primary" />}
                        accept="video/*"
                        preview={previewVideo}
                        onFileChange={handleVideoChange}
                        onRemove={removeVideo}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <UploadBox
                        type="image"
                        label="Upload Client Photo"
                        icon={<CloudUploadIcon fontSize="large" color="secondary" />}
                        accept="image/*"
                        preview={previewImage}
                        onFileChange={handleImageChange}
                        onRemove={removeImage}
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
                      <TextField
                        fullWidth
                        label="Client Name"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleField}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Profession / Designation"
                        name="position"
                        value={formData.position}
                        onChange={handleField}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><WorkIcon color="action" /></InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Birth Date"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleField}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start"><CalendarTodayIcon color="action" /></InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {brands.length > 0 ? (
                        <TextField
                          select
                          fullWidth
                          label="Select Brand"
                          value={formData.brandName}
                          onChange={handleBrandSelect}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"><BrandingWatermarkIcon color="action" /></InputAdornment>
                            ),
                          }}
                        >
                          <MenuItem value=""><em>-- Select Brand --</em></MenuItem>
                          {brands.map(b => (
                            <MenuItem key={b} value={b}>{b}</MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <TextField
                          fullWidth
                          label="Brand Name"
                          name="brandName"
                          value={formData.brandName}
                          onChange={e => {
                            const name = e.target.value
                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                            setFormData(prev => ({ ...prev, brandName: name, brandId: slug }))
                          }}
                          placeholder="Type brand name manually"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"><BrandingWatermarkIcon color="action" /></InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Grid>

                  </Grid>
                </Grid>

                {/* Description */}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Testimonial Description"
                    name="description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <DescriptionIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Submit */}
                <Grid size={12} display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={
                      loading
                        ? <CircularProgress size={20} color="inherit" />
                        : <SendIcon />
                    }
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
          <Typography variant="h6" fontWeight={700} mb={2}>
            Testimonials List
          </Typography>

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
                        <th style={th}>Video</th>
                        <th style={th}>Client</th>
                        <th style={th}>Position</th>
                        <th style={th}>Brand</th>
                        <th style={th}>Description</th>
                        <th style={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testimonials.map(item => (
                        <tr key={item._id} style={{ borderTop: '1px solid #eee' }}>
                          <td style={td}>
                            <video
                              src={item.videoUrl}
                              muted
                              style={{ width: 80, height: 55, borderRadius: 6, objectFit: 'cover' }}
                            />
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
                            <Typography fontSize={13} noWrap sx={{ maxWidth: 220 }}>
                              {item.description}
                            </Typography>
                          </td>
                          <td style={td}>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleDelete(item._id)}
                            >
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