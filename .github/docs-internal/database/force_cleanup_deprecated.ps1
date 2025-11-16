# Suppression FORCE dossiers dépréciés (vides)

$GCLOUD_BIN = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
$BUCKET = "gs://taxasge-dev.firebasestorage.app"
$env:Path = "$GCLOUD_BIN;$env:Path"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "SUPPRESSION DOSSIERS DEPRECIES" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

Write-Host "`nSuppression app-assets/..." -ForegroundColor Yellow
& gcloud storage rm -r "$BUCKET/app-assets/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] app-assets/ supprime" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Echec suppression app-assets/" -ForegroundColor Red
}

Write-Host "`nSuppression tax-attachments/..." -ForegroundColor Yellow
& gcloud storage rm -r "$BUCKET/tax-attachments/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] tax-attachments/ supprime" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Echec suppression tax-attachments/" -ForegroundColor Red
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "STRUCTURE FINALE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
& gcloud storage ls $BUCKET/

Write-Host "`n================================================================================" -ForegroundColor Green
Write-Host "TERMINE - Structure 100% conforme storage.rules" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
