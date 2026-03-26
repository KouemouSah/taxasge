/**
 * License Simulator — 3-step wizard
 *
 * Step 1: Select commerce type (10 types)
 * Step 2: Select zone (A1-D3)
 * Step 3: Results (fee breakdown + total + documents)
 *
 * Uses GET /service-bundles/commerce-types, /zones, /simulator
 */

import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, FlatList, Pressable, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text, Button, ActivityIndicator, Divider, Chip, Snackbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import { useAppTheme } from '@core/theme';
import { AppMenuButton } from '@components/ui/app-menu';
import { useCommerceTypes, useZones, useSimulate } from '@modules/bundles';
import type { CommerceType, CommerceZone, SimulatorFeeGroup } from '@modules/bundles';

const COMMERCE_ICONS: Record<string, string> = {
  abaceria: 'store',
  bar_restaurante: 'silverware-fork-knife',
  cafeteria_pasteleria: 'coffee',
  carpinteria: 'hammer',
  clinica_farmacia: 'medical-bag',
  discoteca: 'music',
  ferreteria: 'wrench',
  taller_bloqueria: 'cog',
  taller_artesanal: 'palette',
  video_club: 'filmstrip',
};

function formatAmount(n: number): string {
  return n.toLocaleString('es-GQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' XAF';
}

// ---------------------------------------------------------------------------
// Client-side translations (10 commerce types + fee labels + misc)
// ---------------------------------------------------------------------------

const I18N_COMMERCE: Record<string, Record<string, string>> = {
  abaceria:            { fr: 'Épiceries, Comptoirs et Commerce Général', en: 'Grocery Stores & General Commerce' },
  bar_restaurante:     { fr: 'Bars et Restaurants', en: 'Bars & Restaurants' },
  cafeteria_pasteleria:{ fr: 'Cafétérias, Pâtisseries et Snack-bars', en: 'Cafeterias, Bakeries & Snack Bars' },
  carpinteria:         { fr: 'Menuiseries en Général', en: 'Carpentry Shops' },
  clinica_farmacia:    { fr: 'Cliniques, Pharmacies et Similaires', en: 'Clinics, Pharmacies & Similar' },
  discoteca:           { fr: 'Discothèques et Similaires', en: 'Nightclubs & Similar' },
  ferreteria:          { fr: 'Quincailleries', en: 'Hardware Stores' },
  taller_bloqueria:    { fr: 'Ateliers et Parpaingeries', en: 'Workshops & Block Factories' },
  taller_artesanal:    { fr: 'Ateliers et Boutiques Artisanales', en: 'Craft Workshops & Stores' },
  video_club:          { fr: 'Vidéo Clubs et Similaires', en: 'Video Clubs & Similar' },
};

const I18N_FEE_TYPE: Record<string, Record<string, string>> = {
  tesoro:    { es: 'TESORO PÚBLICO', fr: 'TRÉSOR PUBLIC', en: 'PUBLIC TREASURY' },
  municipal: { es: 'AYUNTAMIENTO', fr: 'MUNICIPALITÉ', en: 'MUNICIPALITY' },
  chamber:   { es: 'CÁMARA DE COMERCIO', fr: 'CHAMBRE DE COMMERCE', en: 'CHAMBER OF COMMERCE' },
};

const I18N_MISC: Record<string, Record<string, string>> = {
  plazos:        { es: 'Plazos', fr: 'Échelonné', en: 'Installments' },
  tier:          { es: 'Tier', fr: 'Niveau', en: 'Tier' },
  total_anual:   { es: 'TOTAL ANUAL', fr: 'TOTAL ANNUEL', en: 'ANNUAL TOTAL' },
  docs_requis:   { es: 'Documentos requeridos', fr: 'Documents requis', en: 'Required documents' },
};

function tr(dict: Record<string, Record<string, string>>, key: string, lang: string, fallback?: string): string {
  return dict[key]?.[lang] ?? fallback ?? key;
}

// ---------------------------------------------------------------------------
// Step 1: Commerce Type
// ---------------------------------------------------------------------------

const COMMERCE_COLORS: Record<string, string> = {
  abaceria: '#2E7D32', bar_restaurante: '#E65100', cafeteria_pasteleria: '#6A1B9A',
  carpinteria: '#4E342E', clinica_farmacia: '#C62828', discoteca: '#1565C0',
  ferreteria: '#37474F', taller_bloqueria: '#00695C', taller_artesanal: '#AD1457', video_club: '#283593',
};

function Step1({ types, onSelect, colors, lang }: { types: CommerceType[]; onSelect: (t: CommerceType) => void; colors: any; lang: string }) {
  return (
    <FlatList
      data={types}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <Divider style={{ marginLeft: 64 }} />}
      renderItem={({ item }) => {
        const iconColor = COMMERCE_COLORS[item.commerce_type] || colors.primary;
        const label = tr(I18N_COMMERCE, item.commerce_type, lang, item.name_es);
        return (
          <Pressable
            onPress={() => onSelect(item)}
            style={s.typeRow}
            android_ripple={{ color: colors.primaryContainer }}
          >
            <View style={[s.typeIcon, { backgroundColor: iconColor + '18' }]}>
              <MaterialCommunityIcons
                name={(COMMERCE_ICONS[item.commerce_type] || 'store') as any}
                size={24}
                color={iconColor}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{label}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
          </Pressable>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Step 2: Zone
// ---------------------------------------------------------------------------

const TIER_META: Record<string, { color: string; icon: string; labelKey: string }> = {
  A: { color: '#1B5E20', icon: 'city-variant-outline', labelKey: 'tier_a' },
  B: { color: '#E65100', icon: 'office-building-outline', labelKey: 'tier_b' },
  C: { color: '#4A148C', icon: 'home-city-outline', labelKey: 'tier_c' },
  D: { color: '#37474F', icon: 'home-outline', labelKey: 'tier_d' },
};

const I18N_TIER: Record<string, Record<string, string>> = {
  tier_a: { es: 'Capitales de Región', fr: 'Capitales de Région', en: 'Regional Capitals' },
  tier_b: { es: 'Capitales de Provincia', fr: 'Capitales de Province', en: 'Provincial Capitals' },
  tier_c: { es: 'Capitales Distritales', fr: 'Capitales de District', en: 'District Capitals' },
  tier_d: { es: 'Consejos de Poblados', fr: 'Conseils de Villages', en: 'Village Councils' },
};

const I18N_ZONE: Record<string, Record<string, string>> = {
  A1: { fr: 'Capitales de Régions', en: 'Regional Capitals' },
  A2: { fr: 'Capitales de Régions (2)', en: 'Regional Capitals (2)' },
  A3: { fr: 'Capitales de Régions (3)', en: 'Regional Capitals (3)' },
  B1: { fr: 'Capitales de Provinces', en: 'Provincial Capitals' },
  B2: { fr: 'Capitales de Provinces (2)', en: 'Provincial Capitals (2)' },
  B3: { fr: 'Capitales de Provinces (3)', en: 'Provincial Capitals (3)' },
  C1: { fr: 'Capitales de Districts et Municipalités', en: 'District & Municipal Capitals' },
  C2: { fr: 'Capitales de Districts (2)', en: 'District Capitals (2)' },
  C3: { fr: 'Capitales de Districts (3)', en: 'District Capitals (3)' },
  D1: { fr: 'Conseils de Villages', en: 'Village Councils' },
  D2: { fr: 'Conseils de Villages (2)', en: 'Village Councils (2)' },
  D3: { fr: 'Conseils de Villages (3)', en: 'Village Councils (3)' },
};

const I18N_ZONE_DESC: Record<string, Record<string, string>> = {
  A1: { fr: 'Malabo, Bata — centres commerciaux principaux', en: 'Malabo, Bata — main commercial centers' },
  A2: { fr: 'Malabo, Bata — zones secondaires', en: 'Malabo, Bata — secondary zones' },
  A3: { fr: 'Malabo, Bata — périphérie', en: 'Malabo, Bata — outskirts' },
  B1: { fr: 'Ebebiyin, Mongomo, Evinayong et similaires', en: 'Ebebiyin, Mongomo, Evinayong and similar' },
  B2: { fr: 'Capitales provinciales — zones secondaires', en: 'Provincial capitals — secondary zones' },
  B3: { fr: 'Capitales provinciales — périphérie', en: 'Provincial capitals — outskirts' },
  C1: { fr: 'Luba, Riaba, Niefang, Anisok et similaires', en: 'Luba, Riaba, Niefang, Anisok and similar' },
  C2: { fr: 'Districts — zones secondaires', en: 'Districts — secondary zones' },
  C3: { fr: 'Districts — périphérie', en: 'Districts — outskirts' },
  D1: { fr: 'Villages principaux', en: 'Main villages' },
  D2: { fr: 'Villages secondaires', en: 'Secondary villages' },
  D3: { fr: 'Villages ruraux reculés', en: 'Remote rural villages' },
};

function Step2({ zones, onSelect, colors, lang }: { zones: CommerceZone[]; onSelect: (z: CommerceZone) => void; colors: any; lang: string }) {
  const tiers = ['A', 'B', 'C', 'D'];
  const grouped = tiers.map((tier) => ({
    tier,
    meta: TIER_META[tier],
    zones: zones.filter((z) => z.zone_tier === tier),
  }));

  // All tiers expanded by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ A: true, B: true, C: true, D: true });

  const toggle = (tier: string) => setExpanded((prev) => ({ ...prev, [tier]: !prev[tier] }));

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {grouped.map((group) => (
        <View key={group.tier} style={{ backgroundColor: group.meta.color + '0A' }}>
          {/* Tier header — tappable to collapse */}
          <Pressable
            onPress={() => toggle(group.tier)}
            style={[s.tierHeader, { borderLeftColor: group.meta.color, backgroundColor: group.meta.color + '15' }]}
          >
            <MaterialCommunityIcons name={group.meta.icon as any} size={20} color={group.meta.color} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700', color: group.meta.color }}>
                {tr(I18N_MISC, 'tier', lang)} {group.tier}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                {tr(I18N_TIER, group.meta.labelKey, lang)}
              </Text>
            </View>
            <Text variant="labelSmall" style={{ color: colors.outline, marginRight: 8 }}>{group.zones.length} zones</Text>
            <MaterialCommunityIcons
              name={expanded[group.tier] ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.outline}
            />
          </Pressable>

          {/* Zone rows — collapsible */}
          {expanded[group.tier] && group.zones.map((zone, i) => (
            <View key={zone.id}>
              <Pressable
                onPress={() => onSelect(zone)}
                style={s.zoneItem}
                android_ripple={{ color: colors.primaryContainer }}
              >
                <View style={[s.zoneBadge, { backgroundColor: group.meta.color }]}>
                  <Text variant="labelMedium" style={{ color: '#fff', fontWeight: '700' }}>{zone.zone_code}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodyMedium">{tr(I18N_ZONE, zone.zone_code, lang, zone.name_es)}</Text>
                  <Text variant="labelSmall" style={{ color: colors.outline }} numberOfLines={1}>
                    {tr(I18N_ZONE_DESC, zone.zone_code, lang, zone.description_es || '')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
              </Pressable>
              {i < group.zones.length - 1 && <Divider style={{ marginLeft: 64 }} />}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Results
// ---------------------------------------------------------------------------

const FEE_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  tesoro: { bg: '#1565C0', text: '#fff', light: '#E3F2FD' },
  municipal: { bg: '#2E7D32', text: '#fff', light: '#E8F5E9' },
  chamber: { bg: '#6A1B9A', text: '#fff', light: '#F3E5F5' },
};

async function generateQrDataUrl(url: string): Promise<string> {
  try {
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(url, { width: 80, margin: 1, errorCorrectionLevel: 'M' });
  } catch {
    return '';
  }
}

async function buildPdfHtmlAsync(data: any): Promise<string> {
  const date = new Date().toLocaleDateString('es-GQ', { year: 'numeric', month: 'long', day: 'numeric' });
  const verifyUrl = `https://taxasge.emacsah.com/licencias-comerciales?commerce=${data.bundle?.commerce_type}&zone=${data.zone?.zone_code}`;

  // Generate real QR code (same library as web)
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  // Build fee sections with ministry grouping
  const feeSections = (data.fee_groups || []).map((g: any) => {
    const fc = FEE_COLORS[g.fee_type] || { bg: '#0D6E3F', text: '#fff', light: '#E8F5E9' };

    // Group items by ministry
    const byMinistry: Record<string, any[]> = {};
    for (const it of (g.items || [])) {
      const mKey = it.ministry_name || 'Otros';
      if (!byMinistry[mKey]) byMinistry[mKey] = [];
      byMinistry[mKey].push(it);
    }

    const ministryBlocks = Object.entries(byMinistry).map(([ministry, items]) => {
      const rows = items.map((it: any) =>
        `<tr><td style="padding:4px 12px;border-bottom:1px solid #eee;font-size:8.5pt">${it.service_name}</td><td style="padding:4px 12px;text-align:right;border-bottom:1px solid #eee;font-size:8.5pt;white-space:nowrap">${formatAmount(parseFloat(it.amount))}</td></tr>`
      ).join('');
      const ministrySubtotal = items.reduce((s: number, it: any) => s + parseFloat(it.amount), 0);
      return `
        <tr><td colspan="2" style="padding:5px 12px;font-size:8pt;font-weight:600;color:#555;background:#fafafa;border-bottom:1px solid #e0e0e0">${ministry}</td></tr>
        ${rows}
        <tr><td style="padding:4px 12px;font-size:8pt;font-weight:500;color:#888">Subtotal ${ministry.split(' ').slice(0, 3).join(' ')}</td><td style="padding:4px 12px;text-align:right;font-size:8pt;font-weight:600;color:#555">${formatAmount(ministrySubtotal)}</td></tr>
      `;
    }).join('');

    return `
      <div style="border:1px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:12px;background:${fc.light}">
        <div style="background:${fc.bg};color:${fc.text};padding:8px 12px;font-weight:700;font-size:10pt">${g.label_es || g.fee_type}</div>
        <table>${ministryBlocks}</table>
        <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#f0f0f0;font-weight:700;font-size:9.5pt;border-top:2px solid ${fc.bg}">
          <span>Subtotal</span><span style="color:${fc.bg}">${formatAmount(parseFloat(g.subtotal))}</span>
        </div>
      </div>
    `;
  }).join('');

  const docs = (data.documents || []).map((d: any) =>
    `<li style="padding:2px 0;font-size:8.5pt">${d.document_name_es || d}</li>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:12mm}
    *{box-sizing:border-box}
    body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;color:#333;font-size:9pt}
    table{width:100%;border-collapse:collapse}
  </style></head><body>

    <!-- HEADER -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #333;padding-bottom:8px;margin-bottom:8px">
      <div>
        <div style="font-size:16pt;font-weight:800;color:#0D6E3F;letter-spacing:1px">FACIL</div>
        <div style="font-size:7pt;color:#666">Plataforma de Servicios Fiscales</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12pt;font-weight:700;letter-spacing:2px">FICHA TARIFARIA</div>
        <div style="font-size:7pt;color:#666">Licencias Comerciales — República de Guinea Ecuatorial</div>
      </div>
    </div>

    <!-- METADATA -->
    <div style="display:flex;justify-content:space-between;font-size:8pt;color:#555;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #ddd">
      <span><strong>Tipo:</strong> ${data.bundle?.name_es}</span>
      <span><strong>Zona:</strong> ${data.zone?.zone_code} — ${data.zone?.name_es}</span>
      <span><strong>Ref.:</strong> Decreto Presidencial</span>
      <span>${date}</span>
    </div>

    <!-- FEE SECTIONS (grouped by ministry) -->
    ${feeSections}

    <!-- GRAND TOTAL -->
    <div style="text-align:center;padding:14px;border-radius:6px;margin:14px 0;border:2px solid #0D6E3F">
      <div style="font-size:9pt;font-weight:500;color:#555">TOTAL ANUAL</div>
      <div style="font-size:20pt;font-weight:800;letter-spacing:1px;color:#0D6E3F">${formatAmount(parseFloat(data.grand_total))}</div>
    </div>

    <!-- DOCUMENTS -->
    ${docs ? `<div style="margin-top:12px"><div style="font-size:10pt;font-weight:600;color:#0D6E3F;margin-bottom:6px">Documentos requeridos</div><ul style="margin:0;padding-left:18px">${docs}</ul></div>` : ''}

    <!-- FOOTER with real QR -->
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:24px;padding-top:10px;border-top:1px solid #999;font-size:7pt;color:#888">
      <div>
        <div style="font-weight:600;color:#555">FACIL — Plataforma de Servicios Fiscales</div>
        <div>República de Guinea Ecuatorial</div>
        <div style="margin-top:3px;font-style:italic">Documento informativo. Precios sujetos a modificaciones según normativa vigente.</div>
        <div style="margin-top:2px">${date}</div>
      </div>
      ${qrDataUrl ? `
        <div style="text-align:center">
          <img src="${qrDataUrl}" width="64" height="64" style="display:block"/>
          <div style="font-size:6pt;margin-top:2px">Verificar en línea</div>
        </div>
      ` : ''}
    </div>
  </body></html>`;
}

function buildTextNote(data: any): string {
  const lines: string[] = [];
  lines.push('📋 FICHA TARIFARIA — FACIL');
  lines.push(`${data.bundle?.name_es}`);
  lines.push(`${data.zone?.name_es} (${data.zone?.zone_code}) — Tier ${data.zone?.zone_tier}`);
  lines.push('');
  for (const g of (data.fee_groups || [])) {
    lines.push(`▸ ${g.label_es || g.fee_type}`);
    for (const it of (g.items || [])) {
      lines.push(`  ${it.service_name}: ${formatAmount(parseFloat(it.amount))}`);
    }
    lines.push(`  Subtotal: ${formatAmount(parseFloat(g.subtotal))}`);
    lines.push('');
  }
  lines.push(`💰 TOTAL ANUAL: ${formatAmount(parseFloat(data.grand_total))}`);
  if (data.documents?.length) {
    lines.push('');
    lines.push('📄 Documents requis:');
    for (const d of data.documents) {
      lines.push(`  • ${d.document_name_es || d}`);
    }
  }
  lines.push('');
  lines.push(`Generado por Facil — ${new Date().toLocaleDateString('es-GQ')}`);
  return lines.join('\n');
}

function Step3({ data, colors, t, lang }: { data: any; colors: any; t: any; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(buildTextNote(data));
    setCopied(true);
  };

  const handleDownload = async () => {
    try {
      const html = await buildPdfHtmlAsync(data);
      const { uri } = await Print.printToFileAsync({ html });
      if (await isAvailableAsync()) {
        await shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Ficha Tarifaria' });
      }
    } catch (_) {
      await Share.share({ title: 'Ficha Tarifaria', message: buildTextNote(data) });
    }
  };

  const handleShare = async () => {
    try {
      const html = await buildPdfHtmlAsync(data);
      const { uri } = await Print.printToFileAsync({ html });
      if (await isAvailableAsync()) {
        await shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Ficha Tarifaria' });
      }
    } catch (_) {
      await Share.share({ title: 'Ficha Tarifaria', message: buildTextNote(data) });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }}>
        {/* Header */}
        <View style={[s.resultHeader, { backgroundColor: colors.primaryContainer }]}>
          <Text variant="titleMedium" style={{ fontWeight: '600', color: colors.onPrimaryContainer }}>
            {tr(I18N_COMMERCE, data.bundle?.commerce_type, lang, data.bundle?.name_es)}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onPrimaryContainer }}>
            {data.zone?.name_es} ({data.zone?.zone_code}) — {tr(I18N_MISC, 'tier', lang)} {data.zone?.zone_tier}
          </Text>
        </View>

        {/* Fee groups */}
        {data.fee_groups?.map((group: SimulatorFeeGroup, gi: number) => (
          <View key={gi}>
            <Text variant="labelLarge" style={{ color: colors.primary, marginBottom: 4 }}>
              {tr(I18N_FEE_TYPE, group.fee_type, lang, group.label_es || group.fee_type)}
            </Text>
            {group.items.map((item: any, ii: number) => (
              <View key={ii} style={s.feeRow}>
                <Text variant="bodySmall" style={{ flex: 1, color: colors.onSurface }}>{item.service_name}</Text>
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>{formatAmount(parseFloat(item.amount))}</Text>
              </View>
            ))}
            <Divider style={{ marginVertical: 8 }} />
            <View style={s.feeRow}>
              <Text variant="bodyMedium" style={{ fontWeight: '600' }}>Subtotal</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '700', color: colors.primary }}>{formatAmount(parseFloat(group.subtotal))}</Text>
            </View>
          </View>
        ))}

        {/* Grand total */}
        <View style={[s.totalCard, { backgroundColor: colors.primary }]}>
          <Text variant="titleSmall" style={{ color: colors.onPrimary }}>{tr(I18N_MISC, 'total_anual', lang)}</Text>
          <Text variant="headlineSmall" style={{ color: colors.onPrimary, fontWeight: '700' }}>
            {formatAmount(parseFloat(data.grand_total))}
          </Text>
        </View>

        {/* Documents */}
        {data.documents?.length > 0 && (
          <View>
            <Text variant="labelLarge" style={{ color: colors.primary, marginBottom: 8 }}>
              {t('licenses.requiredDocs')}
            </Text>
            {data.documents.map((doc: any, i: number) => (
              <View key={i} style={s.docRow}>
                <MaterialCommunityIcons name="file-check-outline" size={18} color={colors.outline} />
                <Text variant="bodySmall" style={{ marginLeft: 8, flex: 1 }}>{doc.document_name_es || doc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons inline after documents */}
        <View style={s.actionBar}>
          <Button mode="outlined" icon="content-copy" onPress={handleCopy} compact style={{ flex: 1 }}>
            {t('licenses.copy')}
          </Button>
          <Button mode="outlined" icon="download-outline" onPress={handleDownload} compact style={{ flex: 1 }}>
            {t('licenses.download')}
          </Button>
          <Button mode="contained" icon="share-variant" onPress={handleShare} compact style={{ flex: 1 }}>
            {t('licenses.share')}
          </Button>
        </View>
      </ScrollView>

      <Snackbar visible={copied} onDismiss={() => setCopied(false)} duration={2000}>
        {t('licenses.copied')}
      </Snackbar>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LicenciasScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'es') as string;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<CommerceType | null>(null);
  const [selectedZone, setSelectedZone] = useState<CommerceZone | null>(null);

  const { data: types, isLoading: typesLoading } = useCommerceTypes();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: simResult, isLoading: simLoading } = useSimulate(
    selectedType?.commerce_type ?? '',
    selectedZone?.zone_code ?? '',
  );

  const handleSelectType = useCallback((t: CommerceType) => {
    setSelectedType(t);
    setStep(2);
  }, []);

  const handleSelectZone = useCallback((z: CommerceZone) => {
    setSelectedZone(z);
    setStep(3);
  }, []);

  const handleRestart = useCallback(() => {
    setSelectedType(null);
    setSelectedZone(null);
    setStep(1);
  }, []);

  const stepTitle = step === 1
    ? t('licenses.selectType')
    : step === 2
      ? t('licenses.selectZone')
      : t('licenses.results');

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Pressable onPress={() => (step === 1 ? router.back() : setStep((step - 1) as 1 | 2))} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>{t('licenses.title')}</Text>
          <Text variant="labelSmall" style={{ color: colors.outline }}>{stepTitle} ({step}/3)</Text>
        </View>
        {step === 3 && (
          <Button mode="text" compact onPress={handleRestart} icon="restart">{t('licenses.restart')}</Button>
        )}
        <AppMenuButton />
      </View>

      {/* Content */}
      {step === 1 && (typesLoading ? <LoadingView colors={colors} /> : types && <Step1 types={types} onSelect={handleSelectType} colors={colors} lang={lang} />)}
      {step === 2 && (zonesLoading ? <LoadingView colors={colors} /> : zones && <Step2 zones={zones} onSelect={handleSelectZone} colors={colors} lang={lang} />)}
      {step === 3 && (simLoading ? <LoadingView colors={colors} /> : simResult && <Step3 data={simResult} colors={colors} t={t} lang={lang} />)}
    </SafeAreaView>
  );
}

function LoadingView({ colors }: { colors: any }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  typeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FAFAFA', borderLeftWidth: 4 },
  zoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  zoneBadge: { width: 36, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  resultHeader: { padding: 16, borderRadius: 12, gap: 4 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  totalCard: { padding: 20, borderRadius: 12, alignItems: 'center', gap: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  actionBar: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
