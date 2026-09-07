#!/usr/bin/env bash
# Creates a Play upload keystore locally. Never commit the .jks or keystore.properties.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="$ROOT/android/maestros-release.jks"
PROPS="$ROOT/android/keystore.properties"

if [[ -f "$KEYSTORE" || -f "$PROPS" ]]; then
  echo "Refusing to overwrite $KEYSTORE or $PROPS. Back them up first."
  exit 1
fi

if ! command -v keytool >/dev/null; then
  echo "keytool not found. Install a JDK 17+."
  exit 1
fi

PASS="$(openssl rand -base64 18 | tr -d '/+=' | head -c 24)"
ALIAS=maestros

keytool -genkeypair -keystore "$KEYSTORE" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" -noprompt \
  -dname "CN=Ivori Aplicacions, OU=Maestros del Sudoku, O=Ivori Aplicacions, L=Barcelona, C=ES"

cat > "$PROPS" <<EOF
storeFile=maestros-release.jks
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF

chmod 600 "$KEYSTORE" "$PROPS"
echo "Wrote $KEYSTORE and $PROPS (gitignored)."
echo "Copy both files to a password manager before the first Play upload."
