/**
 * TaxasGE Mobile - Output Generated FAQs
 *
 * This script outputs the generated FAQs to a TypeScript file
 * that can be imported into chatbotFaqSeed.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { GENERATED_CHATBOT_FAQS } from './generate-faqs-from-seed';

// Output path
const OUTPUT_PATH = path.join(__dirname, '../src/database/seed/generated-faqs.ts');

// Generate TypeScript file content
const fileContent = `/**
 * TaxasGE Mobile - Generated Chatbot FAQs
 *
 * Auto-generated from generate-faqs-from-seed.ts
 * Generated on: ${new Date().toISOString()}
 * Total FAQs: ${GENERATED_CHATBOT_FAQS.length}
 */

import { ChatbotFAQ } from '../../types/chatbot.types';

export const GENERATED_FAQS: Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] = ${JSON.stringify(GENERATED_CHATBOT_FAQS, null, 2)};
`;

// Write to file
fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf8');

console.log(`\n✅ FAQs written to: ${OUTPUT_PATH}`);
console.log(`📊 Total FAQs: ${GENERATED_CHATBOT_FAQS.length}`);
console.log(`📁 File size: ${(Buffer.byteLength(fileContent) / 1024).toFixed(2)} KB\n`);

// Also output SQL statements
const SQL_PATH = path.join(__dirname, '../src/database/seed/generated-faqs.sql');

const sqlStatements = GENERATED_CHATBOT_FAQS.map(faq => {
  const escapeSql = (str: string | null) => {
    if (str === null) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
  };

  return `INSERT INTO chatbot_faqs (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  ${escapeSql(faq.id)},
  ${escapeSql(faq.question_pattern)},
  ${escapeSql(faq.intent)},
  ${escapeSql(faq.response_es)},
  ${escapeSql(faq.response_fr)},
  ${escapeSql(faq.response_en)},
  ${escapeSql(faq.follow_up_suggestions)},
  ${escapeSql(faq.actions)},
  ${escapeSql(faq.keywords)},
  ${faq.priority},
  ${faq.is_active}
);`;
}).join('\n\n');

const sqlContent = `-- TaxasGE Mobile - Generated Chatbot FAQs
-- Auto-generated from generate-faqs-from-seed.ts
-- Generated on: ${new Date().toISOString()}
-- Total FAQs: ${GENERATED_CHATBOT_FAQS.length}

${sqlStatements}
`;

fs.writeFileSync(SQL_PATH, sqlContent, 'utf8');

console.log(`✅ SQL written to: ${SQL_PATH}`);
console.log(`📁 File size: ${(Buffer.byteLength(sqlContent) / 1024).toFixed(2)} KB\n`);
