# Copilot Instructions - Actory

## Project layout (big picture)
- Backend API: Express/MongoDB in [actory-spotlight-backend/](actory-spotlight-backend/); routes mount under `/api/v1` and `/api` in [actory-spotlight-backend/server.js](actory-spotlight-backend/server.js).
- Frontend: Vite + React + Tailwind + ShadCN in [actory-spotlight-ui/](actory-spotlight-ui/).
- ML demo service: Flask app in [audition-prediction/](audition-prediction/) (separate process from the Node API).

## Core data flow & integrations
- REST base URL is `/api/v1`. The UI uses a single Axios client with auth + retry logic in [actory-spotlight-ui/src/lib/api.ts](actory-spotlight-ui/src/lib/api.ts).
- Auth is JWT in `Authorization: Bearer <token>`, stored in `localStorage` by the UI client (see interceptors in [actory-spotlight-ui/src/lib/api.ts](actory-spotlight-ui/src/lib/api.ts)).
- Realtime notifications use Socket.IO namespace `/notifications` with JWT auth in [actory-spotlight-backend/server.js](actory-spotlight-backend/server.js); emit via `createNotification` in [actory-spotlight-backend/utils/notificationService.js](actory-spotlight-backend/utils/notificationService.js); client hook in [actory-spotlight-ui/src/hooks/useSocketNotifications.js](actory-spotlight-ui/src/hooks/useSocketNotifications.js).
- Role-based casting: project roles create casting calls; models in [actory-spotlight-backend/models/FilmProject.js](actory-spotlight-backend/models/FilmProject.js) and [actory-spotlight-backend/models/CastingCall.js](actory-spotlight-backend/models/CastingCall.js), controllers in [actory-spotlight-backend/controllers/projects.js](actory-spotlight-backend/controllers/projects.js) and [actory-spotlight-backend/controllers/casting.js](actory-spotlight-backend/controllers/casting.js).
- Prediction endpoints: Node mock handlers at `/api/predict` and `/api/retrain` in [actory-spotlight-backend/routes/prediction.js](actory-spotlight-backend/routes/prediction.js); Flask service also exposes `/predict` and `/retrain` in [audition-prediction/app.py](audition-prediction/app.py).
- KNN role-fit endpoint lives in [actory-spotlight-backend/server.js](actory-spotlight-backend/server.js) at `/api/v1/fit/knn`.

## Dev workflows
- Backend dev server: `npm run dev` in [actory-spotlight-backend/](actory-spotlight-backend/).
- Frontend dev server: `npm run dev` in [actory-spotlight-ui/](actory-spotlight-ui/).
- E2E tests: `npm run test:e2e` in [actory-spotlight-ui/](actory-spotlight-ui/).

## Environment/config
- Backend env template is [actory-spotlight-backend/env.example](actory-spotlight-backend/env.example). Common required vars: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `CLIENT_ORIGIN`.
- DB fallback: `MONGODB_URI_SEEDLIST` is supported in [actory-spotlight-backend/config/db.js](actory-spotlight-backend/config/db.js).
- UI API base uses `VITE_API_URL` if present (see [actory-spotlight-ui/src/lib/api.ts](actory-spotlight-ui/src/lib/api.ts)).

## Project-specific conventions
- Use the shared Axios client from [actory-spotlight-ui/src/lib/api.ts](actory-spotlight-ui/src/lib/api.ts) instead of creating new `fetch`/`axios` instances.
- Notifications should be created via `createNotification` so the Socket.IO emitter broadcasts to online users (see [actory-spotlight-backend/utils/notificationService.js](actory-spotlight-backend/utils/notificationService.js)).
- System behavior and roles/casting flow are documented in [START_HERE.md](START_HERE.md) and [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md); follow those for role-based casting updates.
