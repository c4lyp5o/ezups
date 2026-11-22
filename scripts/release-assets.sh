#!/bin/sh
# Release files attached to the GitHub Release by publish.yml on a vX.Y.Z tag:
# a runnable bundle (server source + built client, no node_modules) and checksums.
# Usage: scripts/release-assets.sh vX.Y.Z   (writes release-assets/)
set -eu
VERSION="$1"
name="ezups_${VERSION}"
out="release-assets/${name}"
mkdir -p "${out}"
cp -r server.js config.js package.json bun.lock \
	controllers database middlewares routes utils \
	README.md .env.example "${out}/"
(cd client && bun install --frozen-lockfile && bun run build)
cp -r public "${out}/public"
cat > "${out}/start.sh" <<'EOF'
#!/bin/sh
set -e
cd "$(dirname "$0")"
bun install --production
exec bun start
EOF
chmod +x "${out}/start.sh"
tar -C release-assets -czf "release-assets/${name}.tar.gz" "${name}"
(cd release-assets && python3 -m zipfile -c "${name}.zip" "${name}")
rm -r "${out}"
(cd release-assets && sha256sum ./*.tar.gz ./*.zip > SHA256SUMS)
