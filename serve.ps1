$port = 3000
$root = $PSScriptRoot
$dataDir = Join-Path $root "data"
if (!(Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir | Out-Null }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "✅ LucktanInfo website running at http://localhost:$port" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop." -ForegroundColor Yellow

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ico"   = "image/x-icon"
    ".json"  = "application/json"
    ".woff2" = "font/woff2"
    ".woff"  = "font/woff"
    ".ttf"   = "font/ttf"
}

function Save-Submission($fileName, $data) {
    $filePath = Join-Path $dataDir $fileName
    $list = @()
    if (Test-Path $filePath) {
        $content = Get-Content -Raw $filePath -ErrorAction SilentlyContinue
        if ($content) {
            $parsed = ConvertFrom-Json $content
            if ($parsed -is [array]) {
                $list = $parsed
            } else {
                $list = @($parsed)
            }
        }
    }
    $data | Add-Member -MemberType NoteProperty -Name "timestamp" -Value (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -Force
    $list += $data
    $list | ConvertTo-Json -Depth 5 | Out-File $filePath -Encoding utf8
}

$script:btcCache = $null
$script:btcCacheExpires = [DateTime]::MinValue

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath

        # Route API Calls
        if ($rawUrl.StartsWith("/api/")) {
            $response.ContentType = "application/json; charset=utf-8"
            
            # Read request body if POST
            $bodyText = ""
            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyText = $reader.ReadToEnd()
                $reader.Close()
            }

            try {
                if ($rawUrl -eq "/api/contact" -and $request.HttpMethod -eq "POST") {
                    $payload = $bodyText | ConvertFrom-Json
                    $sub = [PSCustomObject]@{
                        name    = $payload.name
                        email   = $payload.email
                        subject = $payload.subject
                        message = $payload.message
                    }
                    Save-Submission "contact_submissions.json" $sub
                    
                    $resBody = @{ status = "success"; message = "Message received successfully!" } | ConvertTo-Json
                    $body = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                    $response.OutputStream.Write($body, 0, $body.Length)
                    Write-Host "200 POST /api/contact" -ForegroundColor Green
                }
                elseif ($rawUrl -eq "/api/newsletter" -and $request.HttpMethod -eq "POST") {
                    $payload = $bodyText | ConvertFrom-Json
                    $sub = [PSCustomObject]@{
                        email = $payload.email
                    }
                    Save-Submission "newsletter_subscribers.json" $sub
                    
                    $resBody = @{ status = "success"; message = "Subscribed successfully!" } | ConvertTo-Json
                    $body = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                    $response.OutputStream.Write($body, 0, $body.Length)
                    Write-Host "200 POST /api/newsletter" -ForegroundColor Green
                }
                elseif ($rawUrl -eq "/api/enroll" -and $request.HttpMethod -eq "POST") {
                    $payload = $bodyText | ConvertFrom-Json
                    $sub = [PSCustomObject]@{
                        courseId = $payload.courseId
                        name     = $payload.name
                        email    = $payload.email
                    }
                    Save-Submission "course_enrollments.json" $sub
                    
                    $resBody = @{ status = "success"; message = "Enrolled successfully! We will contact you soon." } | ConvertTo-Json
                    $body = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                    $response.OutputStream.Write($body, 0, $body.Length)
                    Write-Host "200 POST /api/enroll" -ForegroundColor Green
                }
                elseif ($rawUrl -eq "/api/btc-price" -and $request.HttpMethod -eq "GET") {
                    if (!$script:btcCache -or (Get-Date) -gt $script:btcCacheExpires) {
                        try {
                            $originalProgressPreference = $ProgressPreference
                            $ProgressPreference = 'SilentlyContinue'
                            $binanceData = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT" -TimeoutSec 3
                            $ProgressPreference = $originalProgressPreference
                            
                            $priceVal = [double]$binanceData.lastPrice
                            $changeVal = [double]$binanceData.priceChangePercent
                            
                            $script:btcCache = [PSCustomObject]@{
                                price  = $priceVal
                                change = $changeVal
                                isUp   = ($changeVal -ge 0)
                            }
                            $script:btcCacheExpires = (Get-Date).AddSeconds(15)
                        } catch {
                            $script:btcCache = [PSCustomObject]@{
                                price  = 104510
                                change = 2.41
                                isUp   = $true
                            }
                            $script:btcCacheExpires = (Get-Date).AddSeconds(5)
                        }
                    }
                    
                    $resBody = $script:btcCache | ConvertTo-Json
                    $body = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                    $response.OutputStream.Write($body, 0, $body.Length)
                    Write-Host "200 GET /api/btc-price" -ForegroundColor Green
                }
                else {
                    $response.StatusCode = 404
                    $resBody = @{ error = "API Endpoint Not Found" } | ConvertTo-Json
                    $body = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                    $response.OutputStream.Write($body, 0, $body.Length)
                    Write-Host "404 $rawUrl" -ForegroundColor Yellow
                }
            } catch {
                $response.StatusCode = 500
                $resBody = @{ error = $_.Exception.Message } | ConvertTo-Json
                $body = [System.Text.Encoding]::UTF8.GetBytes($resBody)
                $response.OutputStream.Write($body, 0, $body.Length)
                Write-Host "500 $rawUrl - $_" -ForegroundColor Red
            }
        }
        else {
            # Serve Static Files
            if ($rawUrl -eq "/") { $rawUrl = "/index.html" }
            $filePath = Join-Path $root ($rawUrl.TrimStart('/').Replace('/', '\'))

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $mime
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "200 $rawUrl" -ForegroundColor Cyan
            } else {
                $response.StatusCode = 404
                $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawUrl")
                $response.OutputStream.Write($body, 0, $body.Length)
                Write-Host "404 $rawUrl" -ForegroundColor Red
            }
        }
        $response.OutputStream.Close()
    } catch {
        # Ignore listener closed errors
    }
}
