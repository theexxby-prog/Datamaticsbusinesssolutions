#!/bin/bash
# Repairs the dependency install so `npm run build` and `npm run dev` work.
#
# Two failure modes bite fresh containers in Claude Code on the web, and both
# present as a bare `Bus error` with no stack trace, which is very expensive to
# diagnose from scratch:
#
#   1. npm is configured to send registry traffic through the agent proxy, but
#      the proxy's own noProxy list contains registry.npmjs.org. The result is
#      ECONNRESET partway through the install, leaving a partial node_modules.
#
#   2. That partial install leaves native .node binaries TRUNCATED — the ELF
#      header points past end-of-file. Mapping one is a SIGBUS, which kills
#      vite in both dev and build. Re-running `npm install` does NOT fix it:
#      npm sees the package directory and considers it satisfied. The only
#      repair is to delete the package and reinstall.
#
# So this hook installs with the registry bypassing the proxy, then verifies
# each native module by actually loading it, and force-reinstalls any that fail.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" || exit 0

# The registry must be reached directly — see note 1 above.
export npm_config_proxy=
export npm_config_https_proxy=
export npm_config_noproxy=registry.npmjs.org

echo "[session-start] installing dependencies…"
if ! npm install --no-audit --no-fund >/tmp/session-start-npm.log 2>&1; then
  echo "[session-start] WARNING: npm install failed. Tail of the log:"
  tail -15 /tmp/session-start-npm.log
fi

# Verify natives by loading them. A truncated binary raises SIGBUS, which kills
# this child process but not the hook, so a plain exit-status check catches it.
# The probe runs in a subshell whose own stderr is discarded. A truncated
# binary kills node with SIGBUS, and the *parent* shell is what prints the
# "Bus error" job message — so without this the session log shows a bare crash
# line that reads as though this hook died, not the module it is probing.
# The trailing `exit` also matters: a subshell whose last command is `node`
# execs into it, which would move the crash back up to the outer shell.
loads() { ( node -e "require('$1')" >/dev/null 2>&1; exit $? ) 2>/dev/null; }

repair() {
  local mod="$1" glob="$2"
  if loads "$mod"; then
    echo "[session-start]   ok   $mod"
    return 0
  fi
  echo "[session-start]   FAIL $mod — removing $glob and reinstalling"
  # shellcheck disable=SC2086
  rm -rf $glob
  npm install --no-audit --no-fund >>/tmp/session-start-npm.log 2>&1 || true
  if loads "$mod"; then
    echo "[session-start]   ok   $mod (repaired)"
  else
    echo "[session-start]   STILL FAILING: $mod — vite will SIGBUS. See /tmp/session-start-npm.log"
  fi
}

echo "[session-start] verifying native modules…"
repair lightningcss          "node_modules/lightningcss node_modules/lightningcss-*"
repair @tailwindcss/oxide    "node_modules/@tailwindcss/oxide node_modules/@tailwindcss/oxide-*"
repair esbuild               "node_modules/esbuild node_modules/@esbuild"
repair rollup                "node_modules/rollup node_modules/@rollup"

# The real acceptance test: instantiating the Tailwind vite plugin is the exact
# point where a bad lightningcss takes the whole toolchain down. Cheaper than a
# full build and catches the same failure.
if node -e "import('@tailwindcss/vite').then(m => { m.default(); })" >/dev/null 2>&1; then
  echo "[session-start] toolchain OK — npm run build / dev are ready."
else
  echo "[session-start] WARNING: the Tailwind vite plugin still fails to load."
  echo "[session-start] vite will die with 'Bus error'. Try:"
  echo "[session-start]   rm -rf node_modules && npm_config_https_proxy= npm_config_noproxy=registry.npmjs.org npm install"
fi

exit 0
