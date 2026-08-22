import SideRays from './SideRays';
import DotField from './DotField';

interface LandingBackgroundProps {
  className?: string;
}

export default function LandingBackground({ className = '' }: LandingBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#09090b',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      {/* 1. Volumetric WebGL Light Rays in the top corner */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <SideRays
          speed={0.8}
          rayColor1="#a855f7"
          rayColor2="#3b82f6"
          intensity={1.8}
          spread={1.8}
          origin="top-right"
          tilt={-5}
          saturation={1.4}
          blend={0.7}
          falloff={1.8}
          opacity={0.85}
        />
      </div>

      {/* 2. Interactive DotField Canvas with cursor interaction */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'auto' }}>
        <DotField
          dotRadius={1.5}
          dotSpacing={18}
          bulgeStrength={60}
          glowRadius={160}
          gradientFrom="rgba(168, 85, 247, 0.4)"
          gradientTo="rgba(59, 130, 246, 0.3)"
          glowColor="#18181b"
          sparkle={true}
          waveAmplitude={2}
        />
      </div>

      {/* 3. Subtle ambient background gradient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '30%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
