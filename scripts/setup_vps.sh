#!/bin/bash

# BillSoft VPS Setup Script
# Ubuntu/Debian compatible

echo "--------------------------------------------------------"
echo "🛠️  Starting VPS Environment Setup..."
echo "--------------------------------------------------------"

# 1. Update & Basic Utilities
echo "🔄 Updating system packages..."
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common git jq sqlite3 nginx certbot python3-certbot-nginx ufw

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
else
    echo "✅ Docker already installed."
fi

# 3. Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐙 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed."
fi

# 4. Firewall Configuration
echo "🛡️  Configuring Firewall (UFW)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5001/tcp
sudo ufw allow 3002/tcp
sudo ufw --force enable

# 5. Nginx Health Check
echo "🌐 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "--------------------------------------------------------"
echo "🎉 VPS Setup Complete!"
echo "Next Steps:"
echo "1. Clone your repository"
echo "2. Copy nginx/billsoft.conf to /etc/nginx/sites-available/"
echo "3. Run 'sudo ln -s /etc/nginx/sites-available/billsoft.conf /etc/nginx/sites-enabled/'"
echo "4. Run 'sudo certbot --nginx' for SSL"
echo "--------------------------------------------------------"
