-- Script pour promouvoir un utilisateur en admin
-- Utilisez ce script dans l'éditeur SQL de Supabase

-- 1. D'abord, lister tous les utilisateurs pour identifier l'email
SELECT
    id,
    email,
    role,
    first_name,
    last_name,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- 2. Promouvoir un utilisateur spécifique en admin
-- Remplacez 'VOTRE_EMAIL@example.com' par l'email de l'utilisateur à promouvoir
UPDATE users
SET
    role = 'admin',
    updated_at = NOW()
WHERE email = 'VOTRE_EMAIL@example.com'
RETURNING
    id,
    email,
    role,
    first_name,
    last_name;

-- 3. Vérifier que le changement a été appliqué
SELECT
    id,
    email,
    role,
    first_name,
    last_name
FROM users
WHERE email = 'VOTRE_EMAIL@example.com';
