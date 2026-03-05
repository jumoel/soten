#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

# Install gh CLI if not present
if ! command -v gh &>/dev/null; then
  GH_VERSION="2.67.0"
  curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_amd64.tar.gz" -o /tmp/gh.tar.gz
  tar -xzf /tmp/gh.tar.gz -C /tmp
  sudo mv "/tmp/gh_${GH_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh
  rm -rf /tmp/gh.tar.gz "/tmp/gh_${GH_VERSION}_linux_amd64"
fi

cd "$CLAUDE_PROJECT_DIR"

npm install
