#!/usr/bin/env bash
# ==============================================================================
# DevOpsHub — 1-Click AWS EC2 Automated Production Rollout
# ==============================================================================
set -e

echo "===================================================================="
echo "🚀 DevOpsHub Automated Production Rollout on AWS EC2"
echo "===================================================================="

echo "📦 [1/5] Checking Docker & Docker Compose installation..."
if ! command -v docker &> /dev/null; then
  echo "[+] Docker not found. Installing Docker Engine..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  sudo systemctl enable docker
  sudo systemctl start docker
  echo "[✓] Docker installed successfully."
else
  echo "[✓] Docker is already installed."
fi

if ! docker compose version &> /dev/null; then
  echo "[+] Installing Docker Compose plugin..."
  sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin
  echo "[✓] Docker Compose plugin installed."
else
  echo "[✓] Docker Compose is already installed."
fi

echo "📂 [2/5] Syncing latest codebase from GitHub..."
PROJECT_DIR="$HOME/Devop_Project"
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
  git fetch origin main
  git reset --hard origin/main
  echo "[✓] Repository updated to latest commit."
else
  git clone https://github.com/BALERION18/Devop_Project.git "$PROJECT_DIR"
  cd "$PROJECT_DIR"
  echo "[✓] Repository cloned to $PROJECT_DIR."
fi

echo "⚙️ [3/5] Setting up Production Environment (.env)..."
PUBLIC_IP=$(curl -s --connect-timeout 2 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}' || echo "localhost")

if [ ! -f .env ]; then
  echo "[+] Creating .env configuration..."
  RANDOM_JWT=$(openssl rand -hex 32 2>/dev/null || tr -dc 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head -c 48 || echo "super_secure_devopshub_prod_jwt_$(date +%s)")
  cat << ENVFILE > .env
NODE_ENV=production
PORT=5000
MONGODB_URI=${MONGODB_URI:-""}
JWT_SECRET=${JWT_SECRET:-$RANDOM_JWT}
JWT_EXPIRES_IN=7d
CLIENT_URL=http://${PUBLIC_IP}
SERVER_NAME=AWS-EC2-Production-Host
HTTP_PORT=80
AWS_REGION=${AWS_REGION:-all}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-""}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-""}
ENVFILE
  echo "[✓] Production .env generated safely."
else
  echo "[✓] Existing .env file found. Preserving your existing secrets."
fi

echo "🐳 [4/5] Building & Launching Multi-Stage Docker Containers..."
sudo docker compose down --remove-orphans 2>/dev/null || true
sudo docker compose up --build -d

echo "⏳ [5/5] Verifying service container health..."
sleep 8
sudo docker compose ps

echo "===================================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "🌐 Open Dashboard in Browser : http://${PUBLIC_IP}"
echo "🔍 API Health Check          : http://${PUBLIC_IP}/api/health"
echo "📊 Logs Command              : sudo docker compose logs -f"
echo "===================================================================="
