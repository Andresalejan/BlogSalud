param(
  # Rama origen (lo que quieres traer)
  [string]$Source = "main",
  # Rama destino (donde vas a aplicar el merge)
  [string]$Target = "dev",
  # Rutas que NO deben venir de $Source (se conservan desde $Target)
  # Por defecto: artículos e imágenes.
  [string[]]$KeepPaths = @("articles", "public/images")
)

$ErrorActionPreference = "Stop"

function Assert-CleanWorktree {
  $status = git status --porcelain
  if ($status) {
    Write-Host "El árbol de trabajo no está limpio. Haz commit o stash antes de continuar." -ForegroundColor Red
    Write-Host $status
    exit 1
  }
}

$keepText = ($KeepPaths -join ", ")
Write-Host "Mergeando '$Source' -> '$Target' SIN traer: $keepText" -ForegroundColor Cyan

Assert-CleanWorktree

git fetch --all --prune | Out-Null

git checkout $Target | Out-Null

git pull --ff-only | Out-Null

# Hacemos el merge pero sin commit, para poder restaurar rutas seleccionadas.
# Nota: si hay conflictos, resuélvelos primero, y luego ejecuta solo los pasos de restore+commit.
Write-Host "Ejecutando merge (todavía sin commit)..." -ForegroundColor Cyan
$mergeExit = 0
try {
  git merge --no-ff --no-commit "origin/$Source" | Out-Null
} catch {
  $mergeExit = 1
}

if ($mergeExit -ne 0) {
  Write-Host "El merge reportó conflictos. Resuélvelos y luego ejecuta:" -ForegroundColor Yellow
  foreach ($p in $KeepPaths) {
    Write-Host "  git restore --source=HEAD --staged --worktree $p" -ForegroundColor Yellow
  }
  Write-Host "  git commit" -ForegroundColor Yellow
  exit 1
}

# CRÍTICO: conservar el contenido de la rama destino ($Target) para estas rutas, incluyendo borrados.
# HEAD todavía apunta al commit pre-merge de la rama destino (porque usamos --no-commit).
Write-Host "Restaurando rutas conservadas desde '$Target' (manteniendo contenido de DESTINO)..." -ForegroundColor Cyan

foreach ($p in $KeepPaths) {
  try { git restore --source=HEAD --staged --worktree $p | Out-Null } catch {}
}

Write-Host "Creando commit del merge..." -ForegroundColor Cyan

git commit -m "Merge $Source into $Target (mantener ${Target}: $keepText)" | Out-Null

Write-Host "Listo. Ahora haz push con: git push" -ForegroundColor Green
