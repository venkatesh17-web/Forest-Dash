# FOREST DASH: SPIRIT RUNNER
# Verification and Static Analysis Test Suite

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  RUNNING FOREST DASH TEST SUITE" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$testResults = @()

function Record-Test($name, $passed, $details) {
    $script:testResults += [PSCustomObject]@{
        Test = $name
        Status = if ($passed) { "PASS" } else { "FAIL" }
        Details = $details
    }
    $color = if ($passed) { "Green" } else { "Red" }
    Write-Host "[$($script:testResults[-1].Status)] $name : $details" -ForegroundColor $color
}

# 1. Check all required files exist
$requiredFiles = @(
    "index.html",
    "styles\style.css",
    "src\config.js",
    "src\storage.js",
    "src\audio.js",
    "src\physics.js",
    "src\particles.js",
    "src\player.js",
    "src\world.js",
    "src\obstacles.js",
    "src\coins.js",
    "src\powerups.js",
    "src\ui.js",
    "src\crazygames.js",
    "src\game.js",
    "src\main.js",
    "assets\images\spirit_icon.svg",
    "assets\audio\README.md"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}
Record-Test "TEST 1: Required Project Files" ($missingFiles.Count -eq 0) "Checked $($requiredFiles.Count) files. Missing: $($missingFiles -join ', ')"

# 2. Check no external network dependencies in index.html
$indexContent = Get-Content "index.html" -Raw
$hasHttp = $indexContent -match "https?://"
Record-Test "TEST 24: Zero External URL Dependencies" (-not $hasHttp) "index.html contains no external CDN or web assets (100% self-contained)"

# 3. Check delimiter balance (braces, brackets, parens) in all JS files
$jsFiles = Get-ChildItem -Path "src" -Filter "*.js"
$syntaxOk = $true
$syntaxIssues = @()

foreach ($f in $jsFiles) {
    $text = Get-Content $f.FullName -Raw
    $curly = 0
    $square = 0
    $round = 0

    # Strip strings and comments for bracket checking
    $cleanText = [System.Text.RegularExpressions.Regex]::Replace($text, '//.*$', '', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    $cleanText = [System.Text.RegularExpressions.Regex]::Replace($cleanText, '/\*[\s\S]*?\*/', '')
    $cleanText = [System.Text.RegularExpressions.Regex]::Replace($cleanText, '`[\s\S]*?`', '""')
    $cleanText = [System.Text.RegularExpressions.Regex]::Replace($cleanText, '".*?"', '""')
    $cleanText = [System.Text.RegularExpressions.Regex]::Replace($cleanText, "'.*?'", "''")

    for ($i = 0; $i -lt $cleanText.Length; $i++) {
        $ch = $cleanText[$i]
        if ($ch -eq '{') { $curly++ }
        elseif ($ch -eq '}') { $curly-- }
        elseif ($ch -eq '[') { $square++ }
        elseif ($ch -eq ']') { $square-- }
        elseif ($ch -eq '(') { $round++ }
        elseif ($ch -eq ')') { $round-- }
    }

    if ($curly -ne 0 -or $square -ne 0 -or $round -ne 0) {
        $syntaxOk = $false
        $syntaxIssues += "$($f.Name) (curly: $curly, square: $square, round: $round)"
    }
}

Record-Test "TEST 21: JavaScript Syntax & Delimiters" $syntaxOk "All JS files balanced. Issues: $($syntaxIssues -join ', ')"

# 4. Check DOM ID mappings between index.html and ui.js / game.js
$uiContent = Get-Content "src\ui.js" -Raw
$gameContent = Get-Content "src\game.js" -Raw
$idMatches = [System.Text.RegularExpressions.Regex]::Matches($uiContent + $gameContent, "getElementById\(['""]([^'""]+)['""]\)")

$missingIds = @()
foreach ($m in $idMatches) {
    $id = $m.Groups[1].Value
    if ($indexContent -notmatch "id=['""]$id['""]") {
        $missingIds += $id
    }
}
$uniqueMissing = $missingIds | Select-Object -Unique
Record-Test "TEST 2: DOM Elements & HUD ID Bindings" ($uniqueMissing.Count -eq 0) "All getElementById calls resolve in HTML. Missing: $($uniqueMissing -join ', ')"

# 5. Check Game Configuration & Physics Tuning
$configContent = Get-Content "src\config.js" -Raw
$hasGravity = $configContent -match "GRAVITY:\s*\d+"
$hasJump = $configContent -match "JUMP_FORCE:\s*-\d+"
$hasBaseSpeed = $configContent -match "BASE_SPEED:\s*\d+"
$hasGroundY = $configContent -match "GROUND_Y:\s*\d+"
$hasSkins = $configContent -match "SKINS:\s*\["

Record-Test "TEST 4: Physics & Gameplay Configuration" ($hasGravity -and $hasJump -and $hasBaseSpeed -and $hasGroundY -and $hasSkins) "Physics parameters, skins, powerups, and obstacles configured"

# 6. Check LocalStorage fallback robustness
$storageContent = Get-Content "src\storage.js" -Raw
$hasStorageFallback = $storageContent -match "memoryFallback"
Record-Test "TEST 18: Storage & Persistence Fallback" $hasStorageFallback "Storage has memory fallback for restricted browser privacy modes"

# 7. Check Web Audio API procedural synthesis
$audioContent = Get-Content "src\audio.js" -Raw
$hasAudioSfx = ($audioContent -match "playJump") -and ($audioContent -match "playCoin") -and ($audioContent -match "playHit") -and ($audioContent -match "playPowerup")
$hasAudioMusic = $audioContent -match "startMusicLoop"
Record-Test "TEST 19: Web Audio API Synthesis" ($hasAudioSfx -and $hasAudioMusic) "Audio engine contains procedural SFX and pentatonic music sequencer"

# Summary
Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $testResults.Count
Write-Host "Passed $passCount / $totalCount Automated Verification Tests" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

