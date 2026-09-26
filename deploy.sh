#!/bin/bash
set -e

echo "🚀 Starting BMG Deployment to Hostinger..."

# 1. Enter project root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 2. Put application into maintenance mode (optional, graceful)
# php artisan down --retry=60 || true

# 3. Pull latest code from Git branch
echo "📥 Pulling latest git changes..."
git pull origin develop

# 4. Install PHP dependencies
echo "📦 Installing composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 5. Build frontend assets
if command -v npm &> /dev/null; then
    echo "⚡ Building frontend assets..."
    npm install --no-audit
    npm run build
fi

# 6. Database Migrations
echo "🗄️ Running migrations..."
php artisan migrate --force

# 7. Clear & Optimize Caches
echo "🧹 Optimizing Laravel configuration and routes..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Create storage link if not exists
php artisan storage:link || true

# 9. Bring application back up
# php artisan up || true

echo "✅ BMG Deployment Completed Successfully!"
