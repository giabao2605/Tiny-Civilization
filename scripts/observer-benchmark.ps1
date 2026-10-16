# Optional Windows local-headed comparative sampler. This is NOT a long-run GPU FPS certification.
param([switch]$Install)
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))
if ($Install) {
  & npm.cmd ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed (exit $LASTEXITCODE)" }
  & npx.cmd playwright install chromium
  if ($LASTEXITCODE -ne 0) { throw "Playwright install failed (exit $LASTEXITCODE)" }
}
Write-Host "V01-E Chromium headed matrix: 20/50/100 NPC x 1x/20x x 3 viewports x 3 cameras (54 samples)."
Write-Host "Run at same seed, browser, monitor, CPU/GPU load and power mode on main and PR branch."
& npx.cmd playwright test tests/e2e/observer-v01-e-perf.spec.ts --headed --workers=1 --retries=0 --reporter=list
if ($LASTEXITCODE -ne 0) { throw "Playwright benchmark failed (exit $LASTEXITCODE)" }
Write-Host "Find v01-e-ci-matrix.json and v01-e-remount-counts.json under test-results/."
Write-Host "NOTE: short browser rAF timing; also profile real gameplay for 5-10 minutes and 60-120 min soak."
