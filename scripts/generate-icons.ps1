Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\arif2\Downloads\sumr.day\public\logo.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source logo not found: $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-ImageFile {
    param(
        [string]$destPath,
        [int]$size,
        [int]$padding,
        [string]$bgColor = "Transparent"
    )
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    if ($bgColor -eq "Transparent") {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $color = [System.Drawing.ColorTranslator]::FromHtml($bgColor)
        $g.Clear($color)
    }
    
    $innerSize = $size - ($padding * 2)
    $g.DrawImage($srcImg, $padding, $padding, $innerSize, $innerSize)
    $g.Dispose()
    
    if (Test-Path $destPath) {
        Remove-Item $destPath -Force
    }
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Successfully generated: $destPath ($size x $size)"
}

# 1. Client PWA Icons (Logo sumr.day dengan background lembut atau transparan)
Resize-ImageFile -destPath "c:\Users\arif2\Downloads\sumr.day\public\pwa-192x192.png" -size 192 -padding 14
Resize-ImageFile -destPath "c:\Users\arif2\Downloads\sumr.day\public\pwa-512x512.png" -size 512 -padding 36

# 2. Admin PWA Icons (sumr.day OS icon khusus)
Resize-ImageFile -destPath "c:\Users\arif2\Downloads\sumr.day\public\pwa-admin-192x192.png" -size 192 -padding 16 -bgColor "#09090e"
Resize-ImageFile -destPath "c:\Users\arif2\Downloads\sumr.day\public\pwa-admin-512x512.png" -size 512 -padding 42 -bgColor "#09090e"

$srcImg.Dispose()
Write-Output "All icons generated successfully!"
