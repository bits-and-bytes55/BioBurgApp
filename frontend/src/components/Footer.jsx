//Footer.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  IconButton
} from '@mui/material'
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Send,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import FooterBioburgLogos from '../pages/FooterBioburgLogos'
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const BASE_API = API_BASE_URL;

const Footer = () => {

  const [policies, setPolicies] = useState([]);
  const [aboutOpen, setAboutOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
  axios
    .get(`${BASE_API}/api/admin/policies`)
    .then((res) => {
      if (res.data?.policies) {
        const activePolicies = res.data.policies.filter(
          (p) => p.isActive
        );
        setPolicies(activePolicies);
      }
    })
    .catch((err) => {
      console.log("Error fetching policies:", err);
    });
}, []);

  const payments = [
    { name: 'Visa',       src: '/paymentslogos/Visa_Inc._logo.svg' },
    { name: 'Paytm',      src: '/paymentslogos/paytmlogo.svg' },
    { name: 'Mastercard', src: '/paymentslogos/mastercardlogo.svg' },
    { name: 'UPI',        src: '/paymentslogos/UPI-Logo-vector.svg' }
  ]

  return (
    <Box sx={{ width: '100%', bgcolor: '#0F172A', color: 'grey.300', pt: { xs: 6, md: 8 }, pb: 2 }}>

      {/* ── TOP STRIP: Newsletter + Map ── */}
      <Box sx={{ maxWidth: '1280px', mx: 'auto', px: { xs: 2, sm: 4, md: 5 } }}>
        <Box
          sx={{
            bgcolor: '#1E293B',
            borderRadius: 3,
            p: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 4 },
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}
        >
          {/* Newsletter */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant='h5'
              sx={{ fontWeight: 700, color: 'white', mb: 1, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
            >
              Join Our Community
            </Typography>
            <Typography sx={{ mb: 3, color: 'grey.400', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
              Subscribe to get updates on medicines, offers, and health tips.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                variant='filled'
                placeholder='Enter your email'
                size='small'
                sx={{
                  flex: 1,
                  '& .MuiFilledInput-root': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                    '&::before, &::after': { display: 'none' }
                  },
                  '& input::placeholder': { color: 'grey.500' }
                }}
                InputProps={{ disableUnderline: true }}
              />
              <Button
                variant='contained'
                endIcon={<Send sx={{ fontSize: 16 }} />}
                sx={{
                  bgcolor: '#22C55E',
                  '&:hover': { bgcolor: '#16A34A' },
                  borderRadius: 2,
                  px: { xs: 3, sm: 3 },
                  py: 1,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  fontSize: { xs: '0.85rem', sm: '0.9rem' }
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Box>

          {/* Map */}
          <Box sx={{ flex: 1, minWidth: 0, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 2 }}>
            <Typography sx={{ fontWeight: 600, color: 'white', mb: 1.5, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              Our Location
            </Typography>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', height: { xs: 140, sm: 160 }, width: '100%' }}>
              <iframe
                src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7004.361672658038!2d77.02774827770995!3d28.624341799999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d053edc3c5c2b%3A0x5dd974efb493e728!2sBioburg%20LifeScience%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1764528816741!5m2!1sen!2sin'
                style={{ border: 0, width: '100%', height: '100%' }}
                allowFullScreen
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── MAIN FOOTER COLUMNS ── */}
      <Box sx={{ maxWidth: '1280px', mx: 'auto', px: { xs: 2, sm: 4, md: 5 }, mt: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',          // 2 cols on mobile
              sm: '1fr 1fr 1fr',      // 3 cols on small tablet
              md: '1fr 1fr 1fr',      // 3 cols on tablet
              lg: 'repeat(5, 1fr)'    // 5 cols on desktop
            },
            gap: { xs: 4, sm: 5, md: 6 }
          }}
        >
          {/* ── Company ── */}
          <Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'white', mb: 2 }}>
              Company
            </Typography>

            <FooterLink>Home</FooterLink>

            {/* About Us accordion */}
            <Box>
              <Box
                onClick={() => setAboutOpen(!aboutOpen)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', mb: 1,
                  '&:hover .footer-link-text': { color: 'white' }
                }}
              >
                <Typography className='footer-link-text' sx={{ fontSize: '0.82rem', color: 'grey.400', transition: 'color 0.2s' }}>
                  About Us
                </Typography>
                {aboutOpen
                  ? <ExpandLess sx={{ fontSize: 14, color: 'grey.500' }} />
                  : <ExpandMore sx={{ fontSize: 14, color: 'grey.500' }} />
                }
              </Box>
              {aboutOpen && (
                <Box sx={{ ml: 1.5, mb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {[
              {label: 'Overview' , path: '/' },
              {label: 'Vision & Mission' , path: '/' },
              {label: 'Company Policy' , path: '/' },
              {label: 'Company Managements' , path: '/' },
              {label: 'Business Operation' , path: '/' },
              {label: 'Research & Innovation' , path: '/' },
              {label: 'Certification' , path: '/' },
              {label: 'Honors & Awards' , path: '/' },
              {label: 'News & Media' , path: '/' },
              {label: "Our API's" , path: '/' },
            
               ].map((sub, i) => (
                    <Typography key={i} sx={{ fontSize: '0.78rem', color: 'grey.500', cursor: 'pointer', '&:hover': { color: 'white' }, transition: 'color 0.2s' }}>
                      {sub.label}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>

            {/* Gallery accordion */}
            <Box>
              <Box
                onClick={() => setGalleryOpen(!galleryOpen)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', mb: 1,
                  '&:hover .footer-link-text2': { color: 'white' }
                }}
              >
                <Typography className='footer-link-text2' sx={{ fontSize: '0.82rem', color: 'grey.400', transition: 'color 0.2s' }}>
                  Our Gallery
                </Typography>
                {galleryOpen
                  ? <ExpandLess sx={{ fontSize: 14, color: 'grey.500' }} />
                  : <ExpandMore sx={{ fontSize: 14, color: 'grey.500' }} />
                }
              </Box>
              {galleryOpen && (
                <Box sx={{ ml: 1.5, mb: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {[
              {label: 'Manufacturing Plants' , path: '/' },
              {label: 'Social Activity' , path: '/' },
              {label: 'Old and Orphan Child Home' , path: '/' },
            ].map((sub, i) => (
                    <Typography key={i} sx={{ fontSize: '0.78rem', color: 'grey.500', cursor: 'pointer', '&:hover': { color: 'white' }, transition: 'color 0.2s' }}>
                      {sub.label}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
            {[
              {label: 'Business Investors' , path: '/' },
              {label: 'Bioburg Partners' , path: '/' },
              {label: 'Manufacturing Section' , path: '/' },
              {label: 'Import & Export' , path: '/' },
              {label: 'Jobs & Careers' , path: '/register/jobs-careers' },
              {label: 'Jobs Ex-Servicemen' , path: '/register/exservice' },
              {label: 'Our Presence' , path: '/' },
              {label: 'Corporate Governance' , path: '/' },
              {label: 'Donations' , path: '/' },
              ].map((item, i) => (
              <FooterLink key={i} path= {item.path} > {item.label}</FooterLink>
            ))}
          </Box>

          {/* ── Our Services ── */}
          <FooterColumn
            title='Our Services'
            items={[
              {label: 'Bioburg Franchise'     , path: '/franchise-application' },
              {label: 'Lab & Radiology Tests' , path: '/register/radiology-diagnostics' },
              {label: 'Online Doctor Consultation' , path: '/register/doctor' },
              {label: 'Direct Connect (D2C)' , path: '/userregister' },
              {label: 'Business To Business' , path: '/' },
              {label: 'Direct Manufacturing' , path: '/' },
              {label: 'Pharmacy Supplies' , path: '/' },
              {label: 'Vendors Sell With Us' , path: '/login/vendor' },
              {label: 'Patent Brands Registered With Us' , path: '/' },
              {label: 'Health Insurances' , path: '/' },
              {label: 'Exports & Imports' , path: '/' },
              {label: 'Vendor Registration' , path: '/register/vendor' },
              {label: 'Patent Pharma Brands' , path: '/register/pharma-manufacturer' },
            ]}
          />

          {/* ── Policies ── */}
          <FooterColumn
  title="Policies"
  items={policies.map((p) => ({
    label: p.title,
    path: p.route,
  }))}
/>

          {/* ── Featured Categories ── */}
          <FooterColumn
            title='Featured Categories'
            items={[
              {label: 'Generic Medicine' , path: '/' },
              {label: 'Patent Medicine' , path: '/' },
              {label: 'Ethical Medicine' , path: '/' },
              {label: 'Bioburg Medicine' , path: '/' },
              {label: 'Health Concerns Medicine' , path: '/' },
              {label: 'Top Pharma Brands' , path: '/' },
              {label: 'Popular Homeopath Brands' , path: '/' },
              {label: 'Most Common Ayurvedic' , path: '/' },
              {label: 'Featured Brands' , path: '/' },
              {label: 'Popular Combo Deals' , path: '/' },
              {label: 'New Arrival Products' , path: '/' },
              {label: 'Near Expiry With Exclusive Offer' , path: '/' },
              {label: 'Best Health Insurance Plans' , path: '/' },
            ]}
          />

          {/* ── Need Help ── */}
          <FooterColumn
            title='Need Help?'
            items={[
              {label: 'FAQs' , path: '/' },
              {label: 'Enquiry & Contact Us' , path: '/' },
              {label: 'Product Videos' , path: '/' },
              {label: 'Top Selling Products' , path: '/' },
              {label: 'Health Articles' , path: '/' },
            ]}
          />
        </Box>

        {/* Brand logos */}
        <FooterBioburgLogos />

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* ── Social + Payments ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 3
          }}
        >
          {/* Social */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[Facebook, Twitter, Instagram, LinkedIn].map((Icon, i) => (
              <IconButton
                key={i}
                size='small'
                sx={{
                  color: 'grey.400',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 2,
                  '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.3)' },
                  transition: 'all 0.2s'
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </IconButton>
            ))}
          </Box>

          {/* Payment logos */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            {payments.map((item, i) => (
              <Box
                key={i}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 64,
                  height: 36
                }}
              >
                <img src={item.src} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom copyright */}
        <Box
          sx={{
            bgcolor: '#1E293B',
            borderRadius: 2,
            textAlign: 'center',
            py: 2.5,
            px: 2,
            color: 'grey.300',
            mt: 4,
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          © {new Date().getFullYear()} Bioburg Lifescience Pvt. Ltd. — All Rights Reserved.
        </Box>

        <Typography
          sx={{
            textAlign: 'center',
            color: 'grey.600',
            mt: 2,
            mb: 1,
            fontSize: '0.78rem'
          }}
        >
          Designed & Developed By{' '}
          <Box
            component='a'
            href='https://bitsandbytesitsolution.com'
            sx={{ color: '#4ADE80', '&:hover': { color: 'white' }, textDecoration: 'none' }}
          >
            Bits and Bytes IT Solution
          </Box>
        </Typography>
      </Box>
    </Box>
  )
}

/* ── Helpers ── */
const FooterLink = ({ children, path }) => {
  const navigate = useNavigate();

  return (
    <Typography
      onClick={() => path && navigate(path)}
      sx={{
        fontSize: '0.82rem',
        color: 'grey.400',
        mb: 1,
        cursor: 'pointer',
        '&:hover': { color: 'white' },
        transition: 'color 0.2s',
        lineHeight: 1.5
      }}
    >
      {children}
    </Typography>
  );
};

const FooterColumn = ({ title, items }) => {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'white', mb: 2 }}>
        {title}
      </Typography>

      {items.map((item, i) => (
        <FooterLink key={i} path={item.path}>
          {item.label}
        </FooterLink>
      ))}
    </Box>
  );
};

export default Footer
