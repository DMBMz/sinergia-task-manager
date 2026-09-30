# Script to package and install Sinergia APK on device via USB (ADB)
$ErrorActionPreference = "Stop"

$tempRoot = [System.IO.Path]::GetTempPath()
$work = Join-Path $tempRoot "sinergia_build_inplace"
$projectRoot = "c:\Users\Fatec\sn\sinergia-task-manager"
$signerJar = "$env:USERPROFILE\uber-apk-signer.jar"
$adbExe = "$env:USERPROFILE\platform-tools\adb.exe"

Write-Host ">>> Cleaning temp directory: $work"
if (Test-Path $work) {
    Remove-Item $work -Recurse -Force
}
New-Item -ItemType Directory -Path $work -Force | Out-Null

$baseApk = Join-Path $projectRoot "mobile\www\sinergia.apk"
$targetApk = Join-Path $work "sinergia-target.apk"

# Ensure we have clean base apk if needed
Write-Host ">>> Preparing base APK copy..."
Copy-Item $baseApk $targetApk -Force

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

Write-Host ">>> Updating index.html in-place inside APK (preserving uncompressed resources.arsc)..."
$zip = [System.IO.Compression.ZipFile]::Open($targetApk, [System.IO.Compression.ZipArchiveMode]::Update)

# 1. Remove old signatures
$entriesToDelete = @($zip.Entries | Where-Object { $_.FullName -like "META-INF/*" })
foreach ($e in $entriesToDelete) {
    $e.Delete()
}

# 2. Update assets/public/index.html
$oldHtml = $zip.GetEntry("assets/public/index.html")
if ($oldHtml) {
    $oldHtml.Delete()
}
$newHtmlPath = Join-Path $projectRoot "docs\index.html"
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $newHtmlPath, "assets/public/index.html") | Out-Null

# 3. Update jsqr.js and qrcode.min.js if needed
$jsqrPath = Join-Path $projectRoot "mobile\www\jsqr.js"
if (Test-Path $jsqrPath) {
    $oldJsqr = $zip.GetEntry("assets/public/jsqr.js")
    if ($oldJsqr) { $oldJsqr.Delete() }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $jsqrPath, "assets/public/jsqr.js") | Out-Null
}

$qrPath = Join-Path $projectRoot "mobile\www\qrcode.min.js"
if (Test-Path $qrPath) {
    $oldQr = $zip.GetEntry("assets/public/qrcode.min.js")
    if ($oldQr) { $oldQr.Delete() }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $qrPath, "assets/public/qrcode.min.js") | Out-Null
}

# 4. Remove recursive APK if present
$recApk = $zip.GetEntry("assets/public/sinergia.apk")
if ($recApk) { $recApk.Delete() }

$zip.Dispose()

Write-Host ">>> Signing with uber-apk-signer (v1, v2, v3 + zipalign)..."
& java -jar $signerJar -a $targetApk --out $work --allowResign --verbose

$signedApks = Get-ChildItem -Path $work -Filter "*-aligned-debugSigned.apk"
if ($signedApks.Count -eq 0) {
    throw "Signing failed! No signed APK generated."
}

$finalApk = $signedApks[0].FullName
Write-Host ">>> Signed APK created: $finalApk (Size: $((Get-Item $finalApk).Length) bytes)"

# Copy back to mobile/www/sinergia.apk so the repo is always up to date
try {
    Copy-Item $finalApk $baseApk -Force -ErrorAction SilentlyContinue
    Write-Host ">>> Updated $baseApk"
} catch {
    Write-Host ">>> Note: Base APK in www locked, will update on next run."
}

# Check connected device
Write-Host ">>> Checking ADB devices..."
& $adbExe devices

Write-Host ">>> Installing on phone via ADB (adb install -r)..."
$res = & $adbExe install -r $finalApk 2>&1
Write-Host $res

if ($res -match "INSTALL_FAILED_UPDATE_INCOMPATIBLE" -or $res -match "signatures do not match") {
    Write-Host ">>> Signature difference detected. Reinstalling cleanly..."
    & $adbExe uninstall com.sinergia.app
    & $adbExe install $finalApk
}

Write-Host ">>> Launching com.sinergia.app on phone..."
& $adbExe shell am force-stop com.sinergia.app
& $adbExe shell am start -n com.sinergia.app/.MainActivity

Write-Host ">>> SUCCESS! Mobile app updated and launched on device."
