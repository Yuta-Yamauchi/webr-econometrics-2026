$ErrorActionPreference = 'Stop'
$serverPath = Join-Path $PSScriptRoot 'serve.py'
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 $serverPath @args
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python $serverPath @args
} else {
    throw 'Python 3 is required to run the local server. See README.md.'
}
