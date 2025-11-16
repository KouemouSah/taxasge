# Script PowerShell - Création structure Firebase Storage
# Conforme storage.rules - 11 dossiers

$GCLOUD_BIN = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
$BUCKET = "gs://taxasge-dev.firebasestorage.app"

# Ajouter gcloud au PATH pour cette session
$env:Path = "$GCLOUD_BIN;$env:Path"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "CREATION STRUCTURE FIREBASE STORAGE FINALE" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Bucket: $BUCKET"
Write-Host "================================================================================"

# Structure des 11 dossiers (storage.rules)
$folders = @(
    @{name="user-documents"; desc="Documents utilisateurs declarations"; example="user-documents/{userId}/{applicationId}/{fileName}"},
    @{name="profile-pictures"; desc="Photos de profil"; example="profile-pictures/{userId}/{fileName}"},
    @{name="official-documents"; desc="Documents officiels"; example="official-documents/{category}/{fileName}"},
    @{name="tax-forms"; desc="Templates formulaires fiscaux"; example="tax-forms/{formId}/{fileName}"},
    @{name="application-attachments"; desc="Pieces jointes declarations"; example="application-attachments/{applicationId}/{fileName}"},
    @{name="system-assets"; desc="Assets systeme (logos, templates)"; example="system-assets/{assetType}/{fileName}"},
    @{name="backups"; desc="Backups - admin only"; example="backups/{backupId}/{fileName}"},
    @{name="temp-uploads"; desc="Uploads temporaires (15min)"; example="temp-uploads/{userId}/{sessionId}/{fileName}"},
    @{name="reports"; desc="Rapports analytics - officials"; example="reports/{reportType}/{fileName}"},
    @{name="audit-documents"; desc="Documents audit - admin"; example="audit-documents/{year}/{month}/{fileName}"},
    @{name="notification-attachments"; desc="PJ notifications"; example="notification-attachments/{notificationId}/{fileName}"}
)

# Créer dossier temporaire
$tempDir = New-Item -ItemType Directory -Path "$env:TEMP\firebase_structure_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Force
Write-Host "`nDossier temporaire: $tempDir" -ForegroundColor Yellow

$created = 0
$failed = 0

foreach ($folder in $folders) {
    $num = $created + $failed + 1
    Write-Host "`n[$num/$($folders.Count)] Creation: $($folder.name)/" -ForegroundColor Green
    Write-Host "    Description: $($folder.desc)"
    Write-Host "    Structure: $($folder.example)"

    # Créer fichier .keep local
    $keepContent = @"
# $($folder.name)/

$($folder.desc)

Structure: $($folder.example)
Source: storage.rules
Date creation: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Ce fichier .keep initialise le dossier dans Firebase Storage.
"@

    $localFile = Join-Path $tempDir "$($folder.name)_keep.txt"
    $keepContent | Out-File -FilePath $localFile -Encoding UTF8

    # Upload vers Firebase Storage
    $remotePath = "$BUCKET/$($folder.name)/_placeholder/.keep"
    Write-Host "    Upload vers: $remotePath" -ForegroundColor Yellow

    try {
        & gcloud storage cp $localFile $remotePath 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    [OK] Cree: $($folder.name)/" -ForegroundColor Green
            $created++
        } else {
            Write-Host "    [ERREUR] Echec creation $($folder.name)/" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "    [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

# Summary
Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Total dossiers: $($folders.Count)"
Write-Host "Crees avec succes: $created" -ForegroundColor Green
Write-Host "Echecs: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($created -eq $folders.Count) {
    Write-Host "`n[OK] Structure Firebase Storage creee avec succes!" -ForegroundColor Green
} else {
    Write-Host "`n[ATTENTION] $failed dossiers n'ont pas pu etre crees" -ForegroundColor Yellow
}

Write-Host "================================================================================" -ForegroundColor Cyan

# Vérification finale
Write-Host "`nVerification structure creee..." -ForegroundColor Yellow
& gcloud storage ls $BUCKET/

exit $(if ($failed -eq 0) { 0 } else { 1 })
