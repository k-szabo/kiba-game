#Requires -Version 5.1
[CmdletBinding()]
param(
    [switch]$Disable
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configurationPath = Join-Path $repositoryRoot 'assets/config/dev-tools.json'
$configuration = [ordered]@{
    version = 1
    enabled = $false
    algorithm = 'PBKDF2-SHA256'
    iterations = 600000
    salt = ''
    verifier = ''
}

if (-not $Disable) {
    $password = $null
    $confirmation = $null
    $passwordText = $null
    $confirmationText = $null
    $passwordBytes = $null
    $derivedBytes = $null
    $derivation = $null
    $random = $null
    $passwordPointer = [IntPtr]::Zero
    $confirmationPointer = [IntPtr]::Zero
    try {
        $password = Read-Host 'New developer panel password (at least 12 characters)' -AsSecureString
        $confirmation = Read-Host 'Repeat the developer panel password' -AsSecureString
        $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        $confirmationPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmation)
        $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
        $confirmationText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmationPointer)
        if ($passwordText.Length -lt 12 -or $passwordText.Length -gt 1024) {
            throw 'Use a password of 12 to 1024 characters. The configuration was not changed.'
        }
        if (-not [string]::Equals($passwordText, $confirmationText, [StringComparison]::Ordinal)) {
            throw 'The passwords do not match. The configuration was not changed.'
        }

        # UTF-8 without normalization or trimming, matching browser TextEncoder.
        $encoding = New-Object System.Text.UTF8Encoding($false, $true)
        $passwordBytes = $encoding.GetBytes($passwordText)
        $saltBytes = New-Object byte[] 16
        $random = [Security.Cryptography.RandomNumberGenerator]::Create()
        $random.GetBytes($saltBytes)
        # The SHA-256 overload is available in .NET Framework 4.7.2+ and modern PowerShell.
        $derivation = [Security.Cryptography.Rfc2898DeriveBytes]::new(
            $passwordBytes, $saltBytes, $configuration.iterations,
            [Security.Cryptography.HashAlgorithmName]::SHA256
        )
        $derivedBytes = $derivation.GetBytes(32)
        $configuration.enabled = $true
        $configuration.salt = [Convert]::ToBase64String($saltBytes)
        $configuration.verifier = [Convert]::ToBase64String($derivedBytes)
    } finally {
        if ($derivation) { $derivation.Dispose() }
        if ($random) { $random.Dispose() }
        if ($passwordBytes) { [Array]::Clear($passwordBytes, 0, $passwordBytes.Length) }
        if ($derivedBytes) { [Array]::Clear($derivedBytes, 0, $derivedBytes.Length) }
        if ($passwordPointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
        }
        if ($confirmationPointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmationPointer)
        }
        if ($password) { $password.Dispose() }
        if ($confirmation) { $confirmation.Dispose() }
        $passwordText = $null
        $confirmationText = $null
    }
}

# Explicit BOM-free UTF-8 works with JSON.parse on Windows PowerShell 5.1 too.
$json = ($configuration | ConvertTo-Json) + [Environment]::NewLine
[IO.File]::WriteAllText($configurationPath, $json, (New-Object System.Text.UTF8Encoding($false)))
if ($Disable) {
    Write-Host 'Developer panel disabled; the previous verifier was removed.'
} else {
    Write-Host 'Developer panel verifier updated. The password was not written to disk.'
}
Write-Host 'Run node scripts/build-game.mjs before starting or publishing the game.'
