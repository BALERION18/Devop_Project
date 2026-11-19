# DevOpsHub — Autonomous Cloud Infrastructure & CI/CD Telemetry Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v22%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose%20v2-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2%20Production-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ec2/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/BALERION18/Devop_Project/actions)

<p align="center">
  <strong>A production-grade, full-stack cloud operations platform delivering actionable AWS EC2 fleet observability, FinOps cost wastage intelligence, automated CI/CD pipeline tracking with terminal build logs, synthetic uptime monitoring, and AI-powered incident self-healing.</strong>
</p>

[🌐 Live Production Dashboard](http://13.232.254.140/) • [🔍 API Health Check](http://13.232.254.140/api/health) • [⚡ 1-Click Demo Login](#-1-click-instant-demo-access) • [🏛️ System Architecture](#-system-architecture--design) • [🛠️ Challenges & Learnings](#-technical-challenges-faced--how-we-overcame-them)

</div>

---

## 🌐 Live Production Deployment

DevOpsHub is containerized and running in a live production environment on **AWS EC2 (Mumbai `ap-south-1`)**:

| Parameter | Production Details |
| :--- | :--- |
| **Live Web Dashboard** | **[http://13.232.254.140/](http://13.232.254.140/)** |
| **API Health Probe** | **[http://13.232.254.140/api/health](http://13.232.254.140/api/health)** |
| **Hosting Cloud Provider** | **Amazon Web Services (AWS)** — EC2 (`t3.micro`) |
| **AWS Region** | `ap-south-1` (Asia Pacific - Mumbai) |
| **Active Host Instance** | `Devops_proj` (`i-06a5adb2fa6d49b70`) |
| **Web Server / Edge Proxy** | Nginx `1.31.8` Reverse Proxy (Dockerized) |
| **Application Runtime** | Node.js `v22.23.4` LTS / Express (Dockerized) |
| **Database Tier** | MongoDB Atlas Cloud Database (`M0 Cluster`) |
| **CI/CD Pipeline** | GitHub Actions (Automated Lint, Test, Vite Build & SSH Rollout) |

### ⚡ 1-Click Instant Demo Access

You can explore all features of the live platform immediately without registration:
1. Open the dashboard at **[http://13.232.254.140/login](http://13.232.254.140/login)**
2. Click the purple button: **"Explore as Demo Admin (1-Click)"**
3. *Or sign in with pre-configured demo credentials:*
   - **Email:** `demo@devopshub.io`
   - **Password:** `password123`

---

## 📌 Problem Statement

Engineering teams and cloud operations professionals face critical visibility and operational bottlenecks:

1. **The DevOps Visibility Gap & Context Switching**:
   - Engineers constantly jump between 5+ browser tabs: AWS EC2 Management Console, CloudWatch Metrics, GitHub Actions deployment runs, MongoDB Atlas metrics, and raw terminal SSH sessions.
   - When a production outage occurs, diagnosing whether the failure stemmed from a bad git commit, high CPU saturation, or an expired container process takes 15–30 minutes of manual correlation.
2. **The "Read-Only" Limitation of Traditional Monitoring (Grafana / CloudWatch)**:
   - Traditional platforms like **Grafana** are passive time-series charting tools. They require heavy Prometheus node exporters, complex manual YAML scrape configurations, and open firewall ports.
   - Most critically, **Grafana cannot take operational action**: if a compute instance hangs or runs out of memory, Grafana can only show an alert graph—it cannot reboot, stop, or self-heal the server.
3. **Silent Cloud Bill Wastage (FinOps)**:
   - In cloud ecosystems, stopped or abandoned EC2 instances continue to incur hundreds of dollars in recurring monthly charges for attached **gp3 EBS storage volumes**.
   - Developers frequently provision high-tier instances (`c5.xlarge`, `m5.large`) for temporary jobs that end up idling at `<2%` CPU utilization, draining budgets unnoticed.
4. **Cloud Security Blind Spots**:
   - Inbound security group rules are frequently misconfigured, inadvertently opening Port 22 (SSH), Port 27017 (MongoDB), or Port 3306 (MySQL) to `0.0.0.0/0` (the entire public internet), exposing fleets to automated brute-force botnets.
5. **Deployment & Rollback Friction**:
   - Junior developers lack terminal access to view build logs or perform immediate 1-click rollbacks when a deployment fails in production.

---

## 💡 The Solution: DevOpsHub

**DevOpsHub** is built as an **Actionable DevOps Autopilot**—a single pane of glass uniting deployment pipelines, cloud fleet operations, cost optimization, security auditing, and automated incident recovery:

- **Actionable Cloud Fleet Management**: Not merely charts—direct **1-Click Reboot, Stop, and Start** controls for AWS EC2 instances with tamper-evident audit logging.
- **30-Second AWS Cloud Auto-Discovery**: Connect any AWS account via read-only IAM keys or launch the **1-Click Instant Demo Sandbox** across any AWS region without requiring custom agents.
- **1-Line Universal Bash Agent**: Add any remote Linux VM or bare-metal VPS in 5 seconds via `curl -sSL ... | bash` (zero dependencies, reads `/proc`, streams heartbeats).
- **FinOps Cloud Cost Wastage Scanner**: Real-time calculation of hourly burn rates and monthly spend ($); automatically identifies **Zombie stopped instances** paying for unused EBS volumes and **idle over-provisioned nodes** (<5% CPU) with exact dollar savings recommendations.
- **Security Group Vulnerability Auditor**: Real-time inspection of firewall rules, flagging open Port 22 (SSH) and exposed database ports with instant risk scoring.
- **AI Root-Cause Incident Diagnoser & Self-Healing**: Automated diagnostics analyze CPU saturation, memory leaks, and status check failures, generating an incident report and a copy-pasteable bash recovery script.
- **CI/CD Pipeline Manager with Terminal Logs**: Live synchronization with GitHub Actions, deployment history, step-by-step build logs viewer, and 1-click rollback.
- **Synthetic Uptime Monitoring**: Multi-endpoint synthetic probes with HTTP latency sparklines and 99.9% availability tracking.
- **Role-Based Access Control (RBAC)**: Multi-tenant workspace isolation with distinct permissions for **Project Leaders** and **Teammates**.

---

## 🏛️ System Architecture & Design

### High-Level System Architecture

```mermaid
graph TD
    User([DevOps Engineer / Developer]) -->|HTTP Port 80| Nginx[Frontend: Nginx 1.31 Edge Reverse Proxy]
    
    subgraph "Dockerized Production Stack (AWS EC2 Host)"
        Nginx -->|Static Assets / SPA Routing| ReactApp[React 18 + Vite SPA Client]
        Nginx -->|Proxy /api/* requests| Express[Backend: Node.js 22 / Express REST API]
        
        Express -->|OS Telemetry Collector| ProcFS[/proc & os.cpus delta sampling]
        Express -->|Docker Socket Probe| DockerRuntime[Docker Engine Container Health]
    end

    subgraph "Cloud & External Integrations"
        Express -->|Mongoose ODM| Atlas[(MongoDB Atlas Cloud DB)]
        Express -->|AWS SDK v3: EC2 & CloudWatch| AWSCloud[AWS Cloud Infrastructure]
        Express -->|Octokit / GitHub REST API v3| GHActions[GitHub Actions CI/CD]
        Express -->|Synthetic HTTP Probes| TargetEndpoints[External APIs & Web Services]
        RemoteNodes[Remote Linux Servers] -->|1-Line Bash Agent Heartbeat| Express
    end

    subgraph "Automated Continuous Deployment"
        GitHubRepo[GitHub Repository] -->|git push origin main| CICDRunner[GitHub Actions Runner]
        CICDRunner -->|Lint, Test & Build| TestStage[Automated Jest & Vite Test Suite]
        TestStage -->|Secure SSH Rollout| DeployScript[AWS EC2 deploy-ec2.sh]
        DeployScript -->|Zero-Downtime Compose Up| Express
        CICDRunner -->|Automated Health Probe| Nginx
    end
```

### Two-Tier Container Architecture (Nginx Reverse Proxy)

DevOpsHub isolates internal microservices behind a hardened **Nginx edge reverse proxy**:
- **Port 80 Ingress**: External HTTP requests hit Nginx, which serves optimized, pre-gzipped Vite static assets (`dist/`) with strict HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
- **Internal Bridge Network (`devopshub-network`)**: Node.js is **never exposed directly to the internet**. Nginx proxies `/api/*` traffic internally to `devopshub-backend:5000`.
- **Public DNS Resolvers**: The backend container is configured with explicit upstream DNS (`8.8.8.8`, `1.1.1.1`) to reliably resolve MongoDB Atlas `+srv` DNS seedlists.

---

## 🚀 Key Features & Modules

### 1. Overview Dashboard
- Welcome banner with live system status and host health indicators.
- High-level metric cards: **Total Deployments**, **Pipeline Success Rate**, **Live EC2 CPU %**, and **Memory Utilization**.
- **Real-Time Host Telemetry**: Instant CPU gauge, RAM allocation, and primary disk usage updated via non-blocking polling.
- Recent deployment activity table with direct drill-down links.

### 2. CI/CD Deployment Manager
- Full deployment history tracking environments (`Production`, `Staging`, `Development`), branches, commit SHAs, author, and duration.
- Real-time status badges: `Success`, `Failed`, `In Progress`, and `Queued`.
- **Terminal Log Viewer**: Interactive modal displaying detailed step-by-step build logs.
- **1-Click Rollback**: Revert any broken deployment to its prior stable release with audit confirmation.
- **Trigger Deployment Modal**: Asynchronously launch pipeline simulations across target environments.

### 3. AWS Fleet & Multi-Cloud Observability
- **Auto-Discovery**: Pulls EC2 instances across any AWS region (Mumbai, N. Virginia, Frankfurt, Singapore, etc.) via AWS SDK v3.
- **1-Click Compute Operations**: Directly **Reboot**, **Stop**, and **Start** instances from the UI.
- **1-Line Universal Bash Agent**: Generate a unique tokenized command (`curl -sSL ... | bash`) to stream real-time metrics from any non-AWS Linux machine.
- Interactive telemetry charts modal displaying real-time metrics history.

### 4. FinOps Cloud Cost Wastage Scanner
- Automatically calculates hourly burn rates and monthly projected spend ($) based on AWS instance types (`t3.micro`, `c5.xlarge`, `m5.large`, etc.).
- **Zombie Stopped Instance Detection**: Detects stopped instances still incurring fees for attached gp3 EBS storage.
- **Oversized Compute Detection**: Identifies instances running at `<4%` CPU utilization and recommends right-sizing to save up to 75% on monthly cloud bills.

### 5. Security Group Vulnerability Auditor
- Inspects AWS Security Group ingress rules in real time.
- Flags critical security risks:
  - **Port 22 (SSH)** open to `0.0.0.0/0` (public internet brute-force risk).
  - **Port 27017 (MongoDB)** or **Port 3306 (MySQL)** exposed publicly.
- Assigns an actionable Security Risk Score (0–100) per node.

### 6. AI Root-Cause & Self-Healing Diagnoser
- Intelligent heuristic engine that analyzes CPU spikes, memory leaks, and CloudWatch status check failures.
- Generates an incident diagnosis report and outputs an **automated self-healing bash script** that engineers can copy-paste to restore service immediately.

### 7. Synthetic Uptime Monitoring
- Configure synthetic uptime probes for external APIs, web apps, and microservices.
- Custom HTTP methods (`GET`, `HEAD`, `POST`) and configurable check intervals (15s, 30s, 60s).
- Live latency sparklines, HTTP status code tracking, and uptime SLA calculations.

### 8. Team Collaboration & RBAC
- Multi-tenant team workspace isolation.
- Role-based permissions:
  - **Project Leader**: Full access to cloud operations, reboot/stop instances, invite members, and configure cloud credentials.
  - **Teammate**: View telemetry, inspect deployment logs, and review system metrics.
- Tamper-evident **Audit Log** tracking all critical operational actions.

---

## ⚔️ DevOpsHub vs Traditional Monitoring (Grafana / CloudWatch)

| Feature / Capability | Traditional Grafana | AWS CloudWatch | DevOpsHub |
| :--- | :---: | :---: | :---: |
| **Setup Time** | Hours (Prometheus, exporters, YAML) | Moderate (AWS Console setup) | **30 Seconds (1-Click or AWS sync)** |
| **Actionable Controls** | ❌ Read-Only (Cannot reboot/stop) | ⚠️ Complex (via SNS/Lambda/CLI) | **✅ 1-Click Reboot, Stop & Start** |
| **FinOps Cost Wastage Detection** | ❌ None (Requires separate plugins) | ⚠️ Raw billing (no idle analysis) | **✅ Flags Zombie EBS & Oversized Nodes** |
| **Security Group Audit** | ❌ None | ⚠️ Fragmented (AWS Inspector/VPC) | **✅ Automatic Port 22/DB Exposure Alerts** |
| **CI/CD Build Logs & Deployments** | ❌ None (Requires separate CI tool) | ⚠️ CloudWatch Logs (fragmented) | **✅ Unified Deployment Manager & Logs** |
| **AI Incident Self-Healing Scripts** | ❌ None | ❌ None | **✅ Root-cause diagnosis & copyable bash scripts** |
| **Agentless Telemetry** | ❌ Requires `node_exporter` binary | ⚠️ Requires CloudWatch Agent | **✅ Zero-dep 1-Line Curl or CloudWatch SDK** |
| **Unified Single Pane of Glass** | ❌ Metrics only | ❌ AWS services only | **✅ Full-Stack (Code + Infra + FinOps + Sec)** |

---

## 🛠️ Technical Challenges Faced & How We Overcame Them

During the architecture, containerization, and production rollout of DevOpsHub, several complex engineering challenges were encountered and solved:

### Challenge 1: MongoDB Atlas SRV DNS Resolution Failure inside Docker Containers
- **The Problem:** When running the application inside Docker containers on AWS EC2, the backend failed to connect to MongoDB Atlas with the error `querySrv ENOTFOUND _mongodb._tcp.devops.fub48fi.mongodb.net`. The internal Docker bridge DNS resolver (`127.0.0.11`) failed to properly resolve SRV records from cloud DNS providers.
- **The Solution:** Added explicit public upstream DNS resolvers to `docker-compose.yml` for the backend service:
  ```yaml
  backend:
    dns:
      - 8.8.8.8
      - 1.1.1.1
  ```
  This allowed the container's resolver to query Google and Cloudflare DNS directly, instantly resolving the MongoDB Atlas SRV connection string without impacting host network settings.

---

### Challenge 2: Nginx Reverse Proxy Rate Limiting & Client IP Masking
- **The Problem:** In production, all incoming traffic flows through the Nginx reverse proxy before reaching the Express API. As a result, Express saw `req.ip` as the internal Docker network gateway IP (`172.x.x.x`) for all users. Consequently, the `express-rate-limit` middleware treated all worldwide users as a single client, causing false-positive HTTP 429 "Too Many Requests" blocks during testing.
- **The Solution:** 
  1. Configured Nginx reverse proxy headers in `frontend/nginx.conf`:
     ```nginx
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     ```
  2. Enabled trust proxy in `backend/src/app.js`:
     ```javascript
     app.set('trust proxy', 1);
     ```
  This enabled Express to accurately resolve the real client IP address from the `X-Forwarded-For` header while preserving brute-force protection.

---

### Challenge 3: Accurate Real-Time Host CPU Utilization without Heavy Agents
- **The Problem:** Standard Node.js `os.loadavg()` only gives 1, 5, and 15-minute load averages—not current instantaneous CPU percentage. Furthermore, `os.cpus()` only reports cumulative CPU tick counters since machine boot, meaning a static snapshot yields incorrect numbers.
- **The Solution:** Implemented a high-precision tick delta algorithm in `backend/src/services/systemMetricService.js`:
  - Recorded a baseline tick snapshot of user, nice, sys, idle, and irq times.
  - Calculated the mathematical delta between consecutive ticks:
    $$\text{CPU Usage \%} = 100 - \left(\frac{\Delta \text{idle ticks}}{\Delta \text{total ticks}} \times 100\right)$$
  - Added cgroup detection to accurately distinguish whether metrics originate from inside a Docker container boundary or the root EC2 host system.

---

### Challenge 4: Docker Container Name Collisions during Automated Rollouts
- **The Problem:** During automated GitHub Actions CI/CD deployments to EC2, running `docker compose up -d --build` occasionally halted with an error indicating container names (`devopshub-backend`, `devopshub-frontend`) were already in use by stopped or orphaned containers.
- **The Solution:** Engineered a fail-safe container cleanup sequence in `deploy-ec2.sh` and the GitHub Actions deployment workflow:
  ```bash
  sudo docker rm -f devopshub-backend devopshub-frontend 2>/dev/null || true
  sudo docker compose down --remove-orphans 2>/dev/null || true
  sudo docker compose up --build -d
  ```
  This guarantees clean, idempotent deployments without manual SSH intervention.

---

### Challenge 5: Cold-Start Database Graceful Fallback Mode
- **The Problem:** In automated demo environments or during MongoDB Atlas cold-starts, if the database connection was delayed or temporarily blocked by IP access list restrictions, the backend would crash on startup due to unhandled connection timeouts.
- **The Solution:** Designed a dual-mode database architecture in `backend/src/config/db.js` and `serverFleetController.js`. If MongoDB Atlas is connecting or unreachable, the server gracefully boots in **In-Memory Sandbox Mode** with synthetic demo telemetry. As soon as database connectivity is established, it switches seamlessly to MongoDB Atlas persistence without requiring server restart or recompilation.

---

### Challenge 6: Multi-Stage Docker Image Optimization
- **The Problem:** Early Docker builds copied complete development dependencies (`node_modules`), build tools, and source files into production containers, inflating image sizes to over 800 MB each and causing slow deployment transfers on EC2 `t3.micro`.
- **The Solution:** Built multi-stage Dockerfiles for both frontend and backend:
  - **Frontend:** Stage 1 uses Node.js 22 to compile the Vite production bundle; Stage 2 copies only the minified static `dist/` directory into a lightweight Alpine Nginx container (~30 MB).
  - **Backend:** Stage 1 installs production dependencies with `npm ci --omit=dev`; Stage 2 executes under a non-root user on Alpine Linux (~90 MB).
  This reduced total container bundle sizes by over **85%** and drastically minimized attack surfaces.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **React 18.3**, **Vite 5.4**, **React Router v6** |
| **UI & Styling** | Custom Figma/Linear Dark Theme System (`#09090B`), **Lucide React** Iconography |
| **Backend API** | **Node.js 22 LTS**, **Express 4.21**, ES Modules (`type: module`) |
| **Database & ODM** | **MongoDB Atlas** (Cloud M0 Cluster), **Mongoose 8.9** |
| **Authentication & Security** | **JWT (JSON Web Tokens)**, **bcryptjs** (10 salt rounds), **Helmet**, **express-rate-limit** |
| **Cloud & Infrastructure** | **AWS EC2** (`t3.micro`), **AWS CloudWatch**, **AWS SDK v3** (`@aws-sdk/client-ec2`, `@aws-sdk/client-cloudwatch`) |
| **Containerization & Web Server** | **Docker Engine**, **Docker Compose v2**, **Nginx 1.31** (Reverse Proxy & Static Cache) |
| **CI / CD Pipeline** | **GitHub Actions** (Automated Jest Tests, Vite Build, Docker Build & SSH Rollout) |
| **Testing Suite** | **Jest 29**, **Supertest 7** (Automated API endpoint validation) |

---

## 📁 Project Structure

```text
devopshub/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD Pipeline (Test, Build & EC2 Deploy)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # Resilient MongoDB Atlas connection & fallback
│   │   │   └── env.js            # Centralized environment variable loader
│   │   ├── controllers/
│   │   │   ├── authController.js        # JWT signup, login, demo access & RBAC
│   │   │   ├── dashboardController.js   # Aggregated summary & KPI metrics
│   │   │   ├── deploymentController.js  # CI/CD deployments, build logs & rollback
│   │   │   ├── integrationController.js # Multi-cloud DB & S3 connector tests
│   │   │   ├── serverController.js      # Host CPU/RAM telemetry & health check
│   │   │   ├── serverFleetController.js # AWS fleet discovery, FinOps & AI diagnostics
│   │   │   ├── teamController.js        # Workspace team members & audit logging
│   │   │   └── uptimeController.js      # Synthetic HTTP uptime probes
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js        # Bearer token verification & Leader RBAC
│   │   │   ├── errorMiddleware.js       # Centralized 404 & error handling
│   │   │   └── rateLimiter.js           # Express rate limiting
│   │   ├── models/
│   │   │   ├── AuditLog.js              # Operational audit trail schema
│   │   │   ├── Deployment.js            # CI/CD deployment history schema
│   │   │   ├── ServerMetric.js          # Historical telemetry schema
│   │   │   ├── ServerNode.js            # Fleet node & AWS EC2 instance schema
│   │   │   ├── UptimeMonitor.js         # Synthetic uptime probe schema
│   │   │   └── User.js                  # User credentials & role schema
│   │   ├── routes/                      # REST API route modules
│   │   ├── services/
│   │   │   ├── awsFleetService.js       # AWS SDK v3 EC2/CloudWatch sync & FinOps
│   │   │   ├── githubService.js         # GitHub REST API v3 pipeline sync
│   │   │   └── systemMetricService.js   # Precise CPU tick-delta & RAM collector
│   │   ├── app.js                       # Express application configuration
│   │   └── server.js                    # HTTP server entry point
│   ├── tests/
│   │   └── api.test.js                  # Automated Jest & Supertest test suite
│   ├── Dockerfile                       # Multi-stage production backend container
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                  # Header, Sidebar, MetricCard, StatusBadge
│   │   ├── context/                     # AuthContext & NotificationContext
│   │   ├── layouts/                     # DashboardLayout (Responsive navigation)
│   │   ├── pages/
│   │   │   ├── Overview.jsx             # System KPI summary & host telemetry
│   │   │   ├── Deployments.jsx          # CI/CD history, terminal logs & rollback
│   │   │   ├── Servers.jsx              # AWS fleet manager, FinOps & AI diagnostics
│   │   │   ├── ServerStatus.jsx         # Deep-dive host hardware telemetry
│   │   │   ├── UptimeMonitors.jsx       # Synthetic uptime probes & sparklines
│   │   │   ├── Team.jsx                 # RBAC member management & audit logs
│   │   │   ├── Settings.jsx             # Multi-cloud DB/S3 connectors & secrets
│   │   │   ├── Login.jsx                # Figma dark login & 1-click demo access
│   │   │   └── Signup.jsx               # User onboarding
│   │   ├── services/
│   │   │   └── api.js                   # Axios HTTP client with interceptors
│   │   ├── styles/
│   │   │   └── index.css                # Figma/Linear black SaaS design system
│   │   ├── App.jsx                      # Route routing & protected paths
│   │   └── main.jsx                     # React DOM entry
│   ├── nginx.conf                       # Hardened Nginx reverse proxy configuration
│   ├── Dockerfile                       # Multi-stage Nginx + Vite production container
│   └── package.json
├── deploy-ec2.sh                        # 1-Click automated production setup script
├── docker-compose.yml                   # Isolated bridge network container orchestration
├── .env.example                         # Environment configuration template
└── README.md
```

---

## ⚡ Local Development & Setup

### Prerequisites
- **Node.js** `v20.x` or `v22.x LTS`
- **npm** `v10+`
- **Docker & Docker Compose** *(optional, for container runs)*
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/BALERION18/Devop_Project.git
cd Devop_Project
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
*(Leave MongoDB URI empty to run in zero-configuration local demo mode, or supply your MongoDB Atlas connection string).*

### 3. Run with Docker Compose (Recommended)
Launch the entire containerized production stack with a single command:
```bash
# Build and start all services in detached mode
docker compose up --build -d

# Verify container health
docker compose ps

# View live application logs
docker compose logs -f
```
Open your browser and navigate to **`http://localhost:80/`**.

---

### 4. Running Natively (Without Docker)

#### Run Backend API:
```bash
cd backend
npm install
npm test            # Run automated test suite
npm run dev         # Starts API on http://localhost:5000
```

#### Run Frontend Client:
In a separate terminal:
```bash
cd frontend
npm install
npm run dev         # Starts Vite dev server on http://localhost:5173
```
Visit **`http://localhost:5173/`** in your browser.

---

## ☁️ Production AWS EC2 Deployment Guide

DevOpsHub includes a zero-friction, automated 1-click deployment script designed for **Ubuntu 22.04 / 24.04 LTS** on AWS EC2.

### 1. Launch AWS EC2 Instance
- **Instance Type:** `t3.micro` or `t3.small` (Eligible for AWS Free Tier).
- **OS:** Ubuntu Server 22.04 or 24.04 LTS.
- **Inbound Security Group Rules:**
  - `SSH (Port 22)`: Your personal IP address.
  - `HTTP (Port 80)`: `0.0.0.0/0` (Public web traffic).
  - `HTTPS (Port 443)`: `0.0.0.0/0` (SSL/TLS).

### 2. Run 1-Click Rollout Script on EC2
Connect to your EC2 instance via SSH and run:
```bash
curl -fsSL https://raw.githubusercontent.com/BALERION18/Devop_Project/main/deploy-ec2.sh | bash
```
The script will automatically:
1. Install Docker Engine and the Docker Compose plugin.
2. Clone/update the latest codebase from GitHub.
3. Generate a secure, production-grade `.env` with a random cryptographic JWT secret.
4. Build and start multi-stage containers with Docker Compose.
5. Verify health checks and output your public dashboard URL.

### 3. Automated GitHub Actions CI/CD Secrets
To enable automated deployments on every `git push origin main`, add the following secrets in your GitHub repository (**Settings &rarr; Secrets and variables &rarr; Actions**):

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `EC2_HOST` | Public IPv4 address of your EC2 instance | `13.232.254.140` |
| `EC2_USER` | SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key contents (`.pem`) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `MONGODB_URI` | MongoDB Atlas Cloud Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/devopshub` |
| `JWT_SECRET` | 32+ character random cryptographic secret | `super_secure_jwt_secret_production_key` |

Whenever you push to the `main` branch, GitHub Actions executes tests, builds the Vite production bundle, SSHs into EC2, performs a zero-downtime rolling reload, and runs an automated health check probe!

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Public | Public health check probe for load balancers |
| `POST` | `/api/auth/signup` | Public | Register new project Leader account |
| `POST` | `/api/auth/login` | Public | Authenticate user & retrieve JWT token |
| `GET` | `/api/auth/me` | Bearer | Get authenticated user profile and role |
| `GET` | `/api/dashboard/summary` | Bearer | Aggregated KPIs (deployments, success rate, server load) |
| `GET` | `/api/deployments` | Bearer | List deployment history with environment filters |
| `POST` | `/api/deployments/trigger` | Bearer | Trigger new deployment simulation |
| `POST` | `/api/deployments/:id/rollback` | Bearer | Roll back to specified prior deployment |
| `GET` | `/api/server/status` | Bearer | Real-time host hardware telemetry (CPU, RAM, disk) |
| `GET` | `/api/fleet` | Bearer | Retrieve AWS fleet, FinOps wastage, and security risks |
| `POST` | `/api/fleet/aws/sync` | Bearer | Auto-discover EC2 instances via IAM keys or Sandbox |
| `POST` | `/api/fleet/aws/action` | Leader | Perform 1-click EC2 action (`reboot`, `stop`, `start`) |
| `GET` | `/api/fleet/agent/token` | Bearer | Generate tokenized 1-line bash agent command |
| `POST` | `/api/fleet/agent/heartbeat` | Token | Receive live telemetry stream from remote Linux agent |
| `GET` | `/api/fleet/diagnose/:instanceId`| Bearer | AI incident root-cause diagnosis & self-healing script |
| `GET` | `/api/monitors` | Bearer | List synthetic uptime probes and response sparklines |
| `POST` | `/api/monitors` | Bearer | Register new synthetic uptime probe |
| `GET` | `/api/team/members` | Bearer | List team workspace members and permissions |
| `POST` | `/api/team/invite` | Leader | Invite new teammate to current workspace |
| `GET` | `/api/team/logs` | Bearer | Retrieve tamper-evident operational audit logs |

---

## 🗺️ Future Roadmap & Extensibility

- [ ] **Native Prometheus & Grafana Exporter**: Attach `prom-client` to expose `/metrics` with custom counters for Prometheus scraping.
- [ ] **Kubernetes (K8s) Cluster Pod Telemetry**: Extend the fleet dashboard to monitor K8s pods, deployments, and node resource quotas.
- [ ] **Slack & Discord Webhook Alerts**: Instant notification delivery when an EC2 instance stops or an uptime probe fails.
- [ ] **SSL / Let's Encrypt Automated Provisioning**: Automatic Certbot HTTPS certificate generation inside Nginx.

---

## 📄 License & Credits

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it for academic, personal, or commercial purposes.

**Developed with ❤️ by the DevOpsHub Team**  
GitHub: [@BALERION18](https://github.com/BALERION18)

