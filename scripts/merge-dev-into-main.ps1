param(
  [string]$Source = "dev",
  [string]$Target = "main"
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

Write-Host "Mergeando '$Source' -> '$Target' SIN traer artículos/imágenes..." -ForegroundColor Cyan

Assert-CleanWorktree

git fetch --all --prune | Out-Null

git checkout $Target | Out-Null

git pull --ff-only | Out-Null

# Hacemos el merge pero sin commit, para poder restaurar rutas seleccionadas.
# Nota: si hay conflictos, resuélvelos primero, y luego ejecuta solo los pasos de restaurar+commit.
Write-Host "Ejecutando merge (todavía sin commit)..." -ForegroundColor Cyan
$mergeExit = 0
try {
  git merge --no-ff --no-commit "origin/$Source" | Out-Null
} catch {
  $mergeExit = 1
}

if ($mergeExit -ne 0) {
  Write-Host "El merge reportó conflictos. Resuélvelos y luego ejecuta:" -ForegroundColor Yellow
  Write-Host "  git restore --source=HEAD --staged --worktree articles public/images" -ForegroundColor Yellow
  Write-Host "  git commit" -ForegroundColor Yellow
  exit 1
}

# CRÍTICO: conservar el contenido de la rama destino (main) para estas carpetas, incluyendo borrados.
Write-Host "Restaurando articles/ y public/images/ desde '$Target' (manteniendo contenido de PROD)..." -ForegroundColor Cyan

# HEAD todavía apunta al commit pre-merge de la rama destino (porque usamos --no-commit).
# Restaurar desde HEAD revierte cualquier resultado del merge bajo esas rutas (altas/ediciones/borrados).
try { git restore --source=HEAD --staged --worktree articles | Out-Null } catch {}
try { git restore --source=HEAD --staged --worktree public/images | Out-Null } catch {}

Write-Host "Creando commit del merge..." -ForegroundColor Cyan

git commit -m "Merge $Source into $Target (mantener contenido de $Target)" | Out-Null

Write-Host "Listo. Ahora haz push con: git push" -ForegroundColor Green
