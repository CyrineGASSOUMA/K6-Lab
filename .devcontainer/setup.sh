#!/usr/bin/env bash
set -e

echo "Installation de k6..."
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update -qq
sudo apt-get install -y k6

echo "Installation de Chromium pour le module navigateur..."
sudo apt-get install -y chromium fonts-liberation libnss3 libatk-bridge2.0-0 libgbm1 || true

echo ""
echo "======================================="
k6 version
echo "Environnement pret."
echo "======================================="
