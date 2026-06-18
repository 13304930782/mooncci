#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/www/wwwroot/mooncci-source"
SITE_ROOT="/www/wwwroot/mooncci.site"
SETTINGS_TMP="/tmp/mooncci-site-settings.json"

cd "$PROJECT_ROOT"

echo "1/5 Fetching latest site settings..."
curl -fsS "https://mooncci.site/api/settings/site" -o "$SETTINGS_TMP"

echo "2/5 Generating src/app/config/initialSiteSettings.ts..."
mkdir -p src/app/config
node - <<'NODE'
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/tmp/mooncci-site-settings.json', 'utf8'));
const content = `export const initialSiteSettings = ${JSON.stringify(data, null, 2)} as const;\n`;

fs.writeFileSync('src/app/config/initialSiteSettings.ts', content);
NODE

echo "3/5 Generating public/robots.txt and public/sitemap.xml..."
node scripts/rebuild-seo.mjs

echo "4/5 Building frontend..."
npm run build

echo "5/5 Deploying dist to site root..."
cp "$SITE_ROOT/index.html" "$SITE_ROOT/index.html.bak_$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
mkdir -p "$SITE_ROOT/assets"
/bin/cp -f dist/index.html "$SITE_ROOT/index.html"
/bin/cp -af dist/assets/. "$SITE_ROOT/assets/"
/bin/cp -f dist/robots.txt "$SITE_ROOT/robots.txt" 2>/dev/null || true
/bin/cp -f dist/sitemap.xml "$SITE_ROOT/sitemap.xml" 2>/dev/null || true

echo "Done. Site settings, SEO files, and frontend assets are deployed. PM2 restart is not required."
