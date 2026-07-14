# SimpleLogin

A full-stack login/signup web application built with Spring Boot and vanilla JavaScript, deployed on a free-tier cloud stack.

> Note: This project is unrelated to the email-alias service of the same name.

## LiveDemo

- **Frontend:** https://simplelogin-five.vercel.app
- **Backend API:** https://simplelogin-t22x.onrender.com/api

> The backend is hosted on Render's free tier and may take 30–60 seconds to respond on the first request after a period of inactivity (cold start).

## Features

- User signup with real-time client-side validation
  - Name, email, password
  - Date of birth (must be 18+, no future dates)
  - Phone number (10-digit numeric)
  - Gender (radio selection)
  - Country (dropdown)
  - Terms & conditions acceptance
- Secure login with hashed password verification
- Account dashboard displaying user profile details
- Delete account functionality with confirmation modal
- Passwords hashed with BCrypt — never stored in plain text
- Stateless REST API secured with Spring Security

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java, Spring Boot (Maven), Spring Security, Spring Data JPA |
| Frontend | HTML, CSS, vanilla JavaScript (no framework) |
| Database | PostgreSQL (hosted on Supabase) |
| Backend Hosting | Render (Docker-based deployment) |
| Frontend Hosting | Vercel |

## Project Structure

```
src/main/java/org/example/simplelogin/
├── config/
│   └── SecurityConfig.java         # Spring Security + CORS configuration
├── controller/
│   └── UserController.java         # REST endpoints: signup, login, get user, delete user
├── dto/
│   ├── LoginRequest.java
│   └── SignupRequest.java
├── entity/
│   └── User.java                   # id, name, email, password, dob, phone, gender, country, etc.
├── exception/
│   └── GlobalExceptionHandler.java
├── repository/
│   └── UserRepository.java         # extends JpaRepository
├── service/
│   └── UserService.java            # business logic: register, login, delete, age validation
└── SimpleloginApplication.java

src/main/resources/static/frontend/
├── index.html   + login.js         # Login page
├── signup.html  + signup.js        # Signup page
├── dashboard.html + dashboard.js   # Profile dashboard with delete account
└── style.css                       # Shared design system (Fraunces + Inter fonts)
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/signup` | Register a new user |
| POST | `/api/login` | Authenticate a user |
| GET | `/api/user/{id}` | Fetch a user's profile |
| DELETE | `/api/user/{id}` | Delete a user's account |

## Running Locally

### Prerequisites
- Java 21
- Maven
- A PostgreSQL database (local or a free Supabase project)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/arshad-shaikh81/simplelogin.git
   cd simplelogin
   ```

2. Set the required environment variables (do not hardcode secrets):
   ```
   DB_PASSWORD=your_database_password
   JWT_SECRET=a_long_random_string_at_least_32_characters
   ```

3. Update `application.properties` with your database connection details if not using Supabase.

4. Run the application:
   ```bash
   mvn clean package -DskipTests
   java -jar target/*.jar
   ```

   The backend will start on `http://localhost:8080`.

### Frontend Setup

The frontend is static HTML/CSS/JS with no build step. Open `src/main/resources/static/frontend/index.html` directly in a browser, or serve the folder with any static file server.

> Update the `API_BASE` constant at the top of `login.js`, `signup.js`, and `dashboard.js` to point to your local backend (`http://localhost:8080/api`) when testing locally.

## Deployment

This project is deployed using a three-service free-tier stack:

1. **Database (Supabase):** PostgreSQL instance using the Session Pooler connection mode (required for Hibernate compatibility). Connection pool size is limited via Hikari settings to stay within Supabase's free-tier connection cap.
2. **Backend (Render):** Deployed via a `Dockerfile` (multi-stage build: Maven build stage + slim JRE runtime stage), since Render's native buildpacks do not support Java directly.
3. **Frontend (Vercel):** Deployed with the project root directory set to `src/main/resources/static/frontend`, since the frontend lives in a subfolder of the repository.

CORS is configured in `SecurityConfig.java` to explicitly allow the deployed Vercel domain.

## Known Limitations

- Render's free tier spins down after ~15 minutes of inactivity, causing a cold-start delay on the next request.
- Session handling currently uses `sessionStorage` on the client rather than JWT-based authentication, despite a JWT secret being configured — this is a planned improvement.
- No email verification on signup.

## Future Improvements

- [ ] Implement JWT-based session authentication
- [ ] Add email verification on signup
- [ ] Add password change functionality (from within the dashboard)
- [ ] Add a health-check endpoint + uptime ping to reduce cold starts
- [ ] Add automated tests

## Author

Shaikh Arshad
