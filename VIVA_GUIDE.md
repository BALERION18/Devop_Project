# DevOpsHub — College Viva & Technical Examination Guide

This document is prepared to help you confidently present and defend **DevOpsHub — Deployment & Server Management Dashboard** in your college project viva, seminar, or technical evaluation.

---

## 1. Project Elevator Pitch (30-Second Summary)

> *"DevOpsHub is a production-grade cloud management and deployment dashboard built to solve the visibility gap in modern web operations. It gives engineering teams a single pane of glass to trigger, monitor, and inspect CI/CD deployments and real-time AWS EC2 host telemetry (CPU, RAM, disk, and container runtimes). The project integrates React with Vite, Node.js and Express, MongoDB Atlas, Docker Compose multi-stage containerization, and automated zero-downtime GitHub Actions deployment to AWS EC2."*

---

## 2. Key Architecture Concepts to Highlight

### A. Two-Tier Container Architecture with Nginx Reverse Proxy
- **Why Nginx?**
  - Instead of exposing Node.js directly on port 5000 to the public internet, Nginx acts as an edge reverse proxy on port 80.
  - It handles static asset caching (gzip, max-age headers), SPA fallback routing (`try_files $uri $uri/ /index.html`), and forwards `/api/*` requests internally to `backend:5000` through an isolated Docker bridge network.
  - This ensures that internal backend ports are never accessible directly from the outside world.

### B. Real Host Metric Collection vs. Simulated Data
- Explain how CPU metrics are calculated:
  - You do not use hardcoded or fake random numbers.
  - In Node.js, `os.cpus()` provides the cumulative ticks for user, system, and idle time.
  - The backend maintains a tick snapshot and computes the **delta** between ticks:
    $$\text{CPU Usage \%} = 100 - \left(\frac{\Delta \text{idle ticks}}{\Delta \text{total ticks}} \times 100\right)$$
- Container vs. Host Detection:
  - If the application runs inside Docker on EC2, reading `/proc/mounts` or checking for the presence of `/.dockerenv` or container cgroups determines whether metrics represent the container boundary or host level.

### C. Multi-Stage Docker Builds
- Explain why multi-stage builds are critical:
  1. **Stage 1 (Builder/Dependencies)**: Downloads dev dependencies, compiles JSX/TypeScript, builds Vite bundles.
  2. **Stage 2 (Production Runner)**: Copies only the compiled output (`dist/`) into an Alpine Linux container, discarding compilers and dev modules.
  3. **Result**: Reduces image sizes from 800MB+ down to ~35MB, minimizing attack surfaces and speeding up deployment times.

---

## 3. Top Viva Questions & Model Answers

### Q1: Why did you choose Vite over Create React App (CRA)?
**Answer:**
> *"Create React App is officially deprecated and relies on Webpack, which bundles the entire application before starting the dev server. Vite uses native ES Modules (ESM) in modern browsers powered by Rollup and esbuild. This gives near-instant hot module replacement (sub-500ms), significantly faster production builds, and tree-shaking that produces smaller bundles."*

### Q2: How does your GitHub Actions CI/CD pipeline deploy to EC2 securely?
**Answer:**
> *"The pipeline runs in GitHub-hosted Ubuntu runners through two stages:*
> 1. *CI Stage: Runs automated tests (`npm test` via Jest/Supertest) and validates Vite production builds and Docker Compose configurations.*
> 2. *CD Stage: Connects to the EC2 instance using SSH private key authentication stored securely in GitHub Repository Secrets. It pulls the latest commits, updates `.env` variables securely without printing them to logs, and invokes `docker compose up -d --build` to perform a rolling update.*
> 3. *Post-Deployment Verification: The workflow pings `http://<EC2_IP>/api/health` with retries. If the health probe does not return HTTP 200 within 30 seconds, the pipeline flags an error."*

### Q3: How do you handle database failures or network interruptions?
**Answer:**
> *"We implemented resilient database connection handling in `backend/src/config/db.js`. If MongoDB Atlas is unreachable (for example, if the IP whitelist has not yet allowed the current machine, or during a cold start), the application does not crash. It logs a warning, updates `getDBStatus()` to report degraded status, and enters a graceful in-memory session mode. When credentials are supplied, it connects cleanly without requiring server recompilation."*

### Q4: Why use bcrypt instead of SHA-256 or MD5 for password storage?
**Answer:**
> *"MD5 and SHA-256 are general-purpose cryptographic hash functions designed to be fast. Because they are fast, modern GPUs can compute billions of guesses per second, making them susceptible to rainbow tables and brute-force attacks. Bcrypt is an adaptive key derivation function with an adjustable work factor (salt rounds). We use 10 rounds with a random salt, making brute-force cracking computationally infeasible."*

### Q5: How would you scale this system to support thousands of servers?
**Answer:**
> *"In our future roadmap section, we designed the system to decouple metric polling from HTTP endpoints:*
> 1. *Deploy lightweight Prometheus Node Exporters or OpenTelemetry collectors onto managed nodes.*
> 2. *Configure a centralized Prometheus server to scrape telemetry time-series data.*
> 3. *Have the DevOpsHub backend query Prometheus PromQL APIs or render Grafana dashboards for high-throughput visualization."*

---

## 4. Live Viva Demonstration Script (Step-by-Step)

1. **Step 1: Open the Application**
   - Show the clean login screen at `http://localhost:5173/login`.
   - Point out the Figma/Linear-inspired dark theme, cohesive color tokens (`#09090B`, `#0C0C0F`, `#111114`), and Inter typography.
   - Click **"Explore as Demo Admin (1-Click)"** to show instant access.

2. **Step 2: Overview Dashboard**
   - Highlight the metric cards (Total Deployments, Pipeline Success Rate, Real EC2 CPU, and RAM usage).
   - Show the **EC2 Server Availability** card and explain that the `/api/health` probe continuously validates uptime.

3. **Step 3: Deployment Manager**
   - Click **"Deployment Manager"** in the left sidebar.
   - Show the deployment history table with environment badges, git branches, and commit SHAs.
   - Click the **"Logs"** button on a row to reveal the terminal log viewer modal showing step-by-step build logs.
   - Click **"Trigger Deployment"**, select an environment, and click **"Deploy Now"** to demonstrate real-time pipeline status progression (`in_progress` &rarr; `success`).

4. **Step 4: EC2 Server Status**
   - Click **"Server Status"** in the left sidebar.
   - Show the real-time CPU gauge, RAM allocation, and primary disk usage.
   - Explain the container detection indicator (`Docker Container` vs `Host EC2 System`).
   - Open `/api/health` in a new tab to show the raw JSON response consumed by load balancers.

5. **Step 5: Settings & Code Inspection**
   - Show the Settings page containing the MongoDB Atlas connection guide and the GitHub Actions Secrets checklist.
   - Conclude by showing the automated test suite in terminal: `npm test` passing 100% of test cases.
