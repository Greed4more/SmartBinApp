import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const POINTS = [
  { id: 'all',   cam: [6, 4, 8], target: [0, 1.2, 0], label: '0. WHOLE BIN', desc: 'Complete 4-compartment segregation system.' },
  { id: 'lid',   cam: [0, 3, 4], target: [0, 2.5, 0], label: '1. TOP LID', desc: 'Ultrasonic + Dual Servo: Opens on proximity detection.' },
  { id: 'det',   cam: [0, 2, 3], target: [0, 1.8, 0], label: '2. DETECTION', desc: 'ESP32 Cam + IR/Moisture Sensors + Servo Trapdoor.' },
  { id: 'seg',   cam: [0, 1, 3], target: [0, 1.1, 0], label: '3. SEGREGATOR', desc: 'Gravity Distribution Pipes: Routes waste to targets.' },
  { id: 'bin',   cam: [0, 0, 3], target: [0, 0.4, 0], label: '4. STORAGE', desc: 'Boxes for Metal, Dry, and Wet waste.' },
]

export default function BinModel3D() {
  const mountRef = useRef(null)
  const [activePoint, setActivePoint] = useState(POINTS[0])
  const [demoState, setDemoState] = useState('idle')
  const alarmAudio = useMemo(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'), [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth, H = 350
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100)
    camera.position.set(6, 4, 8)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const spotlight = new THREE.PointLight(0xE8C547, 8, 20)
    spotlight.position.set(5, 5, 5)
    scene.add(spotlight)

    const binGroup = new THREE.Group()
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x2A2A28, transparent: true, opacity: 0.4,
      side: THREE.DoubleSide, metalness: 0.5, roughness: 0.2
    })
    const compMat  = new THREE.MeshStandardMaterial({ color: 0x444440 })

    const shell = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.8, 3.2, 32), shellMat)
    shell.position.y = 1.6
    binGroup.add(shell)

    const storage = new THREE.Group(); storage.position.y = 0.4
    const colors = [0x3A5A8C, 0xE8C547, 0x4A7C4E]
    colors.forEach((col, i) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 1.2), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3 }))
      b.position.x = (i - 1) * 0.5; storage.add(b)
    })
    binGroup.add(storage)

    const pipes = new THREE.Group(); pipes.position.y = 1.1
    for(let i=-1; i<=1; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1 }))
      p.position.x = i * 0.45; p.rotation.z = i * 0.3; pipes.add(p)
    }
    binGroup.add(pipes)

    const det = new THREE.Group(); det.position.y = 1.8
    const esp1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111 }))
    esp1.position.set(-0.5, 0.1, -0.4); det.add(esp1)
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), new THREE.MeshStandardMaterial({ color: 0x00ff00 }))
    cam.position.set(0, 0.5, 0.5); det.add(cam)
    const trap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.2), compMat); trap.position.y = -0.1; det.add(trap)
    binGroup.add(det)

    const lid = new THREE.Group(); lid.position.y = 2.5
    const lidTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.6), new THREE.MeshStandardMaterial({ color: 0xE8C547 }))
    lid.add(lidTop)
    binGroup.add(lid)

    scene.add(binGroup)

    const currentTarget = new THREE.Vector3(0, 1.2, 0)
    const desiredCam = new THREE.Vector3(6, 4, 8)

    let frame
    function animate() {
      frame = requestAnimationFrame(animate)
      desiredCam.set(...activePoint.cam)
      currentTarget.lerp(new THREE.Vector3(...activePoint.target), 0.05)
      camera.position.lerp(desiredCam, 0.05)
      camera.lookAt(currentTarget)
      binGroup.rotation.y += 0.005
      lidTop.rotation.x = -Math.abs(Math.sin(Date.now() * 0.001)) * 0.4
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
      try {
        mount.removeChild(renderer.domElement)
      } catch (err) {}
    }
  }, [activePoint])

  const runDemo = async (type = 'normal') => {
    setDemoState('scanning')
    setActivePoint(POINTS[2])
    await new Promise(r => setTimeout(r, 2000))
    if (type === 'mixed') {
      setDemoState('error')
      try {
        alarmAudio.play()
      } catch (e) {}
      setTimeout(() => { 
        setDemoState('idle')
        try {
          alarmAudio.pause()
          alarmAudio.currentTime = 0
        } catch (e) {}
        setActivePoint(POINTS[0])
      }, 3000)
    } else {
      setDemoState('segregating'); setActivePoint(POINTS[3])
      await new Promise(r => setTimeout(r, 2000))
      setDemoState('idle'); setActivePoint(POINTS[0])
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 16 }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
     
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
        <button onClick={() => runDemo('normal')} className="scan-btn" style={{ height: 26, fontSize: 8, width: 'fit-content', padding: '0 10px', boxShadow: '0 4px 12px rgba(232,197,71,0.2)' }}>
          SEGREGATE ♻️
        </button>
        <button onClick={() => runDemo('mixed')} className="scan-btn" style={{ height: 26, fontSize: 8, width: 'fit-content', padding: '0 10px', background: '#E85454', boxShadow: '0 4px 12px rgba(232,84,84,0.2)' }}>
          MIXED 🚨
        </button>
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4, width: 110, zIndex: 10 }}>
        {POINTS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePoint(p)}
            style={{
              background: activePoint.id === p.id ? 'var(--yellow)' : 'rgba(255,255,255,0.05)',
              color: activePoint.id === p.id ? 'var(--bg)' : 'var(--text-light)',
              border: 'none', padding: '4px 8px', borderRadius: 4,
              fontSize: 8, fontFamily: 'var(--font-mono)', textAlign: 'left',
              transition: 'all 0.2s', cursor: 'pointer', borderRight: activePoint.id === p.id ? '3px solid var(--bg)' : 'none',
              backdropFilter: 'blur(5px)', textTransform: 'uppercase'
            }}
          >
            {p.label.split('. ')[1] || p.label}
          </button>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 12, left: 12, right: 12,
        background: demoState === 'error' ? 'rgba(232, 84, 84, 0.95)' : 'rgba(20,20,20,0.9)',
        padding: '8px 12px', borderRadius: 8,
        border: `1px solid ${demoState === 'error' ? '#fff' : 'var(--yellow)'}`,
        backdropFilter: 'blur(10px)', zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: demoState === 'error' ? '#fff' : 'var(--yellow)', letterSpacing: 0.5 }}>
            {demoState === 'scanning' ? 'ANALYZING...' :
             demoState === 'segregating' ? 'ROUTING...' :
             demoState === 'error' ? '⚠️ ALARM: PLASTIC/MIXED!' :
             activePoint.label.toUpperCase()}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#fff', marginTop: 4, lineHeight: 1.4, opacity: 0.8 }}>
          {demoState === 'error' ? 'Non-detectable items. Removal required.' : activePoint.desc}
        </div>
      </div>
    </div>
  )
}
