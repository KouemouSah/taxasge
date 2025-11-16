# Inspection détaillée dossiers dépréciés

$GCLOUD_BIN = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
$BUCKET = "gs://taxasge-dev.firebasestorage.app"
$env:Path = "$GCLOUD_BIN;$env:Path"

Write-Host "Inspection app-assets/:" -ForegroundColor Yellow
& gcloud storage ls -l -r "$BUCKET/app-assets/"

Write-Host "`nInspection tax-attachments/:" -ForegroundColor Yellow
& gcloud storage ls -l -r "$BUCKET/tax-attachments/"
