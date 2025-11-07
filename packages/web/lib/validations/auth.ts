/**
 * Schémas de validation Zod pour l'authentification
 * Basé sur les contrats API backend (TASK-AUTH-FIX-003)
 */

import { z } from 'zod';

/**
 * Schéma de validation pour le login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(6, 'Minimum 6 caractères'),
  remember_me: z.boolean().optional(),
});

/**
 * Schéma de validation pour l'inscription (Two-step process)
 *
 * IMPORTANT: Aligned with schema_taxage.sql users table (lines 1044-1078)
 * All fields map to REAL database columns only.
 *
 * Contraintes:
 * - Téléphone: OBLIGATOIRE, préfixes autorisés (222, 555, 551, 333), 9 chiffres total
 * - Mot de passe: Min 8 chars, avec majuscule, minuscule, chiffre, caractère spécial
 * - Role: OBLIGATOIRE, défaut = citizen
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  verification_code: z
    .string()
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins 1 majuscule requise')
    .regex(/[a-z]/, 'Au moins 1 minuscule requise')
    .regex(/[0-9]/, 'Au moins 1 chiffre requis')
    .regex(/[^A-Za-z0-9]/, 'Au moins 1 caractère spécial requis'),
  first_name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  last_name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(50, 'Maximum 50 caractères'),
  phone: z
    .string()
    .regex(/^(222|555|551|333)\d{6}$/, 'Format: 222/555/551/333 + 6 chiffres (ex: 222123456)'),
  role: z.enum(['citizen', 'business'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }).default('citizen'),

  // Optional: Basic contact info (exist in users table)
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
