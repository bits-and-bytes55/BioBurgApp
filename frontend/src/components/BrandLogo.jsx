import LogoLoop from './LogoLoop.jsx';
// import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss } from 'react-icons/si';


// Alternative with image sources
const imageLogos = [
  { src: 'brandlogo/autar.webp', alt: 'Company 1', href: '#' },
  { src: 'brandlogo/backshown.webp', alt: 'Company 2', href: '#' },
  { src: 'brandlogo/benshim.webp', alt: 'Company 3', href: '#' },
  { src: 'brandlogo/bjain.webp', alt: 'Company 4', href: '#' },
  { src: 'brandlogo/boldcare.webp', alt: 'Company 5', href: '#' },
  { src: 'brandlogo/dhyashar.webp', alt: 'Company 6', href: '#' },
  { src: 'brandlogo/doctors.webp', alt: 'Company 7', href: '#' },
  { src: 'brandlogo/hamdrd.webp', alt: 'Company 8', href: '#' },
  { src: 'brandlogo/hapdco.webp', alt: 'Company 9', href: '#' },
  { src: 'brandlogo/letshave.webp', alt: 'Company 10', href: '#' },
  { src: 'brandlogo/maharishi.webp', alt: 'Company 11', href: '#' },
  { src: 'brandlogo/medisynth.webp', alt: 'Company 12', href: '#' },
  { src: 'brandlogo/planet.webp', alt: 'Company 13', href: '#' },
  { src: 'brandlogo/powershell.webp', alt: 'Company 14', href: '#'},
  { src: 'brandlogo/sbl.webp', alt: 'Company 15', href: '#' },
  { src: 'brandlogo/schwave.webp', alt: 'Company 16', href: '#' },
  { src: 'brandlogo/shama.webp', alt: 'Company 17', href: '#' },
  { src: 'brandlogo/vansar.webp', alt: 'Company 18', href: '#' }
]

export default function BrandLogo () {
  return (
    <>
      <div className='w-full py-5'>
        <div className='max-w-7xl mx-auto '>
          <h2 className='text-2xl font-bold'>Top Pharma Brands | Save  Up to 75% off</h2>
          <div
            style={{
              height: '200px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'left',
              alignItems: 'left'
            }}
          >
            {/* Basic horizontal loop */}
            <LogoLoop
              logos={imageLogos}
              speed={120}
              direction='left'
              logoHeight={120}
              gap={40}
              hoverSpeed={0}
              scaleOnHover
              fadeOut
              fadeOutColor='#ffffff'
              ariaLabel='Technology partners'
            />
 {/* Vertical loop with deceleration on hover */}
      {/* <LogoLoop
        logos={imageLogos}
        speed={80}
        direction="up"
        logoHeight={48}
        gap={40}
        hoverSpeed={20}
        fadeOut
      /> */}
          </div>
        </div>
      </div>
    </>
  )
}
