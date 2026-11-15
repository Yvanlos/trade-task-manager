# Trade Task Manager

[![Trade Task Manager CI/CD Pipeline](https://github.com)](https://github.com)
![Java](https://shields.io)
![Spring Boot](https://shields.io)
![PostgreSQL](https://shields.io)
![Docker](https://shields.io)

Full-Stack Trade Task Management application built with **Java 21**, **Spring Boot**, and **PostgreSQL**, featuring an automated multi-layer test suite (**API & Native SQL Integration Tests**, **Cypress E2E**, **Apache JMeter Load Tests**) and a **GitHub Actions CI/CD** pipeline.

---

## Tech Stack

- **Backend:** Java 21, Spring Boot (WebMVC, Data JPA, JDBC)
- **Database:** PostgreSQL 16 (with persistent Docker volumes & native PostgreSQL queries)
- **Frontend:** HTML5, CSS3, JavaScript (REST API integration)
- **Testing & QA:**
    - **Integration & SQL Tests:** JUnit 5, `TestRestTemplate`, `JdbcTemplate` (direct PostgreSQL white-box validation)
    - **E2E UI Tests:** Cypress
    - **Performance & Load Tests:** Apache JMeter (Non-GUI CLI execution & HTML reporting)
- **DevOps & CI/CD:** Docker, Docker Compose, GitHub Actions

---

## REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tasks` | Retrieve all trade tasks |
| `GET` | `/api/tasks/search?keyword=...` | Case-insensitive title search via native PostgreSQL `ILIKE` |
| `GET` | `/api/tasks/stats` | Aggregated task counts grouped by status (`GROUP BY`) |
| `POST` | `/api/tasks` | Create a new trade task |
| `PUT` | `/api/tasks/{id}` | Update an existing trade task |
| `DELETE` | `/api/tasks/{id}` | Delete a trade task by ID |

---

## Getting Started (Local Setup)

### Prerequisites
- Java 21 (JDK)
- Docker & Docker Compose

### 1. Start PostgreSQL Database
Start the containerized PostgreSQL instance in the background:
```bash
docker compose up -d
```

### 2. Run the Application
Start the Spring Boot backend and web UI via Maven:
```bash
./mvnw spring-boot:run
```
The application is now accessible at `http://localhost:8080`.

---

## Automated Testing

### 1. API & PostgreSQL SQL Integration Tests
Validates the full CRUD lifecycle over HTTP (`POST`, `PUT`, `DELETE`) and verifies database state directly in PostgreSQL using raw SQL via `JdbcTemplate`:
```bash
./mvnw test
```

### 2. Apache JMeter API Load Tests (via Docker)
Runs concurrent CRUD threads against the live API and generates an HTML performance dashboard under `target/jmeter-report/index.html`:
```bash
docker compose run --rm jmeter
```

### 3. Cypress End-to-End Tests
```bash
npx cypress run
```

---

## CI/CD Pipeline (GitHub Actions)

Every `push` or `pull_request` triggers the automated workflow in `.github/workflows/ci.yml`:
1. Spins up a `postgres:16-alpine` service container with health checks.
2. Builds the application with Java 21 and executes JUnit + PostgreSQL SQL integration tests.
3. Starts the Spring Boot server in the background and verifies health readiness.
4. Executes Cypress E2E tests and Apache JMeter load tests (`0%` error threshold).
5. Publishes the generated **JMeter HTML Performance Report** as a downloadable workflow artifact.
