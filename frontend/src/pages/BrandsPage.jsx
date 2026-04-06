import { useNavigate } from 'react-router-dom';

export default function BrandLogo({ category = null, subCategories = [] }) {
  const navigate = useNavigate();

  const logos = subCategories
    .filter(c => c.image?.url)
    .map(c => ({
      src: c.image.url,
      alt: c.title,
      href: `/category/${encodeURIComponent(c.title)}?type=sub`,
    }));

  if (!logos || logos.length === 0) return null;

  return (
    <div style={{ width: '100%', padding: '32px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '24px' }}>
          Top {category} Brands
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {logos.map((logo, i) => (
            <div
              key={i}
              onClick={() => navigate(logo.href)}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fff',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}