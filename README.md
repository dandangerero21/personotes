# PersoNotes

A minimalist, privacy-focused personal knowledge vault backed by a stateless Spring Boot JWT backend and a responsive React frontend.

![Java](https://img.shields.io/badge/Java-17+-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)

---

## Features

- **Stateless JWT Authentication:** HMAC-SHA256 signed bearer tokens with automatic expiration handling.
- **IDOR Protection:** Strict user scoping ensures users can only read, update, or delete notes tied to their authenticated session (`SecurityContextHolder`).
- **Interactive Visual Layer:** Custom WebGL volumetric light rays (`ogl`), mouse-following canvas particle grids, and smooth state cross-fades.
- **Instant Workspace:** Real-time client-side search filtering, modal note creation/editor, and deletion.
- **Dark Theme:** Curated dark palette, custom scrollbars, and `Outfit` + `Inter` typography.

---

## Tech Stack

### Backend
- **Framework:** Spring Boot 3
- **Security:** Spring Security (Stateless `SessionCreationPolicy.STATELESS`)
- **Authentication:** `jjwt` (Java JWT API & Implementation)
- **Persistence:** Spring Data JPA + Hibernate
- **Database:** H2 In-Memory Database / MySQL
- **Build Tool:** Maven

### Frontend
- **Core:** React 19 + TypeScript + Vite
- **Routing:** React Router v7 (`react-router-dom`)
- **Graphics & Shaders:** WebGL via `ogl` & HTML5 2D Canvas
- **Styling:** Vanilla CSS (Glassmorphism, CSS Variables, Responsive Grid)

---

## Project Structure

```text
PersoNotes/
├── backend/
│   ├── src/main/java/com/example/personotes/
│   │   ├── auth/          # JWT Service & Authentication Filters
│   │   ├── controllers/   # REST Controllers (NoteController, UserController)
│   │   ├── dtos/          # Request & Response DTOs
│   │   ├── models/        # JPA Entities (User, Note)
│   │   ├── repositories/  # Spring Data JPA Repositories
│   │   └── services/      # Business Logic & Security Configuration
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/
    ├── src/
    │   ├── components/    # Background Shaders & Particle Canvases
    │   ├── includes/      # Headers & Navigation Elements
    │   ├── styles/        # Global Tokens, Dark Themes & Component Styles
    │   ├── index.tsx      # Landing Page
    │   ├── login.tsx      # Sign In Page
    │   ├── register.tsx   # Sign Up Page
    │   └── dashboard.tsx  # Interactive Notes Workspace
    └── package.json
```

---

## Getting Started

### Prerequisites
- JDK 17+
- Node.js 18+ & npm
- Git

---

### 1. Clone the Repository
```bash
git clone https://github.com/dandangerero21/personotes.git
cd personotes
```

---

### 2. Run the Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
The REST API will start on `http://localhost:8080`.  
*(Optional: Access H2 console at `http://localhost:8080/h2-console` with JDBC URL `jdbc:h2:mem:personotesdb`)*

---

### 3. Run the Frontend (React + Vite)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## REST API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/users/register` | Register a new user account | No |
| `POST` | `/users/login` | Authenticate user & return JWT token | No |

### Notes
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/notes/get` | Fetch all notes for authenticated user | Yes (Bearer Token) |
| `GET` | `/notes/get-by-title` | Search notes by title query | Yes (Bearer Token) |
| `GET` | `/notes/get-by-content` | Search notes by content query | Yes (Bearer Token) |
| `POST` | `/notes/create` | Create a new note | Yes (Bearer Token) |
| `PUT` | `/notes/update/{id}` | Update an existing note | Yes (Bearer Token) |
| `DELETE` | `/notes/{id}` | Delete a note by ID | Yes (Bearer Token) |

---

## Author

**Dandan**  
GitHub: [@dandangerero21](https://github.com/dandangerero21)
