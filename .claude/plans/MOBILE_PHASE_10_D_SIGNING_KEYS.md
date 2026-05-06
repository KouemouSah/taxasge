# Mobile Signing Keys — Reference

**Date** : 2026-05-02
**Phase parent** : Phase 10/D (Publication Play Store)
**Audience** : DevOps + Play Console admin

---

## 1. Android — Upload key (developer-side)

The Facil mobile Android app is signed at the **upload-key** layer with a single
keystore that lives in two places :

| Location | Purpose |
|----------|---------|
| `packages/mobile/android/app/facil-release.keystore` | Local file (committed git for EAS Cloud + GitHub Actions builds, password is NOT in repo) |
| GitHub Secret `ANDROID_KEYSTORE_BASE64` | Base64 of the same keystore, decoded by `mobile-build.yml` at native-build time |

### 1.1 Credentials (in GitHub repo Settings → Secrets and variables → Actions)
- `ANDROID_KEYSTORE_PASSWORD` — store password
- `ANDROID_KEY_ALIAS` — key alias (`facil-release`)
- `ANDROID_KEY_PASSWORD` — key password

### 1.2 Fingerprints — Facil Mobile (citizen) UPLOAD keystore

**Captured 2026-05-02 from EAS-managed keystore** (`@emacsah__facil-keystore.bak.jks` downloaded
from https://expo.dev/accounts/emacsah/projects/facil/credentials → Phase F.6 Play Console
developer registration step).

| Field | Value |
|-------|-------|
| Alias | `b9520ded4f892b6ed2b0ef8afede0bbd` (EAS auto-generated) |
| Validity | 2026-03-30 → **2053-08-15** (~27 years) |
| Signature algorithm | `SHA256withRSA` |
| **SHA-1** | `30:CA:7A:88:25:95:09:18:56:EF:40:62:54:88:41:E2:19:4C:34:4F` |
| **SHA-256** | `C4:78:D6:B0:6D:88:5F:E6:20:AA:DB:B7:2B:00:73:F4:57:C1:64:F8:47:9E:63:D5:AC:78:3B:3C:23:AD:87:1E` |

**SHA-256 used for** :
- Play Console developer verification (package name registration step) — selected option 1 in
  the developer keys list at the registration dialog
- Play App Signing enrolment (Phase F.6 first AAB upload)
- Firebase Cloud Messaging (FCM) sender authentication if needed
- Google Sign-In (if added later)

**Local extraction command** (for future re-verification with the EAS-downloaded keystore):
```bash
"/c/Program Files/Android/Android Studio/jbr/bin/keytool.exe" -list -v \
  -keystore "<path-to-EAS-keystore.jks>" \
  -alias "b9520ded4f892b6ed2b0ef8afede0bbd" \
  -storepass "<password-from-credentials.md>"
```

**Note** : This SHA-256 corresponds to the upload key (signed by us, then re-signed by Google
via Play App Signing once enrolled). After Play App Signing enrolment, end users / FCM /
Google Sign-In APIs will see the **app signing key** SHA-256 instead — a different fingerprint
that lives only inside Google's KMS. Capture it from Play Console → App integrity once the
first AAB is uploaded (Phase F.6).

---

## 2. Play App Signing — Google-managed signing key

Once the AAB is uploaded for the first time on Play Console (Phase F), Google
prompts for **Play App Signing** :

| Choice | Implication |
|--------|-------------|
| ✅ **Enrol** (RECOMMENDED) | Google generates an "app signing key" they control. Our keystore becomes the **upload key**. Each AAB we upload is signed by us, then re-signed by Google before distribution. |
| ❌ Don't enrol | We are responsible for the signing key forever. If lost, we must publish a new app under a new package ID. |

### 2.1 Enrolment procedure (one-off, Phase F)

1. Play Console → Facil app → **Setup → App integrity**
2. App Signing → "Use Play App Signing"
3. Choose **"Export and upload a key from Java keystore"** (we have one)
4. Download the **PEPK tool** (Play Encrypt Private Key)
5. Run the PEPK CLI :
   ```bash
   java -jar pepk.jar \
     --keystore=facil-release.keystore \
     --alias=facil-release \
     --output=facil-app-signing-key.zip \
     --include-cert \
     --rsa-aes-encryption \
     --encryption-key-path=<DOWNLOADED_PUBLIC_KEY_PEM>
   ```
6. Upload the resulting `.zip` to Play Console
7. Google extracts the private key, stores it in their KMS, deletes the upload from their staging
8. **Lock-in** : after this step, only AABs signed with the upload key are accepted

### 2.2 What changes after enrolment

- The fingerprint visible to **end users / FCM / Google Sign-In** = **app signing key SHA-1/SHA-256** (different from upload key !). Capture both from Play Console → App integrity.
- We continue to sign with the upload key in CI ; Google re-signs.
- We can **rotate the upload key** later via Play Console without breaking existing installs (Play Console regenerates a new upload key, signs it for us).

---

## 3. iOS — Apple distribution (V1.1, gated by Apple Dev Program)

Not deployed in V1 — see Master Plan §11. Will use :
- App Store Connect API key (`.p8`) uploaded once via `eas credentials --platform ios`
- EAS handles provisioning profile + cert auto-renewal

---

## 4. Service Account — Play Developer API (EAS submit)

Created during Phase D.3 (2026-05-02) for the EAS Submit pipeline :

| Field | Value |
|-------|-------|
| Service account email | `play-publisher@taxasge-dev.iam.gserviceaccount.com` |
| GCP project | `taxasge-dev` (`392159428433`) |
| GCP secret holding JSON key | `google-play-service-account` (project `taxasge-dev`) |
| GitHub Secret (base64 of JSON) | `GOOGLE_PLAY_SA_JSON_BASE64` (repo `KouemouSah/taxasge`) |
| Play Console role | "Manage testing tracks" for Facil only (V1 — production promotion stays manual) |
| Created by | `kouemou.sah@gmail.com` (gcloud session 2026-05-02) |
| Initial JSON key ID | (visible via `gcloud iam service-accounts keys list --iam-account=play-publisher@...`) |

### 4.1 Rotation procedure (annual best practice)

```bash
# 1. Generate a new key
TMP_KEY=$(mktemp --suffix=.json)
gcloud iam service-accounts keys create "$TMP_KEY" \
  --iam-account=play-publisher@taxasge-dev.iam.gserviceaccount.com \
  --project=taxasge-dev

# 2. Add to GCP secret as a new version
gcloud secrets versions add google-play-service-account \
  --data-file="$TMP_KEY" \
  --project=taxasge-dev

# 3. Sync to GitHub secret base64
base64 -w0 "$TMP_KEY" | \
  gh secret set GOOGLE_PLAY_SA_JSON_BASE64 --repo=KouemouSah/taxasge

# 4. Cleanup local key
rm -f "$TMP_KEY"

# 5. Disable old key (after verifying new one works via dry-run)
OLD_KEY_ID=<old-key-id>
gcloud iam service-accounts keys disable $OLD_KEY_ID \
  --iam-account=play-publisher@taxasge-dev.iam.gserviceaccount.com

# 6. (After 7-day grace) delete the disabled key
gcloud iam service-accounts keys delete $OLD_KEY_ID \
  --iam-account=play-publisher@taxasge-dev.iam.gserviceaccount.com
```

### 4.2 Verification post-creation

```bash
# Verify key is fresh and valid
gcloud secrets versions access latest \
  --secret=google-play-service-account \
  --project=taxasge-dev | jq '.client_email, .type'
# Expected output:
# "play-publisher@taxasge-dev.iam.gserviceaccount.com"
# "service_account"

# Verify GitHub secret exists
gh secret list --repo=KouemouSah/taxasge | grep GOOGLE_PLAY_SA_JSON_BASE64
```

---

## 5. Security checklist

- [ ] Keystore password length ≥ 16 chars
- [ ] Keystore stored encrypted (GitHub Secret + EAS Cloud, never in plaintext repo)
- [ ] Service account JSON key length ≥ 1.5KB after base64 decode (sanity check in `mobile-eas-submit.yml`)
- [ ] Service account has minimum permissions ("Manage testing tracks" only, NOT "Owner" or "Admin")
- [ ] Rotation cadence : 12 months for service account JSON key, 24 months for keystore
- [ ] Audit trail : all keys generated via `gcloud iam service-accounts keys create` are logged in GCP Audit Logs

---

## 6. Changelog

- **2026-05-02 v1.0** : Initial document. Service account `play-publisher` created, GCP Secret `google-play-service-account` v1 active, GitHub Secret `GOOGLE_PLAY_SA_JSON_BASE64` synced. Keystore fingerprints TODO once password is captured.
