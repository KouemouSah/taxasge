# Script PowerShell - Nettoyage dossiers dépréciés Firebase Storage

$GCLOUD_BIN = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
$BUCKET = "gs://taxasge-dev.firebasestorage.app"

# Ajouter gcloud au PATH
$env:Path = "$GCLOUD_BIN;$env:Path"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "NETTOYAGE DOSSIERS DEPRECIES - FIREBASE STORAGE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$deprecatedFolders = @(
    @{path="app-assets/"; replacement="system-assets/"},
    @{path="tax-attachments/"; replacement="application-attachments/"}
)

foreach ($folder in $deprecatedFolders) {
    Write-Host "`nSuppression: $($folder.path)" -ForegroundColor Yellow
    Write-Host "  Remplace par: $($folder.replacement)" -ForegroundColor Green

    # Vérifier si le dossier contient des fichiers
    Write-Host "  Verification contenu..." -ForegroundColor Yellow
    $files = & gcloud storage ls -r "$BUCKET/$($folder.path)" 2>&1

    if ($LASTEXITCODE -eq 0 -and $files) {
        $fileCount = ($files | Where-Object { $_ -match '\.(.*?)$' }).Count
        Write-Host "  Trouve: $fileCount fichiers" -ForegroundColor Yellow

        if ($fileCount -gt 0) {
            Write-Host "  [ATTENTION] Dossier contient $fileCount fichiers!" -ForegroundColor Red
            Write-Host "  [SKIP] Migration manuelle requise" -ForegroundColor Red
            continue
        }
    }

    # Supprimer le dossier (vide)
    Write-Host "  Suppression du dossier vide..." -ForegroundColor Yellow
    & gcloud storage rm -r "$BUCKET/$($folder.path)" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Supprime: $($folder.path)" -ForegroundColor Green
    } else {
        Write-Host "  [ERREUR] Echec suppression" -ForegroundColor Red
    }
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION STRUCTURE FINALE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

& gcloud storage ls $BUCKET/

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "[OK] Nettoyage termine" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
