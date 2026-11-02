#!/usr/bin/env bash
echo "========================================================="
echo "  🌴 Project Isle: 3D Tropical Island Survival Engine 🌴"
echo "========================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[HIBA] Node.js nem található. Kérlek telepítsd: https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] Függőségek telepítése (npm install)..."
    npm install
fi

echo "[INFO] Szerver indítása..."
if which xdg-open > /dev/null; then
    xdg-open "http://localhost:3000" &
elif which open > /dev/null; then
    open "http://localhost:3000" &
fi

npm run dev
