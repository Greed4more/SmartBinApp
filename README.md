# SmartBin: AI Waste Management & Biometric Ledger

SmartBin is a next-generation waste segregation and rewards platform. It contains both a high-fidelity **React Web Application** (including a live Three.js 3D bin and AI camera simulator) and an **Expo React Native Mobile Application** sharing a unified **Supabase** backend.

---

## 📁 Repository Structure

```
smartbin/
├── package.json              # Web app dependencies & script configs
├── vite.config.js            # Web bundler setup
├── index.html                # Web app entry markup (includes Leaflet/Face-API CDNs)
├── src/                      # React Web source files
│   ├── main.jsx              # Render loop
│   ├── App.jsx               # Application shell & navigation router
│   ├── index.css             # CSS variables, dark-mode styling & animations
│   ├── lib/                  # Connection libraries (Supabase client configuration)
│   ├── context/              # App context state management
│   ├── components/           # Particle backgrounds, 3D Canvas, Error boundaries
│   ├── screens/              # Dashboard, Auth, Biometrics, Map, Camera, Catalog
│   └── utils/                # Hindi/English translations & Cloudinary mock helpers
│
├── mobile/                   # Expo Mobile Application
│   ├── App.js                # React Native main router
│   ├── app.json              # Expo application configurations
│   ├── package.json          # Native dependency bindings
│   └── src/                  # React Native screens & config bindings
│
└── supabase/
    └── schema.sql            # Supabase database setup SQL scripts
```

   
