/**
 * Babel-Plugin: `import { ChevronRightIcon } from "lucide-react-native"` wird zu
 * `import ChevronRightIcon from "lucide-react-native/icons/chevron-right"`.
 *
 * Der Einstieg von lucide-react-native lädt alle ~1.900 Icons (1,5 MB im Bundle); Metro kürzt das
 * ohne Tree Shaking nicht. Über die Einzeldateien landen nur die benutzten Icons im Bundle.
 * Die Zuordnung Name → Datei (inkl. Aliasse wie `CheckCircle2` → circle-check) stammt aus dem
 * ESM-Einstieg des Pakets. Typen (`type LucideIcon`) und Unbekanntes bleiben beim Paket-Import.
 */
const fs = require('node:fs');
const path = require('node:path');

const PACKAGE = 'lucide-react-native';

function loadIconFiles() {
  // `package.json` ist nicht exportiert: vom CommonJS-Einstieg (dist/cjs/…) zum Paketordner
  const root = path.resolve(path.dirname(require.resolve(PACKAGE)), '../..');
  const entry = path.join(root, 'dist/esm/lucide-react-native.mjs');
  const files = new Map();
  const pattern = /export \{([^}]+)\} from '\.\/icons\/([^']+)\.mjs';/g;
  for (const [, names, file] of fs.readFileSync(entry, 'utf8').matchAll(pattern)) {
    for (const part of names.split(',')) {
      const name = part.trim().replace(/^default as /, '');
      if (name) files.set(name, file);
    }
  }
  return files;
}

module.exports = function lucideImports({ types: t }) {
  const files = loadIconFiles();

  return {
    name: 'lucide-imports',
    visitor: {
      ImportDeclaration(declaration) {
        const { node } = declaration;
        if (node.source.value !== PACKAGE || node.importKind === 'type') return;

        const icons = [];
        const rest = [];
        for (const specifier of node.specifiers) {
          const file =
            t.isImportSpecifier(specifier) &&
            specifier.importKind !== 'type' &&
            files.get(t.isIdentifier(specifier.imported) ? specifier.imported.name : specifier.imported.value);
          if (file) {
            icons.push(
              t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(specifier.local.name))],
                t.stringLiteral(`${PACKAGE}/icons/${file}`)
              )
            );
          } else {
            rest.push(specifier);
          }
        }
        if (icons.length === 0) return;

        if (rest.length > 0) {
          node.specifiers = rest;
          // Nur noch Typen übrig (`{ type LucideIcon }`): als `import type` markieren, sonst bliebe
          // `import {} from "lucide-react-native"` stehen und lüde wieder alle Icons
          if (rest.every((specifier) => specifier.importKind === 'type')) {
            for (const specifier of rest) specifier.importKind = null;
            node.importKind = 'type';
          }
          declaration.insertAfter(icons);
        } else {
          declaration.replaceWithMultiple(icons);
        }
      },
    },
  };
};
