import { useEffect, useState } from 'react'

export default function ParticlesBg() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const count = 18
    const arr = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 6,
      duration: 12 + Math.random() * 20,
      delay: Math.random() * 15,
      opacity: 0.06 + Math.random() * 0.1,
    }))
    setParticles(arr)
  }, [])

  return (
    <div className="particles-bg">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  )
}
