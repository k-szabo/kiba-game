[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pythonLauncher = Get-Command py -ErrorAction SilentlyContinue
$python = if ($pythonLauncher) { $pythonLauncher } else { Get-Command python -ErrorAction SilentlyContinue }

if (-not $python) {
    throw 'Python 3 is required. Install Python 3, then run this script again.'
}

if ($python.Name -eq 'py.exe' -or $python.Name -eq 'py') {
    $serverArguments = @('-3', '-m', 'http.server', "$Port", '--bind', '127.0.0.1')
} else {
    $serverArguments = @('-m', 'http.server', "$Port", '--bind', '127.0.0.1')
}

Push-Location $repositoryRoot
try {
    Write-Host "Serving Kiba from $repositoryRoot"
    Write-Host "Open http://localhost:$Port/ (press Ctrl+C to stop)."
    try {
        Start-Process "http://localhost:$Port/"
    } catch {
        Write-Warning "The browser could not be opened automatically. Visit http://localhost:$Port/"
    }
    & $python.Source @serverArguments

    if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        Write-Warning "The server exited with code $LASTEXITCODE. Check whether port $Port is already in use."
    }
} finally {
    Pop-Location
}
