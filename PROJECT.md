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

---

# PHASE 4: Backend (FastAPI) + real alerts

## Steps
1. Create a /backend folder (Python FastAPI) with this structure:
   backend/app/main.py, models.py, database.py, schemas.py,
   routes/ (auth.py, contacts.py, alerts.py), services/sms.py,
   backend/requirements.txt, backend/.env.example, backend/README.md
2. Database: SQLAlchemy. Use DATABASE_URL from .env.
   Default to SQLite (sqlite:///./aegis.db) for easy local dev,
   code must also work with PostgreSQL by changing DATABASE_URL.
   Tables: users (id, phone, name, created_at),
   contacts (id, user_id, name, phone),
   alerts (id, user_id, type [police|ambulance|cab], category, lat, lng,
   accuracy, status, created_at).
3. Auth (simple, dev-friendly):
   - POST /auth/request-otp {phone}: generates a 6-digit OTP, stores it with
     5-minute expiry. In TEST_MODE it only prints the OTP in the server console.
   - POST /auth/verify-otp {phone, otp}: returns a JWT access token
     (python-jose), creates user if new.
   - Rate limit OTP requests (max 3 per 10 minutes per phone).
4. Contacts: GET/POST/DELETE /contacts (JWT protected), max 5 per user,
   validate Indian phone numbers.
5. Alerts: POST /alerts (JWT protected) saves the alert and sends SMS to the
   user's trusted contacts with a Google Maps link
   (https://maps.google.com/?q=lat,lng) and the alert type.
   GET /alerts returns the current user's alerts.
6. services/sms.py: Twilio integration. If TEST_MODE=true (default), do NOT send;
   only log "[TEST MODE] SMS to <phone>: <message>". Keys come from .env only.
7. Add CORS for http://localhost:5173, and a GET /health endpoint.
8. Frontend changes:
   - Create src/services/api.js (base URL from VITE_API_URL, attaches token).
   - Create Login page (phone, OTP steps), and a Contacts page (add/remove contacts).
     Add routes /login and /contacts, and links from Home header.
   - Update sendAlert() in alerts.js to call POST /alerts.
     If user is not logged in or the backend is unreachable, fall back to
     localStorage and show "Saved offline, will not notify contacts".
9. Write backend/README.md with exact run commands for Windows PowerShell:
   python -m venv venv, venv\Scripts\activate, pip install -r requirements.txt,
   uvicorn app.main:app --reload

## Done when
- Backend runs at http://localhost:8000 and /docs shows all endpoints
- Login with OTP works (OTP visible in backend console in TEST_MODE)
- Adding contacts works
- Confirming a police complaint creates a row in the alerts table
  and logs a TEST MODE SMS for each contact

---

# PHASE 5: Ambulance flow

## Steps
1. Refactor for reuse: extract the shared parts of the Police flow into reusable
   components (StepIndicator, ConfirmScreen, SuccessScreen, NearbyPlacesList)
   so Police and Ambulance both use them. Police must keep working exactly as before.
2. Create src/data/medicalTypes.js (id, label, icon):
   Accident / injury, Unconscious / not responding, Breathing problem,
   Chest pain, Severe bleeding, Pregnancy emergency, Other medical emergency.
3. Rewrite Ambulance.jsx as a 3-step flow:
   Step 1: Location, Step 2: Choose emergency type, Step 3: Confirm.
4. Always show big buttons: "Call 108" (tel:108), "Call 102" (tel:102),
   "Call 112" (tel:112).
5. Nearest hospitals: extend src/services/places.js with a function that queries
   Overpass for amenity=hospital within 5 km (also try amenity=clinic if few results),
   sorted by distance. Show top 3 with distance, "Navigate" (Google Maps link)
   and "Call" if a phone tag exists.
6. On confirm: call sendAlert with type "ambulance" and the emergency type as
   category. Reuse the Phase 4 backend flow (saves alert, SMS to trusted contacts
   with Maps link, TEST_MODE respected). Success screen text:
   "Help alert sent to your trusted contacts. Call 108 now."
7. Add an optional field on the confirm screen: "Patient details" (short text).
   Include it in the alert message.
8. Mobile-first, blue ambulance theme (#2563EB), same Aegis branding.

## Done when
- Ambulance flow works end to end like Police
- Nearest hospitals list appears
- Alert with type "ambulance" is saved in the DB and TEST MODE SMS is logged
- Police flow still works
- npm run build and npm run lint pass

---

# PHASE 6: Safe Cab flow

## Steps
1. Add a geocoding service in src/services/geocode.js using Nominatim
   (OpenStreetMap): searchPlaces(query) with a 500ms debounce, India-biased
   (countrycodes=in), and reverseGeocode(lat, lng). Send a proper User-Agent/
   Referer-friendly request and respect rate limits (1 request per second).
2. Rewrite Cab.jsx as a 4-step flow using the shared components from Phase 5:
   Step 1: Pickup = current location (LocationCard, editable via search).
   Step 2: Destination search with autocomplete suggestions list.
   Step 3: Route preview on the map (pickup and drop markers, straight line or
           OSRM public API route), distance and rough ETA.
   Step 4: Book options, see below.
3. Book options (no real Uber/Ola API exists for third parties, so use deep links):
   buttons "Open Uber", "Open Ola", "Open Rapido" that open each app/site with
   pickup and drop coordinates prefilled using their documented deep-link/URL
   formats. Put all link builders in src/services/rideLinks.js. If a link format
   is uncertain, fall back to opening the app's website with a comment explaining.
   Add a note: "Compare prices in each app, then book."
4. Late-night safety: after the user taps a ride button, show a "Share my ride"
   form: driver name, vehicle number, cab company (all optional) and
   "Notify trusted contacts" button.
5. Notifying contacts: call sendAlert with type "cab", category "ride_shared",
   including destination, driver name and vehicle number in the message.
   Backend (alerts route and sms.py) must include these in the SMS with the live
   location link. TEST_MODE rule still applies. Update the alerts table or
   add a JSON "details" column for extra fields (handle the migration safely
   for the existing SQLite DB).
6. Add a "Journey timer": user picks expected arrival (30 min, 1h, custom).
   If they do not tap "I reached safely" before the timer ends, show a
   countdown warning for 60 seconds and then automatically send an alert
   (type "cab", category "no_checkin") to trusted contacts.
7. Mobile-first, amber theme (#F59E0B), Aegis branding, simple commented code.

## Done when
- Destination search suggests places and shows the route on the map
- The three ride buttons open with pickup/drop prefilled (or fall back gracefully)
- Share ride sends a TEST MODE SMS with driver details and location link
- Journey timer triggers the no-check-in alert
- Police and Ambulance flows still work
- npm run build and npm run lint pass

---

# PHASE 7: Voice input

## Steps
1. Create src/hooks/useVoice.js using the Web Speech API
   (SpeechRecognition / webkitSpeechRecognition):
   - Returns { listening, transcript, supported, error, start, stop, language, setLanguage }
   - Languages: "hi-IN", "en-IN", "mr-IN"
   - Handles permission denied, no speech detected, and unsupported browsers.
2. Update MicButton.jsx: now real. Tap to start, tap again to stop,
   pulsing animation while listening, shows the live transcript, and a small
   language switch (HI / EN / MR). Remember the last language in localStorage.
3. Use voice in all three blocks:
   - Police: speak the location/landmark OR say the incident
     (match keywords like "peecha", "chori", "kidnap", "marpeet", "chhed" and
     English equivalents to the incident types, then ask the user to confirm).
   - Ambulance: speak the location or emergency type
     (keywords like "accident", "saans", "seene mein dard", "khoon").
   - Cab: speak the destination.
4. Speech to place: send the transcript to the Nominatim geocoder from Phase 6,
   show the top results, drop a pin on the map and ask "Is this correct?"
   Always require the user to confirm before it is used.
5. Home page mic buttons: speaking "police", "ambulance" or "cab"
   (Hindi and English, e.g. "police bulao", "ambulance chahiye", "cab book karo")
   opens the matching block.
6. If speech is unsupported (e.g. some iOS browsers), hide the mic and show a
   small hint to type instead. Nothing should break without voice.
7. Keep keyword lists in src/data/voiceKeywords.js so they are easy to edit.

## Done when
- Mic works in Chrome (Android and desktop) in Hindi and English
- Spoken destination/location is geocoded, shown on the map and confirmed
- Home mic opens the right block
- Typing still works everywhere
- npm run build and npm run lint pass

Do not start Phase 8.