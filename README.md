# Queue Cure '26

Real-time clinic queue management system built for the Wooble Hackathon — Queue Cure '26.

## What it does

76% of India's 1.5 million clinics run on paper token slips. Queue Cure fixes that with a live, role-based queue system where patients request to join, receptionists accept and assign tokens, and both screens update instantly when the next token is called — no refresh required.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router + Socket.IO client |
| Backend | Node.js + Express 4 + Socket.IO server |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |

## Project Structure
## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- npm

### 1. Clone the repo
```bash
git clone https://github.com/nitisha-tech/queue-cure.git
cd queue-cure
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
### 3. Seed admin user
```bash
node -e "const mongoose=require('mongoose');require('dotenv').config();mongoose.connect(process.env.MONGO_URI).then(async()=>{const User=require('./models/User');const u=new User({name:'Admin',email:'admin@queuecure.com',password:'admin123',role:'admin',status:'approved'});await u.save();console.log('Admin created');process.exit();})"
```

Admin login:
- Email: `admin@queuecure.com`
- Password: `admin123`

### 4. Start backend
```bash
node server.js
```

### 5. Frontend setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
### 3. Seed admin user
```bash
node -e "const mongoose=require('mongoose');require('dotenv').config();mongoose.connect(process.env.MONGO_URI).then(async()=>{const User=require('./models/User');const u=new User({name:'Admin',email:'admin@queuecure.com',password:'admin123',role:'admin',status:'approved'});await u.save();console.log('Admin created');process.exit();})"
```

Admin login:
- Email: `admin@queuecure.com`
- Password: `admin123`

### 4. Start backend
```bash
node server.js
```

### 5. Frontend setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
### 6. Start frontend
```bash
npm run dev
```

App runs on `http://localhost:5173`

## User Flow

| Role | Access | Capabilities |
|---|---|---|
| Admin | Login with seeded credentials | Approve receptionists, monitor live queue, view activity log |
| Receptionist | Register → wait for admin approval → login | Accept/reject patients, assign tokens, call next, set avg time |
| Patient | Register → login immediately | Request to join queue, view token, tokens ahead, estimated wait live |

## Live Sync — How it works

Every queue mutation triggers a Socket.IO broadcast to all connected clients. Both the receptionist dashboard and patient waiting room listen for the `queue:update` event and re-render immediately. No polling, no refresh.

## Socket Events

| Event | Direction | Trigger | Payload |
|---|---|---|---|
| `queue:update` | Server → All clients | Any queue state change | `{ queueState, waitingPatients, pendingPatients, activityLog }` |

## API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register patient or receptionist |
| POST | /api/auth/login | Public | Login and receive JWT |
| GET | /api/admin/pending | Admin | Get pending receptionists |
| PATCH | /api/admin/approve/:id | Admin | Approve a receptionist |
| DELETE | /api/admin/reject/:id | Admin | Reject a receptionist |
| GET | /api/admin/activity-log | Admin | Get receptionist action log |
| POST | /api/queue/join | Patient | Request to join queue |
| GET | /api/queue/my-status | Patient | Get own token and position |
| GET | /api/queue/state | Any auth | Get full queue state |
| GET | /api/queue/pending | Receptionist | Get pending patient requests |
| PATCH | /api/queue/accept/:id | Receptionist | Accept patient, assign token |
| PATCH | /api/queue/reject/:id | Receptionist | Reject patient request |
| PATCH | /api/queue/call-next | Receptionist | Call next token |
| PATCH | /api/queue/avg-time | Receptionist | Set average consultation time |

## Submission Artifacts

- Working prototype / demo video
- GitHub repository (this repo)
- Socket event diagram
- Thought process sheet

---

Built for Queue Cure '26 on Wooble — India's portfolio-first hiring platform.
