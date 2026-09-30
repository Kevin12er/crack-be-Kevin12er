# Backend LMS (NestJS + Prisma)

Backend ini adalah REST API untuk Learning Management System (LMS), dibangun dengan NestJS, Prisma ORM v7, dan PostgreSQL.

## Fitur Yang Sudah Ada

### 1. Autentikasi & Keamanan (Auth & Security)
- **JWT Authentication:** Endpoint `register`, `login`, dan `profile` (GET me).
- **Role-Based Access Control (RBAC):** Proteksi hak akses berdasarkan peran (`STUDENT` dan `INSTRUCTOR`).
- **Role Injection Protection:** Validasi ketat DTO (`ValidationPipe` + `forbidNonWhitelisted`) untuk mencegah *privilege escalation* saat registrasi.
- **Rate Limiting (Anti Brute-Force):** Proteksi global menggunakan `@nestjs/throttler` (dibatasi 5 request/menit untuk mencegah serangan brute-force pada endpoint sensitif).
- **UpdateProfile:** Update profile/ mengganti username dan email

### 2. Manajemen Kelas & Konten (Course & Content Management)
- **Courses (Full CRUD):**
  - Membuat, membaca, memperbarui, dan menghapus kelas (khusus Instructor pemilik kelas).
  - Advanced Search & Filtering: Pencarian berdasarkan kata kunci (`search`), kategori (`category`), dan rentang harga (`minPrice` & `maxPrice`).
- **Materials (Full CRUD):**
  - Pengelolaan materi pembelajaran per kelas (Create, Read, Update, Delete khusus Instructor).
  - Filter pencarian materi berdasarkan `courseId` dan kata kunci `search`.
- **Enrollment:** Siswa (`STUDENT`) dapat mendaftar (*enroll*) ke dalam kelas yang tersedia.

### 3. Sistem Kuis & Penilaian (Quizzes & Assessment System)
- **Quizzes (Full CRUD):**
  - Pengelolaan kuis pembelajaran dengan pembatasan durasi (*time limit*).
  - Filter pencarian kuis berdasarkan `courseId` dan kata kunci `search`.
- **Quiz Questions & Options:** Bank soal (Pilihan Ganda & Essay) beserta opsi jawaban dan batasan kuncinya.
- **Quiz Attempts & Answers:** Tracking percobaan pengerjaan kuis siswa secara *real-time* beserta perekaman jawaban.
- **Results:** Rekapitulasi nilai otomatis (*score*, status kelulusan, dan *remarks*).

### 4. Dokumentasi & Alat Bantu
- **Interactive Swagger Docs:** Dokumentasi OpenAPI interaktif di `/api/docs` untuk pengujian seluruh endpoint.
- **Prisma ORM & PostgreSQL Integration:** Manajemen skema database relational yang solid dan terintegrasi.

## Tech Stack

- NestJS
- Prisma ORM 7
- PostgreSQL
- JWT
- Docker (database lokal)
- Jest

## Struktur Folder Project

```text
src
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── auth
│   ├── auth.controller.spec.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.spec.ts
│   ├── auth.service.ts
│   ├── decorators
│   │   └── roles.decorator.ts
│   ├── dto
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards
│   │   └── roles.guard.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── courses
│   ├── courses.controller.spec.ts
│   ├── courses.controller.ts
│   ├── courses.module.ts
│   ├── courses.service.spec.ts
│   ├── courses.service.ts
│   ├── dto
│   │   ├── create-course.dto.ts
│   │   └── update-course.dto.ts
│   └── entities
│       └── course.entity.ts
├── enrollment
│   ├── dto
│   │   └── create-enrollment.dto.ts
│   ├── enrollment.controller.spec.ts
│   ├── enrollment.controller.ts
│   ├── enrollment.module.ts
│   ├── enrollment.service.spec.ts
│   └── enrollment.service.ts
├── main.ts
├── materials
│   ├── dto
│   │   ├── create-material.dto.ts
│   │   └── update-material.dto.ts
│   ├── materials.controller.ts
│   ├── materials.module.ts
│   └── materials.service.ts
├── prisma
│   ├── prisma.module.ts
│   ├── prisma.service.spec.ts
│   └── prisma.service.ts
├── quiz-answers
│   ├── dto
│   │   └── create-quiz-answer.dto.ts
│   ├── quiz-answers.controller.ts
│   ├── quiz-answers.module.ts
│   └── quiz-answers.service.ts
├── quiz-attempts
│   ├── dto
│   │   └── create-quiz-attempt.dto.ts
│   ├── quiz-attempts.controller.ts
│   ├── quiz-attempts.module.ts
│   ├── quiz-attempts.service.spec.ts
│   └── quiz-attempts.service.ts
├── quiz-options
│   ├── dto
│   │   └── create-quiz-option.dto.ts
│   ├── quiz-options.controller.ts
│   ├── quiz-options.module.ts
│   └── quiz-options.service.ts
├── quiz-questions
│   ├── dto
│   │   └── create-quiz-question.dto.ts
│   ├── quiz-questions.controller.ts
│   ├── quiz-questions.module.ts
│   └── quiz-questions.service.ts
├── quizzes
│   ├── dto
│   │   ├── create-quiz.dto.ts
│   │   └── update-quiz.dto.ts
│   ├── quizzes.controller.ts
│   ├── quizzes.module.ts
│   └── quizzes.service.ts
├── results
│   ├── results.controller.ts
│   ├── results.module.ts
│   └── results.service.ts
├── tasks
│   ├── dto
│   │   ├── create-task.dto.ts
│   │   └── update-task.dto.ts
│   ├── entities
│   │   └── task.entity.ts
│   ├── tasks.controller.spec.ts
│   ├── tasks.controller.ts
│   ├── tasks.module.ts
│   ├── tasks.service.spec.ts
│   └── tasks.service.ts
└── users
    ├── dto
    │   └── update-user.dto.ts
    ├── users.controller.spec.ts
    ├── users.controller.ts
    ├── users.module.ts
    ├── users.service.spec.ts
    └── users.service.ts
```

## Penjelasan Struktur Folder `src`

- `auth/` — Otentikasi JWT, registrasi/login, hashing password, dekorator `@Roles`, serta guard keamanan (`JwtAuthGuard`, `RolesGuard`).
- `courses/` — Manajemen kelas/course (CRUD lengkap, proteksi kepemilikan Instructor, serta query pencarian & filter harga/kategori).
- `enrollment/` — Pendaftaran siswa ke kelas (*Student enrollment*).
- `materials/` — Pengelolaan materi pembelajaran per kelas (Full CRUD + Search).
- `quizzes/` — Pengelolaan data kuis utama per kelas (Full CRUD + Search).
- `quiz-questions/` — Bank soal per kuis (tipe pilihan ganda & essay).
- `quiz-options/` — Opsi pilihan jawaban beserta penentuan kunci jawaban benar.
- `quiz-attempts/` — Manajemen sesi pengerjaan kuis siswa (tracking status pengerjaan & *time limit*).
- `quiz-answers/` — Perekaman jawaban yang dikirimkan oleh siswa.
- `results/` — Rekapitulasi nilai akhir, status kelulusan, dan catatan (*remarks*).
- `tasks/` — Manajemen tugas personal siswa (Full CRUD).
- `prisma/` — Modul database ORM (`PrismaService` & `PrismaModule`).

## Model Database Utama

Model yang sudah ada di `prisma/schema.prisma`:

- `User`
- `Course`
- `Enrollment`
- `Material`
- `Quiz`
- `QuizQuestion`
- `QuizOption`
- `QuizAttempt`
- `QuizAnswer`
- `Task`
- `Result`


Enum yang sudah digunakan:

- `Role` (`INSTRUCTOR`, `STUDENT`)
- `QuestionType` (`MULTIPLE_CHOICE`, `ESSAY`)
- `QuizAttemptStatus` (`IN_PROGRESS`, `SUBMITTED`, `GRADED`)

## Endpoint Tambahan Yang Sudah Diimplementasi

### 1. Materials Module (`/materials`)
- `GET /materials` — Mengambil daftar materi (Dukungan filter `courseId` & `search`)
- `GET /materials/:id` — Mengambil detail materi berdasarkan ID
- `POST /materials` — Membuat materi pembelajaran baru (*Khusus Instructor*)
- `PATCH /materials/:id` — Memperbarui materi pembelajaran (*Khusus Instructor*)
- `DELETE /materials/:id` — Menghapus materi pembelajaran (*Khusus Instructor*)

### 2. Quizzes Module (`/quizzes`)
- `GET /quizzes` — Mengambil daftar kuis (Dukungan filter `courseId` & `search`)
- `GET /quizzes/:id` — Mengambil detail kuis berdasarkan ID
- `POST /quizzes` — Membuat kuis baru (*Khusus Instructor*)
- `PATCH /quizzes/:id` — Memperbarui kuis (*Khusus Instructor*)
- `DELETE /quizzes/:id` — Menghapus kuis (*Khusus Instructor*)

### 3. Quiz Management & Assessment Modules
- **Questions & Options:**
  - `POST /quiz-questions` — Membuat soal kuis (Pilihan Ganda / Essay)
  - `GET /quiz-questions/quiz/:quizId` — Mengambil daftar soal berdasarkan ID Kuis
  - `POST /quiz-options` — Membuat pilihan jawaban untuk soal
  - `GET /quiz-options/question/:questionId` — Mengambil pilihan jawaban berdasarkan ID Soal
- **Attempts & Answers:**
  - `POST /quiz-attempts` — Memulai sesi pengerjaan kuis oleh siswa
  - `GET /quiz-attempts` — Mengambil histori pengerjaan kuis
  - `POST /quiz-answers` — Menyimpan jawaban siswa per soal
  - `GET /quiz-answers/attempt/:attemptId` — Mengambil rekap jawaban siswa dalam 1 sesi kuis
- **Results:**
  - `GET /results` — Mengambil seluruh rekapitulasi nilai kuis
  - `GET /results/:studentId` — Mengambil hasil nilai kuis spesifik berdasarkan ID Siswa

## Environment Variables

Isi file `.env` minimal:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
JWT_SECRET="isi_dengan_secret_panjang"
```

## Cara Menjalankan Lokal

1. Install dependency:

```bash
npm install
```

2. Jalankan PostgreSQL lokal:

```bash
docker compose up -d
```

3. Generate Prisma Client:

```bash
npx prisma generate
```

4. Jalankan migrasi database:

```bash
npx prisma migrate dev
```

5. Jalankan server:

```bash
npm run start:dev
```

6. Buka Swagger:

```text
http://localhost:3001/api/docs
```

## Script Penting

- `npm run start:dev`
- `npm run build`
- `npm run start:prod`
- `npm run test`
- `npm run test:e2e`

## Live Production

- Swagger: `https://crack-be-kevin12er-production.up.railway.app/api/docs`
- Base API: `https://crack-be-kevin12er-production.up.railway.app`

## Backend Unit Test Coverage

(Masih dalam tahap tes untuk keseluruhan modul)
Test runner: Jest
Coverage:
- Statements: 17.28%
- Branches: 14.65%
- Functions: 18.33%
- Lines: 16.41%

Command:
npm run test:cov

## Deploy Ke Railway

1. Push code ke GitHub.
2. Hubungkan repo ke Railway + PostgreSQL service.
3. Isi variables:

- `DATABASE_URL`
- `JWT_SECRET`

4. Set start command:

```bash
npx prisma generate && npx prisma migrate deploy && npm run build && npm run start:prod
```
## ERD (Table relations)
![LearnBridge ERD Diagram](./docs/Images/ERD_relasi_database.png)

## Author

- Nama: Kevin Langga
- Program: RevoU Software Engineering (FSSE) 2026
- GitHub: [https://github.com/Kevin12er]
- LinkedIn: [https://www.linkedin.com/in/kevin-langga-a0303a355/]
