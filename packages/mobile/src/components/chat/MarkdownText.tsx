/**
 * TaxasGE Mobile - Markdown Text Component
 * Composant pour afficher du texte avec formatage Markdown basique
 * Date: 2025-11-07
 *
 * Supporte:
 * - **texte** → Gras
 * - *texte* → Italique
 * - `code` → Code inline
 * - [lien](url) → Liens (affichés en bleu)
 * - • Liste → Bullets
 * - 1. Liste → Numérotation
 * - ### Titre → Headers
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

export interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
  boldStyle?: TextStyle;
  italicStyle?: TextStyle;
  codeStyle?: TextStyle;
  linkStyle?: TextStyle;
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string;
  header?: number; // 1, 2, 3 for h1, h2, h3
}

/**
 * Parse le texte Markdown en segments
 */
function parseMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  // Patterns regex
  const patterns = {
    bold: /\*\*(.+?)\*\*/g, // **texte**
    italic: /\*(.+?)\*/g, // *texte* (mais pas **)
    code: /`(.+?)`/g, // `code`
    link: /\[([^\]]+)\]\(([^)]+)\)/g, // [texte](url)
    header: /^(#{1,3})\s+(.+)$/gm, // ### Titre
  };

  // Helper pour ajouter un segment de texte normal
  const addNormalText = (start: number, end: number) => {
    if (start < end) {
      const normalText = text.substring(start, end);
      if (normalText) {
        segments.push({ text: normalText });
      }
    }
  };

  // Trouver tous les matches de tous les patterns
  const allMatches: Array<{
    index: number;
    length: number;
    type: 'bold' | 'italic' | 'code' | 'link' | 'header';
    content: string;
    url?: string;
    level?: number;
  }> = [];

  // Bold: **texte**
  let match;
  while ((match = patterns.bold.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      type: 'bold',
      content: match[1],
    });
  }

  // Italic: *texte* (mais pas dans **)
  // Reset regex
  patterns.italic.lastIndex = 0;
  while ((match = patterns.italic.exec(text)) !== null) {
    // Vérifier que ce n'est pas partie de **
    const isBold =
      text[match.index - 1] === '*' ||
      text[match.index + match[0].length] === '*';

    if (!isBold) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'italic',
        content: match[1],
      });
    }
  }

  // Code: `texte`
  patterns.code.lastIndex = 0;
  while ((match = patterns.code.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      type: 'code',
      content: match[1],
    });
  }

  // Links: [texte](url)
  patterns.link.lastIndex = 0;
  while ((match = patterns.link.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      type: 'link',
      content: match[1],
      url: match[2],
    });
  }

  // Headers: ### Titre
  patterns.header.lastIndex = 0;
  while ((match = patterns.header.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      type: 'header',
      content: match[2],
      level: match[1].length,
    });
  }

  // Trier par index
  allMatches.sort((a, b) => a.index - b.index);

  // Construire les segments
  allMatches.forEach((m) => {
    // Ajouter texte normal avant ce match
    addNormalText(currentIndex, m.index);

    // Ajouter le segment formaté
    switch (m.type) {
      case 'bold':
        segments.push({ text: m.content, bold: true });
        break;
      case 'italic':
        segments.push({ text: m.content, italic: true });
        break;
      case 'code':
        segments.push({ text: m.content, code: true });
        break;
      case 'link':
        segments.push({ text: m.content, link: m.url });
        break;
      case 'header':
        segments.push({ text: m.content, header: m.level });
        break;
    }

    currentIndex = m.index + m.length;
  });

  // Ajouter le reste du texte
  addNormalText(currentIndex, text.length);

  return segments;
}

/**
 * Composant MarkdownText
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  style,
  boldStyle,
  italicStyle,
  codeStyle,
  linkStyle,
}) => {
  const segments = parseMarkdown(children);

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        // Déterminer le style
        const segmentStyles: TextStyle[] = [];

        if (segment.bold) {
          segmentStyles.push(styles.bold, boldStyle || {});
        }

        if (segment.italic) {
          segmentStyles.push(styles.italic, italicStyle || {});
        }

        if (segment.code) {
          segmentStyles.push(styles.code, codeStyle || {});
        }

        if (segment.link) {
          segmentStyles.push(styles.link, linkStyle || {});
        }

        if (segment.header) {
          segmentStyles.push(
            segment.header === 1
              ? styles.h1
              : segment.header === 2
              ? styles.h2
              : styles.h3
          );
        }

        return (
          <Text key={index} style={segmentStyles}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 13,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  h1: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 4,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 3,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 2,
  },
});

export default MarkdownText;
