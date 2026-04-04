#!/bin/bash

# Configuration - use relative paths!
MAINTENANCE_COMPOSE="docker-compose.maintenance.yml"

# Helper function to find and run docker-compose or docker compose
run_docker() {
    if command -v docker-compose &> /dev/null; then
        sudo docker-compose "$@"
    else
        sudo docker compose "$@"
    fi
}

echo "--------------------------------------------------------"
echo "🚀 Starting Deployment with Maintenance Mode..."
echo "--------------------------------------------------------"

# 0. Backup Database (Safety First)
BACKUP_DIR="./backups"
CONTAINER_NAME="billsoft-backend"
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi
DATE_STR=$(date +%Y%m%d_%H%M%S)
if sudo docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$CONTAINER_NAME"; then
    echo "🛡️  Backing up database from running container to $BACKUP_DIR/billsoft_$DATE_STR.db..."
    sudo docker exec "$CONTAINER_NAME" sqlite3 /app/data/billsoft.db ".backup '/app/data/billsoft_snapshot.db'" 2>/dev/null
    sudo docker cp "$CONTAINER_NAME":/app/data/billsoft_snapshot.db "$BACKUP_DIR/billsoft_$DATE_STR.db" 2>/dev/null
    sudo docker exec "$CONTAINER_NAME" rm /app/data/billsoft_snapshot.db 2>/dev/null
    # Keep last 10
    ls -t "$BACKUP_DIR"/billsoft_*.db | tail -n +11 | xargs -r rm -- 2>/dev/null
fi

# 1. Stop current system
echo "🛑 Stopping current system..."
run_docker down --remove-orphans

# 2. Start Maintenance Container
if [ -f "$MAINTENANCE_COMPOSE" ]; then
    echo "🛠️  Switching to Maintenance Page..."
    run_docker -f "$MAINTENANCE_COMPOSE" up -d
else
    echo "⚠️  Note: $MAINTENANCE_COMPOSE not found (skipping maintenance page)"
fi

# 3. Pull latest code
echo "📦 Updating code..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch detected: $CURRENT_BRANCH"
sudo git fetch origin $CURRENT_BRANCH
sudo git reset --hard origin/$CURRENT_BRANCH
sudo chown -R $USER:$USER $(pwd)

# (Optional) Ensure the schema.prisma has the Int fix
echo "🏗️  Rebuilding containers (WITHOUT CACHE)..."
run_docker build --no-cache --pull

# 4. Switch back to Live
if [ -f "$MAINTENANCE_COMPOSE" ]; then
    echo "✅ Maintenance finished. Switching to new version..."
    run_docker -f "$MAINTENANCE_COMPOSE" down
fi

# Try to start the app
if run_docker up -d; then
    echo "--------------------------------------------------------"
    echo "🎉 Update complete! Check status: sudo docker ps"
    echo "--------------------------------------------------------"
else
    echo "❌ ERROR: Backend failed to start. View logs below:"
    sudo docker logs --tail 50 billsoft-backend
    echo "--------------------------------------------------------"
    echo "⚠️  Deployment failed! Check the errors above."
fi
