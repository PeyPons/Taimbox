#!/usr/bin/env python3
"""Repara docker-compose.yml: bloque environment del servicio functions."""
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/alex/supabase-pi/supabase/docker/docker-compose.yml")
text = path.read_text(encoding="utf-8")

broken = "CHECKOUT_BASE_URL:\n    command:"
fixed = (
    "      CHECKOUT_BASE_URL: ${CHECKOUT_BASE_URL}\n"
    "      REGISTRATION_NOTIFY_EMAIL: ${REGISTRATION_NOTIFY_EMAIL}\n"
    "    command:"
)

if broken in text:
    text = text.replace(broken, fixed)
    path.write_text(text, encoding="utf-8")
    print("Reparado bloque roto CHECKOUT_BASE_URL")
elif "CHECKOUT_BASE_URL: ${CHECKOUT_BASE_URL}" in text:
    print("Compose ya OK")
else:
    needle = "      STRIPE_PRICE_ID_BUSINESS: ${STRIPE_PRICE_ID_BUSINESS}\n"
    insert = (
        needle
        + "      CHECKOUT_BASE_URL: ${CHECKOUT_BASE_URL}\n"
        + "      REGISTRATION_NOTIFY_EMAIL: ${REGISTRATION_NOTIFY_EMAIL}\n"
    )
    if needle in text:
        text = text.replace(needle, insert, 1)
        path.write_text(text, encoding="utf-8")
        print("Añadidas variables CHECKOUT y REGISTRATION")
    else:
        print("No se encontró punto de inserción", file=sys.stderr)
        sys.exit(1)
