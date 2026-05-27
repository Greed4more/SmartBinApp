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

---

## 💾 1. Database Setup (Supabase)

1. Create a free project on [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor** tab in your dashboard.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. Set up authentication keys in the client config libraries if swapping with production environments.

---

## 🌐 2. Web Application Setup

To run the React Web application:

1. Open a terminal in the root directory:
   ```bash
   npm install
   ```
2. Start the local Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

*Note: The web app utilizes Leaflet maps and Face-API biometrics. It contains dynamic simulators for scanning items and enrolling facial biometric tensors without requiring local file assets or complex native plugins.*

---

## 📱 3. Mobile Application Setup

To run the Expo React Native application:

1. Navigate to the `mobile/` subdirectory:
   ```bash
   cd mobile
   npm install
   ```
2. Start the Expo builder:
   ```bash
   npx expo start
   ```
3. Scan the QR code with your iOS Camera app or the Android Expo Go client to launch the app!
