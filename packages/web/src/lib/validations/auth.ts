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
 * Schéma de validation pour l'inscription
 * Phone: Guinée Équatoriale format (222|555|551 + 6 chiffres = 9 total)
 * Role: citizen (défaut) ou business
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
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
    .regex(/^(222|555|551)\d{6}$/, 'Le numéro doit commencer par 222, 555 ou 551 et contenir 9 chiffres au total')
    .length(9, 'Le numéro doit contenir exactement 9 chiffres'),
  role: z.enum(['citizen', 'business'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }).default('citizen'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
