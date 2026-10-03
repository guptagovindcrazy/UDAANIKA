<<<<<<< HEAD
# 🪶 Udaanika – Bird Migration & Rescue Platform

> *Every wing deserves a chance to fly.*

Udaanika connects people who find injured birds with wildlife-rescue volunteers. Users report a bird with a photo and location, a volunteer accepts and carries the rescue through a tracked workflow, and admins oversee everything. The platform also identifies bird species from photos (Python + OpenCV) and records community migration sightings with analytics.

**Stack:** React · Node.js/Express · MongoDB/Mongoose · JWT + bcrypt · Python (Flask + OpenCV)

---

## Features

| Area | What it does |
|---|---|
| **Users** | Register/login, profile + password change, report injured birds (photo, location, severity), track requests on a status timeline, cancel pending requests, identify birds, submit migration observations |
| **Volunteers** | Register a volunteer profile, set availability, see open requests, accept, start, mark rescued, complete with notes, release a rescue back to the pool, view history |
| **Admins** | Dashboard KPIs and charts, assign volunteers, force valid status changes, verify/reject volunteers, manage users, delete invalid records/observations, analytics |
| **Computer vision** | Photo → Node API → Flask/OpenCV service → species + confidence; below the confidence threshold it says *"not sure"* instead of guessing |
| **Migration** | Community sightings with date, count, direction, weather, coordinates; stats on top species, seasonal trend and hotspots |

### Rescue workflow
`Pending → Assigned → In Progress → Rescued → Completed`, plus `Cancelled` and `Rejected`.
A volunteer may also release an assigned rescue (`Assigned → Pending`).
Every transition and who may trigger it lives in one file, [`server/utils/rescueWorkflow.js`](server/utils/rescueWorkflow.js), and every change is logged in `statusHistory`, which drives the UI timeline.

---

## Architecture

```
 React (Vite)  ──/api──▶  Express API  ──Mongoose──▶  MongoDB
  :5173                     :5000
                              │  multipart image
                              ▼
                      Flask + OpenCV  :8000
                  validate → preprocess → ONNX model → threshold
```

- **Client** never calls axios directly in pages; everything goes through `client/src/services/`.
- **Server** is layered: `routes` (validation + auth) → `controllers` (business logic) → `models`; shared `middleware`, `services` (Python bridge) and `utils`.
- **Python service** is isolated: the Node app only knows its URL and the JSON contract, so the model can be swapped without touching Node.

### Folder structure
```
udaanika/
├── client/                 React app (Vite)
│   └── src/ components · pages · layouts · hooks · services · context · utils
├── server/
│   ├── controllers/ models/ routes/ middleware/ services/ utils/ config/
│   ├── scripts/seed.js     demo data
│   ├── tests/              Jest + Supertest
│   └── app.js · server.js
├── python-service/         Flask + OpenCV (model/ services/ utils/)
├── .env.example
└── README.md
```

---

## Getting started

### Prerequisites
Node.js **18+**, Python **3.9+**, MongoDB (local, Docker or Atlas).

### 1. MongoDB
Any of: local `mongod`; `docker run -d -p 27017:27017 mongo:7`; or a free MongoDB Atlas cluster (put its URI in `MONGO_URI`).

### 2. Environment
```bash
cp .env.example server/.env      # then set JWT_SECRET to a long random string
```
| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Token signing secret and lifetime |
| `PYTHON_SERVICE_URL` | Where the CV service runs (default `http://127.0.0.1:8000`) |
| `CLIENT_URL` | Allowed CORS origin (default `http://localhost:5173`) |

### 3. Install and run (three terminals)
```bash
# Terminal 1: API
npm install --prefix server
npm run seed --prefix server      # optional demo data (wipes the DB!)
npm run server                    # http://localhost:5000/api/health

# Terminal 2: bird identification service
cd python-service
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                     # http://127.0.0.1:8000/health
#   No trained model yet? For UI demos ONLY:  UDAANIKA_DEMO_MODE=1 python app.py

# Terminal 3: React app
npm install --prefix client
npm run client                    # http://localhost:5173
```
The Vite dev server proxies `/api` and `/uploads` to port 5000, so no CORS setup is needed locally.

### Demo credentials (development only)
Created by `npm run seed`. **Never use these in production.** Password for all accounts: `Demo@1234`

| Role | Email |
|---|---|
| Admin | `admin@udaanika.dev` |
| User | `aarav@udaanika.dev` (also `diya@`, `kabir@`, `meera@`) |
| Volunteer | `rohan@udaanika.dev` (also `ananya@`, `imran@`) |

---

## Computer-vision pipeline
`React → POST /api/birds/identify (multer: type + 5 MB limit) → POST /predict (Flask) → decode & validate → resize 224px, RGB, ImageNet-normalise → ONNX classifier via OpenCV DNN → threshold → JSON → Node attaches the matching Bird record → React`

```json
{ "species": "Indian Peafowl", "confidence": 0.94, "status": "success" }
{ "species": null,            "confidence": 0.21, "status": "low_confidence" }
```
- Below `CONFIDENCE_THRESHOLD` (default 0.6) no species is returned.
- If the CV service is down, the API returns `503` and the report form still works without it.
- **Model status:** the repo ships *no trained weights*. Without `python-service/model/bird_classifier.onnx` the service answers `low_confidence`. `UDAANIKA_DEMO_MODE=1` returns **simulated** results (flagged `demo: true` and shown as such in the UI). See [`python-service/README.md`](python-service/README.md) for exporting and plugging in a real model.

---

## API reference
All responses use `{ "success": true|false, "message": "...", "data": {...} }`. Protected routes need `Authorization: Bearer <token>`.

**Auth & users**
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public (register always creates role `user`) |
| GET | `/api/auth/me` | signed in |
| GET/PUT | `/api/users/profile` | signed in (multipart for photo) |

**Rescues**
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/rescues` (multipart `image`) | user |
| GET | `/api/rescues?status=A,B&severity=&page=&limit=` | role-scoped (user: own; volunteer: pending + assigned to them; admin: all) |
| GET | `/api/rescues/stats` | role-scoped counts by status |
| GET/PUT/DELETE | `/api/rescues/:id` | owner (while Pending) / assigned volunteer (read) / admin |
| PATCH | `/api/rescues/:id/assign` | volunteer (self-accept) or admin (`volunteerId`) |
| PATCH | `/api/rescues/:id/status` `{status, note}` | per workflow + role rules |

**Volunteers**
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/volunteers` | user (promotes to volunteer) |
| GET | `/api/volunteers/me` | volunteer (profile + stats) |
| GET | `/api/volunteers` | admin |
| GET/PUT | `/api/volunteers/:id` | owner / admin (only admin may set `verificationStatus`) |
| PATCH | `/api/volunteers/:id/availability` | owner / admin |

**Birds, migration, admin**
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/birds/identify` (multipart `image`) | signed in |
| GET | `/api/birds`, `/api/birds/:id` | public |
| POST/PUT/DELETE | `/api/birds[/:id]` | admin |
| POST | `/api/migrations` | signed in |
| GET | `/api/migrations`, `/api/migrations/analytics`, `/api/migrations/:id` | public |
| DELETE | `/api/migrations/:id` | owner / admin |
| GET | `/api/admin/dashboard`, `/users`, `/volunteers`, `/rescues` | admin |
| DELETE | `/api/admin/users/:id` | admin (refused if the user has rescue records) |
| GET | `/api/stats` | public landing-page numbers |

---

## Database schema (MongoDB / Mongoose)
| Collection | Key fields | Indexes |
|---|---|---|
| `users` | name, email (unique), password (bcrypt, `select:false`), phone, role, location, profileImage | email, role |
| `volunteers` | **user → users**, experience, specialization[], availability, serviceArea, emergencyContact, verificationStatus, rescuesCompleted | user (unique), availability |
| `rescues` | requestId, **reportedBy → users**, **assignedVolunteer → volunteers**, birdSpecies, birdIdentificationConfidence, description, injuryType, severity, imageUrl, latitude/longitude, locationName, contactNumber, status, statusHistory[], volunteerNotes, adminNotes, completedAt | status, reportedBy, assignedVolunteer, createdAt, lat/lng |
| `birds` | commonName, scientificName, habitat, migrationPattern, conservationStatus, image, description | text index on names |
| `migrationobservations` | species, **observer → users**, location, lat/lng, observationDate, count, direction, weather, notes, image | species, observationDate, lat/lng |

References are used instead of embedding user/volunteer objects; controllers `populate` only the fields they need.

## Authentication & security
1. `POST /auth/register|login` → server returns a JWT (payload: user id + role) and the user document without the password.
2. The client stores the token and sends it as a Bearer header via an axios interceptor; a `401` clears the session.
3. `auth` middleware verifies the token and loads the user from the DB (so role changes and deletions take effect immediately); `role(...)` middleware gates routes; controllers add resource-level checks (ownership, assigned volunteer).

Also: bcrypt (cost 12), `helmet`, CORS allow-list, rate limiting on `/api/auth`, `express-validator` on inputs, upload whitelist (JPG/PNG/WEBP, 5 MB), no public role escalation (admins only via seed), generic error messages in production, Mongo duplicate/CastError/JWT errors mapped to proper HTTP codes.

---

## Testing
```bash
npm test --prefix server
```
Jest + Supertest against an in-memory MongoDB (`mongodb-memory-server`; downloads a MongoDB binary the first time). The Python service is mocked. Covered: registration/login/protected routes, role escalation attempts, rescue creation, the full status workflow and invalid transitions, volunteer assignment/release, bird identification (incl. low-confidence and bad uploads), migration creation/validation/analytics, and admin endpoints. Next candidates: component tests with React Testing Library and Playwright end-to-end flows.

## Troubleshooting
| Problem | Fix |
|---|---|
| `MongoDB connection` / `ECONNREFUSED 27017` | Start MongoDB or fix `MONGO_URI` in `server/.env` |
| `JWT_SECRET` errors / 401 on every call | Make sure `server/.env` exists and `JWT_SECRET` is set; restart the API |
| `fetch is not defined` / `FormData is not defined` | Upgrade to Node 18+ |
| Identify returns 503 | Start the Python service and check `PYTHON_SERVICE_URL` |
| Identify always says "not sure" | No model installed. Add `bird_classifier.onnx` (see python-service README) or use demo mode for UI demos |
| Images don't show | The API must run on port 5000 (Vite proxies `/uploads`); check `server/uploads/` is writable |
| Port already in use | Change `PORT` (API/Flask) or stop the other process |
| Tests hang on first run | `mongodb-memory-server` is downloading MongoDB; wait or pre-download |
| CORS error in production | Set `CLIENT_URL` on the API and `VITE_API_URL` when building the client |

## Deployment notes
API on Render/Railway, MongoDB Atlas, client on Vercel/Netlify with `VITE_API_URL` and `VITE_ASSET_URL` pointing at the API, and the Python service as its own container. Uploaded images are stored on local disk, so use object storage (S3/Cloudinary) before deploying to anything with an ephemeral filesystem.

## Future improvements
- Train and ship a real bird classifier; evaluate it on held-out Indian species
- Real-time notifications to nearby volunteers (Socket.io) plus SMS/email
- Geospatial matching (`2dsphere` + `$near`) to rank volunteers by distance
- httpOnly-cookie sessions with refresh tokens; email verification and password reset
- Interactive maps (Leaflet) for rescues and migration routes
- Cloud image storage, image moderation, i18n (Hindi/regional languages), PWA/offline reporting
- CI pipeline (lint, tests, build), React and end-to-end tests
=======
# UDAANIKA
Udaanika, a full-stack bird rescue and migration platform. It uses React, Node/Express, MongoDB, and a Python computer-vision service, with user, volunteer, and admin roles.
>>>>>>> 10a28757324ed3137955a5883e774ecf27543ba6
