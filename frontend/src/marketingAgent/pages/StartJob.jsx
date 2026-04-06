import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { TextField, Button, MenuItem, Paper, Typography } from '@mui/material'

import { uploadToCloudinary } from '../../../utils/uploadToCloudinary.js'

/* ===============================
   DISTANCE CALCULATION (KM)
================================ */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = v => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function StartJob () {
  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      state: '',
      district: '',
      area: '',
      address: '',
      startKmNumber: 0,
      closeKmNumber: 0
    }
  })
  const [startKmPhoto, setStartKmPhoto] = useState(null)
  const [closeKmPhoto, setCloseKmPhoto] = useState(null)
  const [hospitalImage, setHospitalImage] = useState(null)

  const watchIdRef = useRef(null)
  const lastPosRef = useRef(null)

  const [jobRunning, setJobRunning] = useState(false)
  const [totalDistance, setTotalDistance] = useState(0)

  const token = localStorage.getItem('agentToken') 
  console.log('AGENT TOKEN 👉', token)
  const api = axios.create({
    // baseURL: 'https://bioburglifescience-1.onrender.com/api/agent', 
    baseURL: 'https://bioburglifescience-1.onrender.com/api/agent',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  /* ===============================
     FETCH LOCATION (ADDRESS)
  =============================== */
  const fetchLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude, accuracy } = pos.coords
        lastPosRef.current = { lat: latitude, lng: longitude }

        setValue('latitude', latitude)
        setValue('longitude', longitude)
        setValue('locationAccuracy', accuracy)

        const res = await axios.get(
          'https://nominatim.openstreetmap.org/reverse',
          { params: { lat: latitude, lon: longitude, format: 'json' } }
        )

        const a = res.data.address || {}
        setValue('state', a.state || '')
        setValue('district', a.county || a.state_district || '')
        setValue('area', a.suburb || a.village || a.town || '')
        setValue('address', res.data.display_name || '')
      },
      () => toast.error('Location permission denied'),
      { enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    fetchLocation()

    const resumeJob = async () => {
      try {
        const res = await api.get('/job/status')
        if (res.data.isOnJob) {
          setJobRunning(true)
          setTotalDistance(res.data.currentJob?.totalDistanceKm || 0)
          toast.info('🔄 Job resumed')
        }
      } catch {}
    }

    resumeJob()
  }, [])

  /* ===============================
     START JOB (API)
  =============================== */
  const startJob = async () => {
    if (jobRunning) return

    try {
      let startImg = null

      if (startKmPhoto) {
        startImg = await uploadToCloudinary(startKmPhoto)
      }
      await api.post('/job/start', {
        latitude: lastPosRef.current?.lat,
        longitude: lastPosRef.current?.lng,
        locationAccuracy: 0,
        state: '',
        district: '',
        area: '',
        address: '',
        startKm: 0,
        startKmPhoto: startImg
      })

      setJobRunning(true)
      setTotalDistance(0)
      setValue('startKmNumber', 0)
      lastPosRef.current = null

      watchIdRef.current = navigator.geolocation.watchPosition(
        async pos => {
          const { latitude, longitude, accuracy, speed } = pos.coords

          if (lastPosRef.current) {
            const d = getDistanceKm(
              lastPosRef.current.lat,
              lastPosRef.current.lng,
              latitude,
              longitude
            )

            setTotalDistance(prev => prev + d)

            await api.post('/job/location', {
              latitude,
              longitude,
              accuracy,
              speed,
              distanceJumpKm: d
            })
          }

          lastPosRef.current = { lat: latitude, lng: longitude }
        },
        () => toast.error('Tracking error'),
        { enableHighAccuracy: true }
      )

      toast.success('🚀 Job Started')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Job start failed')
      console.error('START JOB ERROR 👉', err)
    }
  }

  /* ===============================
     CLOSE JOB (API)
  =============================== */
  const closeJob = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    try {
      let closeImg = null

      if (closeKmPhoto) {
        closeImg = await uploadToCloudinary(closeKmPhoto)
      }
      setValue('closeKmNumber', totalDistance.toFixed(2))

      await api.post('/job/close', {
        closeKm: totalDistance.toFixed(2),
        totalDistanceKm: totalDistance.toFixed(2),
        closeKmPhoto: closeImg
      })

      setJobRunning(false)
      toast.success('✅ Job Closed & Saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Close job failed')
    }
  }

  /* ===============================
     NEXT JOB
  =============================== */
  const nextJob = async () => {
    if (jobRunning) {
      await closeJob()
    }
    reset()
    setTotalDistance(0)
    lastPosRef.current = null
    toast.info('➡️ Next Job Ready')
  }

  /* ===============================
     SUBMIT (FINAL SAVE)
  =============================== */
  const onSubmit = async data => {
    try {
      if (!hospitalImage) {
        toast.error('Hospital image required')
        return
      }

      // 1️⃣ Upload image
      const hospitalImg = await uploadToCloudinary(hospitalImage)

      // 2️⃣ Payload EXACTLY as model
      const payload = {
        dutyDate: data.dutyDate,
        dutyTime: data.dutyTime,

        state: data.state,
        district: data.district,
        area: data.area,
        address: data.address,

        partner: data.partner,
        hospitalName: data.hospitalName,
        doctorName: data.doctorName,
        degree: data.degree,

        mobile: data.mobile,
        whatsapp: data.whatsapp,

        // 🔥 MOST IMPORTANT
        hospitalImage: {
          url: hospitalImg.secure_url,
          public_id: hospitalImg.public_id
        }
      }

      await api.post('/job/save', payload)

      toast.success('📦 Job details saved successfully');
          reset({
        dutyDate: data.dutyDate,
        dutyTime: data.dutyTime,

        state: data.state,
        district: data.district,
        area: data.area,
        address: data.address,

        partner: data.partner,
        hospitalName: data.hospitalName,
        doctorName: data.doctorName,
        degree: data.degree,

        mobile: data.mobile,
        whatsapp: data.whatsapp,

        hospitalImage: {
          url: hospitalImg.secure_url,
          public_id: hospitalImg.public_id
        },
      startKmNumber: jobRunning ? data.startKmNumber : 0,
      closeKmNumber: jobRunning ? data.closeKmNumber : 0
    });

       // 🔹 optional: scroll top
    window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error('FINAL SAVE ERROR', err)
      toast.error(err.response?.data?.message || 'Final save failed')
    }
  }

  return (
    <Paper className='p-6 md:p-8 max-w-6xl mx-auto'>
      {/* ===== JOB STATUS + DISTANCE ===== */}
      <Typography
        className={`mb-4 text-center font-bold ${
          jobRunning ? 'animate-pulse text-green-600' : 'text-gray-500'
        }`}
      >
        {jobRunning
          ? `JOB RUNNING | Distance: ${totalDistance.toFixed(2)} KM`
          : 'JOB NOT STARTED'}
      </Typography>

      <Typography variant='h6' className='mb-2 font-bold'>
        Daily Working Action Plan
      </Typography>

      <Typography variant='caption' color='text.secondary'>
        Location auto-filled using GPS. You can edit if incorrect.
      </Typography>

      <div className='mt-3 flex gap-2'>
        <Button size='small' variant='outlined' onClick={fetchLocation}>
          🔄 Re-Fetch Location
        </Button>
        {!jobRunning && (
          <Button size='small' variant='contained' onClick={startJob}>
            ▶ Start Job
          </Button>
        )}
        {jobRunning && (
          <Button
            size='small'
            color='error'
            variant='contained'
            onClick={closeJob}
          >
            ⏹ Close Job
          </Button>
        )}
        <Button size='small' variant='outlined' onClick={nextJob}>
          ➕ Next Job
        </Button>
      </div>

      {/* ===== FORM (UNCHANGED) ===== */}
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 mt-6'>
        {/* ===== START KM ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            type='file'
            label='Start KM Photo'
            fullWidth
            InputLabelProps={{ shrink: true }}
            onChange={e => setStartKmPhoto(e.target.files[0])}
          />
          <TextField
            label='Start KM in Number'
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            {...register('startKmNumber')}
          />
        </div>

        {/* ===== DATE / TIME ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            type='date'
            label='Duty Date'
            InputLabelProps={{ shrink: true }}
            fullWidth
            {...register('dutyDate')}
          />
          <TextField
            type='time'
            label='Duty Time'
            InputLabelProps={{ shrink: true }}
            fullWidth
            {...register('dutyTime')}
          />
        </div>

        {/* ===== STATE ===== */}
        <div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
          <TextField
            label='State'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('state')}
          />
        </div>

        {/* ===== DISTRICT / AREA ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            label='District'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('district')}
          />
          <TextField
            label='Area / Block'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('area')}
          />
        </div>

        {/* ===== PARTNER ===== */}
        <div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
          <TextField
            select
            label='Customer Partner'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('partner')}
          >
            <MenuItem value='Doctor'>Doctor</MenuItem>
            <MenuItem value='Hospital'>Hospital</MenuItem>
            <MenuItem value='Medical'>Medical Store</MenuItem>
          </TextField>
        </div>

        {/* ===== HOSPITAL ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            type='file'
            label='Hospital Image'
            fullWidth
            InputLabelProps={{ shrink: true }}
            onChange={e => setHospitalImage(e.target.files[0])}
          />
          <TextField
            label='Hospital / Medical Store Name'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('hospitalName')}
          />
        </div>

        {/* ===== DOCTOR ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            label='Doctor / Proprietor Name'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('doctorName')}
          />
          <TextField
            select
            label='Doctor Degree'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('degree')}
          >
            <MenuItem value='MBBS'>MBBS</MenuItem>
            <MenuItem value='MD'>MD</MenuItem>
            <MenuItem value='BAMS'>BAMS</MenuItem>
          </TextField>
        </div>

        {/* ===== ADDRESS ===== */}
        <div className='grid grid-cols-1 md:grid-cols-1 gap-6'>
          <TextField
            label='Full Address'
            multiline
            rows={2}
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('address')}
          />
        </div>

        {/* ===== CONTACT ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            label='Mobile No'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('mobile')}
          />
          <TextField
            label='WhatsApp / Alternate No'
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register('whatsapp')}
          />
        </div>

        {/* ===== CLOSE KM ===== */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <TextField
            type='file'
            label='Close KM Photo'
            fullWidth
            InputLabelProps={{ shrink: true }}
            onChange={e => setCloseKmPhoto(e.target.files[0])}
          />
          <TextField
            label='Close KM in Number'
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            {...register('closeKmNumber')}
          />
        </div>

        {/* ===== HIDDEN LOCATION ===== */}
        <input type='hidden' {...register('latitude')} />
        <input type='hidden' {...register('longitude')} />
        <input type='hidden' {...register('locationAccuracy')} />

        {/* ===== ACTIONS ===== */}
        <div className='flex justify-end gap-4 pt-4'>
          <Button variant='outlined'>Close</Button>
          <Button type='submit' variant='contained'>
            Submit
          </Button>
        </div>
      </form>
    </Paper>
  )
}
