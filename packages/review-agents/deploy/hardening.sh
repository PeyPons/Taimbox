#!/bin/bash
# Ejecutar en ia-srv como root — cierra Ollama público y deja solo localhost
set -euo pipefail

mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/environment.conf <<'EOF'
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
EOF

systemctl daemon-reload
systemctl restart ollama

ufw delete allow 11434/tcp 2>/dev/null || true
ufw delete allow 11434/tcp 2>/dev/null || true

echo "Ollama restringido a 127.0.0.1:11434"
