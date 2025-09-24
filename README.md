Telemedicine MVP

Backend
- cd backend
- Copy .env.example to .env and set MONGO_URI, JWT_SECRET, FRONTEND_URL
- npm install
- npm run seed
- npm run dev

Frontend
- cd frontend
- npm install
- npm run dev

Environment
- VITE_API_URL defaults to http://localhost:5000/api
- VITE_SIGNAL_URL defaults to http://localhost:5000

API Endpoints
- Auth: POST /api/auth/register, POST /api/auth/login
- Appointments: POST /api/appointments/book, GET /api/appointments/patient/:id, GET /api/appointments/doctor/:id
- Records: POST /api/records/create, GET /api/records/:patientId, GET /api/records/:patientId/download
- Pharmacy: POST /api/pharmacy/update-stock, GET /api/pharmacy/check-stock/:medicineName
- Symptom Checker: POST /api/symptom-checker/query

Docker (optional)
- docker-compose up -d


