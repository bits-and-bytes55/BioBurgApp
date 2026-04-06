import LogoLoop from '../components/LogoLoop';
// import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss } from 'react-icons/si';


// Alternative with image sources
const imageLogos = [
  { src: '/bioburglogos/BestQualitylogo.jpeg', alt: 'Company 1', href: '#' },
  { src: '/bioburglogos/COIlogo.jpeg', alt: 'Company 2', href: '#' },
  { src: '/bioburglogos/FASSAI.png', alt: 'Company 3', href: '#' },
  { src: '/bioburglogos/GMPlogo.png', alt: 'Company 4', href: '#' },
  { src: '/bioburglogos/ISO2008logo.webp', alt: 'Company 5', href: '#' },
  { src: '/bioburglogos/ISO2015logo.webp', alt: 'Company 6', href: '#' },
  { src: '/bioburglogos/MakeinINDIA.jpeg', alt: 'Company 7', href: '#' },
  { src: '/bioburglogos/MSMElogo.png', alt: 'Company 8', href: '#' },
  { src: '/bioburglogos/StartUpINDIAlogo.png', alt: 'Company 9', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 10', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 11', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 12', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 13', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 14', href: '#'},
//   { src: 'bioburglogos/', alt: 'Company 15', href: '#'},
//   { src: 'bioburglogos/', alt: 'Company 16', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 17', href: '#' },
//   { src: 'bioburglogos/', alt: 'Company 18', href: '#' }
]

export default function BrandLogo () {
  return (
    <>
      <div className='w-full'>
        <div className='max-w-7xl mx-auto bg-transparent'>
          {/* <h2 className='text-3xl font-bold'>Top Brands</h2> */}
          <div
            style={{
              height: '200px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
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
            //   fadeOutColor='#ffffff'
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
