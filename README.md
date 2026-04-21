# UniLearn — University of Ilorin Learning Management System

A full-stack Learning Management System (LMS) built for the University of Ilorin as a final year project. UniLearn enables students and lecturers to interact through a mobile-first web application covering course management, assignments, quizzes, grades, attendance, and live communication.

---

## 📸 Features

### For Students
- 🔐 Secure authentication with password reset via email
- 📚 Course enrollment and browsing by faculty/department/level
- 📄 Download course materials (PDF, video, documents)
- 📝 Submit assignments with file upload
- 🧠 Take timed quizzes with automatic submission and full answer review
- 📊 View grades with animated CGPA calculation
- 🗓️ Weekly timetable by enrolled courses
- 📋 Attendance tracking with 75% policy warning
- 💬 Real-time course discussion forum
- 📹 Video and voice calls (via Daily.co)
- 🌙 Dark mode, PWA-installable

### For Lecturers
- 📤 Upload course materials
- ✏️ Create assignments with due dates and marking schemes
- 🧪 Build multi-question quizzes with timer settings
- 📬 Grade student submissions with score and written feedback
- 📊 Record CA1, CA2, Midterm, and Exam scores per student
- 📢 Post announcements (normal or urgent priority)
- 💬 Participate in real-time course discussion forums

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime (Postgres changes) |
| Video/Voice | Daily.co |
| Deployment | Railway |

---

## 📁 Project Structure

```
src/
├── App.jsx                     # Root app with auth state and routing
├── main.jsx                    # React entry point
├── supabase.js                 # Supabase client
├── theme.js                    # Light/Dark color themes
├── data.js                     # Faculties, levels, constants
├── utils/
│   └── grades.js               # Grade calculation & file validation
├── components/
│   ├── Ic.jsx                  # SVG icon component
│   ├── Spinner.jsx             # Loading spinner
│   ├── Badge.jsx               # Label badge
│   ├── CallScreen.jsx          # Daily.co video/voice overlay
│   └── CourseDiscussion.jsx    # Real-time forum component
└── pages/
    ├── Auth.jsx                # Login, signup, forgot password
    ├── CourseEnrollment.jsx    # Initial course selection
    ├── lecturer/
    │   └── LecturerApp.jsx    # Full lecturer interface
    └── student/
        ├── StudentApp.jsx      # Student layout + React Router nav
        ├── Dashboard.jsx       # Home screen with deadlines
        ├── Courses.jsx         # Courses, materials, quizzes, tasks
        ├── Grades.jsx          # CGPA and grade breakdown
        ├── Timetable.jsx       # Weekly schedule
        ├── Attendance.jsx      # Per-course attendance
        ├── Settings.jsx        # Profile, password, avatar
        └── More.jsx            # Navigation overflow menu
```

---

## ⚙️ Environment Variables

### Railway (server)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| `DAILY_API_KEY` | Daily.co API key for video calls |
| `ALLOWED_ORIGIN` | Your deployed frontend URL (e.g. `https://unilearn.up.railway.app`) |

### Vite (frontend `.env`)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_API_URL` | Your Railway backend URL |

---

## 🗄️ Supabase Database Tables

Run the following SQL in your Supabase SQL editor:

```sql
-- Profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  name text, email text, role text,
  faculty text, department text, level text, semester text,
  matric text, staff_id text, avatar_url text,
  created_at timestamptz default now()
);

-- Courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  code text, title text, department text, faculty text,
  level int, semester text, units int, color text,
  created_at timestamptz default now()
);

-- Enrollments
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id),
  course_id uuid references courses(id),
  created_at timestamptz default now(),
  unique(student_id, course_id)
);

-- Materials
create table materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  title text, type text, file_path text, file_size text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Assignments
create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  title text, description text, due_date date, max_score int,
  created_at timestamptz default now()
);

-- Submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id),
  student_id uuid references profiles(id),
  file_path text, file_name text,
  score int, feedback text, submitted_at timestamptz,
  created_at timestamptz default now()
);

-- Quizzes
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  title text, duration_minutes int, questions jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Quiz attempts
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id),
  student_id uuid references profiles(id),
  score int, total int, answers jsonb, submitted_at timestamptz,
  unique(quiz_id, student_id)
);

-- Grades
create table grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id),
  course_id uuid references courses(id),
  ca1 int, ca2 int, midterm int, exam int,
  unique(student_id, course_id)
);

-- Timetable
create table timetable (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  day text, start_time text, end_time text, venue text
);

-- Attendance sessions
create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  date date, created_at timestamptz default now()
);

-- Attendance records
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references attendance_sessions(id),
  student_id uuid references profiles(id),
  present boolean default false
);

-- Announcements
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text, body text, priority text default 'normal',
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Forum posts
create table forum_posts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  author_id uuid references profiles(id),
  content text, parent_id uuid references forum_posts(id),
  created_at timestamptz default now()
);
```

### Enable Realtime for discussions
In Supabase → Database → Replication, enable the `forum_posts` table.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your Supabase and API URLs

# Start frontend dev server
npm run dev

# In a separate terminal, start the backend
node server.js
```

## 🚀 Deploy to Railway

```bash
# The railway script builds and starts the server
npm run railway
```

Set all environment variables in Railway dashboard before deploying.

---

## 👥 Roles

| Role | Access |
|---|---|
| `student` | Enroll in courses, submit work, take quizzes, view grades |
| `lecturer` | Manage all courses, grade students, post announcements |

---

## 📌 Security Notes

- File uploads go directly to Supabase Storage (bypasses Express, reducing attack surface)
- Server-side input validation on all `/api/` endpoints
- CORS restricted to your deployed domain in production
- Passwords hashed by Supabase Auth (bcrypt)
- Service role key is server-side only; never exposed to the client

---

*Built with React, Supabase, and Express · Deployed on Railway*
