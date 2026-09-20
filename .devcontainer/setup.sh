#!/usr/bin/env bash
set -e

K6_VERSION="2.2.0"
echo "Installation de k6 ${K6_VERSION}..."
cd /tmp
curl -sL "https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-amd64.tar.gz" -o k6.tar.gz
tar -xzf k6.tar.gz
sudo mv "k6-v${K6_VERSION}-linux-amd64/k6" /usr/local/bin/k6
sudo chmod +x /usr/local/bin/k6
rm -rf k6.tar.gz "k6-v${K6_VERSION}-linux-amd64"

echo ""
k6 version
echo "Environnement pret."
