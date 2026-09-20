Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\OS IT SAU\.gemini\antigravity-ide\brain\34e7d7ed-5ab0-492a-a498-8d21592cb19d\catchreel_logo_c_1789893805267.jpg"
$publicDir = "c:\Projects\listed-content\public"
$iconsDir = Join-Path $publicDir "icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source Image loaded: $($srcImg.Width) x $($srcImg.Height)"

# Crop central squircle area (the image has squircle with slight padding around it)
# The squircle is nicely centered, about 84% of the image size
$cropPercent = 0.88
$cropW = [int]($srcImg.Width * $cropPercent)
$cropH = [int]($srcImg.Height * $cropPercent)
$cropX = [int](($srcImg.Width - $cropW) / 2)
$cropY = [int](($srcImg.Height - $cropH) / 2)
$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)

function SaveResizedPng($targetPath, $targetSize) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetSize, $targetSize)
    $g.DrawImage($srcImg, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $targetPath ($($targetSize)x$($targetSize))"
}

SaveResizedPng (Join-Path $iconsDir "icon-512.png") 512
SaveResizedPng (Join-Path $iconsDir "icon-192.png") 192
SaveResizedPng (Join-Path $publicDir "apple-touch-icon.png") 192
SaveResizedPng (Join-Path $publicDir "favicon.png") 64

$srcImg.Dispose()
Write-Host "All icons resized successfully!"
