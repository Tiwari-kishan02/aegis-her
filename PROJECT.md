# Project: Aegis - Women Safety PWA
Tagline: "Her shield, wherever she goes."

## Stack
React + Vite + Tailwind (PWA via vite-plugin-pwa), React Router, Leaflet + OpenStreetMap,
Web Speech API for voice (hi-IN, en-IN), FastAPI backend, PostgreSQL.

## Branding
- Name: Aegis
- Colors: deep purple #4C1D95 (primary), coral red #EF4444 (Police/SOS),
  amber #F59E0B (Cab), blue #2563EB (Ambulance), light background #FAF5FF
- Font: Poppins (Google Fonts)
- Logo: shield with a location pin inside

## App concept
Home screen has 3 blocks: Police, Cab, Ambulance. Each block has a mic button.
Common flow: tap block -> location permission -> details -> Confirm screen -> alert.

## Global rules
- Mobile-first UI (design for 360-430px width, works on desktop too)
- No hardcoded API keys (use .env), keep .env out of git
- Folder structure: src/pages, src/components, src/hooks, src/services
- TEST_MODE flag so real alerts are never sent during demos
- Keep code simple and commented
- Only do the phase I ask for. Do not build future phases early.

---

# PHASE 1: Skeleton, Home screen, PWA setup

## Steps
1. Create a Vite + React project (JavaScript) in the current folder.
   Install react-router-dom, tailwindcss (with official Vite plugin),
   vite-plugin-pwa, lucide-react. Add Poppins font and custom Tailwind colors:
   aegis #4C1D95, sos #EF4444, cab #F59E0B, ambulance #2563EB, bg #FAF5FF.
2. Create folders: src/pages (Home, Police, Cab, Ambulance, NotFound),
   src/components (Header, BlockCard, MicButton, AegisLogo), src/hooks, src/services.
3. AegisLogo: inline SVG shield with a location pin inside.
   Header: logo + "Aegis" + tagline.
4. Home page: heading "Where do you need help?" and 3 large tappable cards:
   Police (red, "Report an incident, call 112"),
   Safe Cab (amber, "Book a ride home, share details"),
   Ambulance (blue, "Medical emergency, call 108").
   Each card has an icon and a mic button on the right (mic must not trigger navigation).
   Footer: "In immediate danger? Call 112" as a tel:112 link.
5. MicButton: UI only (round button, mic icon, pulsing style when listening). No speech logic.
6. Routing with react-router-dom: / , /police , /cab , /ambulance , * (NotFound).
   Placeholder pages with a back button and text "Coming in the next phase".
7. PWA: vite-plugin-pwa with autoUpdate, manifest name "Aegis", theme #4C1D95,
   background #FAF5FF, display standalone, icons 192, 512 and maskable 512 (purple
   background with white shield logo). Add meta tags and offline app shell caching.
8. Add .gitignore, .env.example (VITE_TEST_MODE=true), and a README with run steps.

## Done when
- npm run dev and npm run build work without errors
- Home shows 3 colored cards, tapping opens placeholder page, back returns home
- App is installable and named "Aegis"

---

# PHASE 2: Location + Map

## Steps
1. Install leaflet and react-leaflet. Import leaflet CSS and fix the default
   marker icon issue (Vite breaks default Leaflet icons).
2. Create src/hooks/useLocation.js:
   - Uses navigator.geolocation.getCurrentPosition and watchPosition
   - Returns { position: {lat, lng, accuracy}, status, error, requestLocation }
   - status values: "idle", "loading", "granted", "denied", "unsupported", "error"
   - Friendly error messages (permission denied, GPS unavailable, timeout)
   - Clean up watchPosition on unmount
3. Create src/components/MapView.jsx:
   - Leaflet map with OpenStreetMap tiles
   - Marker at user position, circle showing accuracy radius
   - Recenter automatically when position changes
   - Props: position, height (default 260px), children (extra markers later)
4. Create src/components/LocationCard.jsx:
   - Shows map and address text (lat, lng, accuracy in meters)
   - Shows "Turn on location" button when status is idle or denied
   - Shows loading state, and a helpful message when denied
     ("Enable location in your browser settings")
5. Update Police.jsx, Cab.jsx, Ambulance.jsx:
   - Keep back button and colored block title
   - On open, call requestLocation and show LocationCard
   - Add a disabled "Continue" button (enabled only when location is granted).
     It does nothing yet.
6. Mobile-first UI, same Aegis branding and colors.

## Done when
- Opening each block asks for location permission
- Map shows my live location with an accuracy circle
- Denying permission shows a clear message and a retry button
- npm run build and npm run lint pass

---

# PHASE 3: Police flow (frontend only, no backend yet)

## Steps
1. Create src/data/incidentTypes.js (id, label, icon, severity):
   Harassment, Stalking / being followed, Theft / chain snatching,
   Kidnapping attempt, Physical assault, Group threat (3-4 people), Other.
2. Update Police.jsx as a 3-step flow with a progress indicator:
   Step 1: Location (LocationCard from Phase 2)
   Step 2: Choose incident type (IncidentPicker component, big tappable tiles)
   Step 3: Confirm screen with location, incident type, time,
           and a "Confirm complaint" button. Back button on each step.
3. Always show a big "Call 112" button (tel:112) and "Women helpline 1091" (tel:1091).
4. Nearest police stations: create src/services/places.js that queries the
   Overpass API (OpenStreetMap, amenity=police) within 5 km of the user,
   sorts by distance, returns name, distance, lat, lng.
   Show the top 3 with a "Navigate" button (Google Maps directions link)
   and a "Call" button if a phone tag exists.
   Handle loading, error and "none found" states.
5. Create src/services/alerts.js with sendAlert(alert):
   - Alert object: { id, type: "police", category, lat, lng, accuracy, timestamp }
   - For now, save to localStorage under "aegis_alerts" and return success.
   - If VITE_TEST_MODE=true, show banner "TEST MODE: no real alert sent".
   - Leave a clear TODO comment where the backend API call goes in Phase 4.
6. After confirming, show a Success screen: "Complaint registered (saved locally)",
   alert ID, buttons "Call 112" and "Back to home".
7. Mobile-first, Aegis branding, simple commented code.

## Done when
- Police flow works end to end: location, incident type, confirm, success
- Nearest police stations list appears with distance
- Alert saved in localStorage (DevTools > Application)
- npm run build and npm run lint pass

Do not start Phase 4.