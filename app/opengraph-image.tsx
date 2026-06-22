import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Ayushman Educational Academy - Smart School Fee Management System'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Graduation cap emoji */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 16,
          }}
        >
          🎓
        </div>

        {/* School Name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 900,
            marginBottom: 8,
          }}
        >
          Ayushman Educational Academy
        </div>

        {/* Location */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            marginBottom: 24,
          }}
        >
          Semli Bari
        </div>

        {/* Divider line */}
        <div
          style={{
            width: 80,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 2,
            marginBottom: 24,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center',
          }}
        >
          Smart School Fee Management System
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
