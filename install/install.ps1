# VeriWhy Check Windows release installer.
# Author: Richard Krasso

# Convert every PowerShell error into a terminating error so `finally` performs
# cleanup and no later installation step runs after a failure.
$ErrorActionPreference = "Stop"
# Derive the archive from the actual process architecture rather than requiring
# a student to identify the processor family manually.
$architecture = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "Arm64") { "arm64" } else { "x64" }
$asset = "veriwhy-check-windows-$architecture.tar.gz"
$repository = "https://github.com/buwebdev/veriwhy-check/releases/latest/download"
$work = Join-Path ([System.IO.Path]::GetTempPath()) ("veriwhy-check-" + [guid]::NewGuid())

try {
  # Work only in a unique operating-system temporary folder. The cleanup in
  # finally cannot target a student repository or another application.
  New-Item -ItemType Directory -Path $work | Out-Null
  # Archive and digest come from the same official latest release. No package
  # registry or third-party installer service participates in this trust chain.
  Write-Host "Downloading the official VeriWhy Check package..."
  Invoke-WebRequest "$repository/$asset" -OutFile (Join-Path $work $asset)
  Invoke-WebRequest "$repository/$asset.sha256" -OutFile (Join-Path $work "$asset.sha256")
  $expected = ((Get-Content (Join-Path $work "$asset.sha256")) -split "\s+")[0].ToLower()
  $actual = (Get-FileHash (Join-Path $work $asset) -Algorithm SHA256).Hash.ToLower()
  # Stop before extraction when the published digest and download differ.
  if ($expected -ne $actual) { throw "The download failed its safety check. Nothing was installed." }
  tar -xzf (Join-Path $work $asset) -C $work
  # Run the packaged bootstrap with packaged Node.js so a system runtime is not
  # a prerequisite and cannot change the installation behavior.
  & (Join-Path $work "payload\runtime\node.exe") (Join-Path $work "install.mjs")
  if ($LASTEXITCODE -ne 0) { throw "The installer did not finish." }
} finally {
  if (Test-Path $work) { Remove-Item -Recurse -Force $work }
}
