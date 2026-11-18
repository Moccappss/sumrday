param(
  [string]$SourceImage = "public\pwa-admin-512x512.png",
  [string]$ResDir = "android\app\src\main\res"
)

Add-Type -AssemblyName System.Drawing

if ($SourceImage -match "^https?://") {
  $tmpFile = Join-Path $env:TEMP ("apk-icon-" + [guid]::NewGuid().ToString() + ".png")
  Invoke-WebRequest -Uri $SourceImage -OutFile $tmpFile -UseBasicParsing
  $SourceImage = $tmpFile
}

$resolvedSrc = (Resolve-Path $SourceImage).Path
$srcImg = [System.Drawing.Image]::FromFile($resolvedSrc)
$srcBmp = New-Object System.Drawing.Bitmap($srcImg)
$bgPixel = $srcBmp.GetPixel(2, 2)
$bgColor = if ($bgPixel.A -lt 200) { [System.Drawing.Color]::FromArgb(255, 250, 246, 240) } else { [System.Drawing.Color]::FromArgb(255, $bgPixel.R, $bgPixel.G, $bgPixel.B) }
$bgHex = "#{0:X2}{1:X2}{2:X2}" -f $bgColor.R, $bgColor.G, $bgColor.B

function Save-ResizedSquare {
  param([int]$Size, [string]$OutPath, [bool]$Round = $false, [double]$Scale = 1.0, [bool]$FillBg = $false)
  $dir = Split-Path $OutPath -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  if ($Round) {
    $g.Clear([System.Drawing.Color]::Transparent)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $Size, $Size)
    $g.SetClip($path)
  }

  if ($FillBg) {
    $g.Clear($bgColor)
  } elseif (-not $Round) {
    $g.Clear([System.Drawing.Color]::Transparent)
  }

  $drawSize = [int][Math]::Round($Size * $Scale)
  $offset = [int][Math]::Round(($Size - $drawSize) / 2)
  $g.DrawImage($srcImg, $offset, $offset, $drawSize, $drawSize)

  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$densities = @(
  @{ name = "mipmap-mdpi";    icon = 48;  fg = 108 },
  @{ name = "mipmap-hdpi";    icon = 72;  fg = 162 },
  @{ name = "mipmap-xhdpi";   icon = 96;  fg = 216 },
  @{ name = "mipmap-xxhdpi";  icon = 144; fg = 324 },
  @{ name = "mipmap-xxxhdpi"; icon = 192; fg = 432 }
)

foreach ($d in $densities) {
  $folder = Join-Path $ResDir $d.name
  Save-ResizedSquare -Size $d.icon -OutPath (Join-Path $folder "ic_launcher.png") -FillBg $true
  Save-ResizedSquare -Size $d.icon -OutPath (Join-Path $folder "ic_launcher_round.png") -Round $true -FillBg $true
  # Fill background edge-to-edge with source corner color and keep logo inside adaptive safe zone
  Save-ResizedSquare -Size $d.fg -OutPath (Join-Path $folder "ic_launcher_foreground.png") -Scale 0.76 -FillBg $true
}

$valuesDir = Join-Path $ResDir "values"
if (!(Test-Path $valuesDir)) { New-Item -ItemType Directory -Path $valuesDir -Force | Out-Null }
$bgXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$bgHex</color>
</resources>
"@
Set-Content -Path (Join-Path $valuesDir "ic_launcher_background.xml") -Value $bgXml -Encoding UTF8

$srcBmp.Dispose()
$srcImg.Dispose()
if ($tmpFile -and (Test-Path $tmpFile)) { Remove-Item $tmpFile -Force }
Write-Output "Generated Android launcher icons in $ResDir from $resolvedSrc"
