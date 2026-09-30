# Script to package and sign Sinergia APK with updated frontend
$ErrorActionPreference = "Stop"

$tempRoot = [System.IO.Path]::GetTempPath()
$work = Join-Path $tempRoot "sinergia_build"
$projectRoot = "c:\Users\Fatec\sn\sinergia-task-manager"
$signerJar = "$env:USERPROFILE\uber-apk-signer.jar"
$adbExe = "$env:USERPROFILE\platform-tools\adb.exe"

Write-Host ">>> Cleaning temp directory: $work"
if (Test-Path $work) {
    Remove-Item $work -Recurse -Force
}
New-Item -ItemType Directory -Path "$work\extracted" -Force | Out-Null
New-Item -ItemType Directory -Path "$work\signed" -Force | Out-Null

Write-Host ">>> Extracting base APK..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Use an original clean copy or mobile/www/sinergia.apk if it exists
[System.IO.Compression.ZipFile]::ExtractToDirectory("$projectRoot\mobile\www\sinergia.apk", "$work\extracted")

Write-Host ">>> Copying latest frontend assets (Sprint 2 Onda 1 & Onda 2)..."
Copy-Item "$projectRoot\docs\index.html" "$work\extracted\assets\public\index.html" -Force
if (Test-Path "$projectRoot\mobile\www\jsqr.js") {
    Copy-Item "$projectRoot\mobile\www\jsqr.js" "$work\extracted\assets\public\jsqr.js" -Force
}
if (Test-Path "$projectRoot\mobile\www\qrcode.min.js") {
    Copy-Item "$projectRoot\mobile\www\qrcode.min.js" "$work\extracted\assets\public\qrcode.min.js" -Force
}

# Remove recursive APK if present inside assets
if (Test-Path "$work\extracted\assets\public\sinergia.apk") {
    Remove-Item "$work\extracted\assets\public\sinergia.apk" -Force
}

# Remove old META-INF to allow clean re-signing
if (Test-Path "$work\extracted\META-INF") {
    Remove-Item "$work\extracted\META-INF" -Recurse -Force
}

Write-Host ">>> Repackaging unsigned APK with uncompressed resources.arsc (Android R+ requirement)..."
$unsignedApk = "$work\sinergia-unsigned.apk"
$extractedPath = "$work\extracted"

$archive = [System.IO.Compression.ZipFile]::Open($unsignedApk, [System.IO.Compression.ZipArchiveMode]::Create)
$allFiles = Get-ChildItem -Path $extractedPath -Recurse | Where-Object { -not $_.PSIsContainer }

foreach ($f in $allFiles) {
    $rel = $f.FullName.Substring($extractedPath.Length).TrimStart('\', '/').Replace('\', '/')
    # Android R+ requires resources.arsc (and uncompressed media) to be stored uncompressed
    if ($rel -eq "resources.arsc" -or $rel.EndsWith(".png") -or $rel.EndsWith(".so")) {
        $level = [System.IO.Compression.CompressionLevel]::NoCompression
    } else {
        $level = [System.IO.Compression.CompressionLevel]::Optimal
    }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $f.FullName, $rel, $level) | Out-Null
}
$archive.Dispose()

Write-Host ">>> Signing APK with uber-apk-signer (v1, v2, v3 schemes + zipalign)..."
& java -jar $signerJar -a $unsignedApk --out "$work\signed" --allowResign --verbose

$signedApks = Get-ChildItem -Path "$work\signed" -Filter "*.apk"
if ($signedApks.Count -eq 0) {
    throw "Signing failed! No signed APK generated."
}

$finalApk = $signedApks[0].FullName
Write-Host ">>> Signed APK created successfully: $finalApk (Size: $((Get-Item $finalApk).Length) bytes)"

# Copy back to mobile/www/sinergia.apk
Copy-Item $finalApk "$projectRoot\mobile\www\sinergia.apk" -Force
Write-Host ">>> Updated $projectRoot\mobile\www\sinergia.apk"

# Check connected device
Write-Host ">>> Checking ADB devices..."
& $adbExe devices

# If old package is signed with a different key, uninstall first if needed, but try install -r first
Write-Host ">>> Installing on phone via ADB (adb install -r -d)..."
$installResult = & $adbExe install -r -d $finalApk 2>&1
Write-Host $installResult

if ($installResult -match "INSTALL_FAILED_UPDATE_INCOMPATIBLE" -or $installResult -match "signatures do not match") {
    Write-Host ">>> Signature difference detected. Reinstalling cleanly..."
    & $adbExe uninstall com.sinergia.app
    & $adbExe install -r $finalApk
}

Write-Host ">>> Launching com.sinergia.app on phone..."
& $adbExe shell am force-stop com.sinergia.app
& $adbExe shell am start -n com.sinergia.app/.MainActivity

Write-Host ">>> SUCCESS! Mobile app updated and launched on device."
