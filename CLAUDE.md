# Basko – Hinweise für Claude

Basko ist eine private Einkaufslisten-App (Expo / React Native) für Android und iOS. Alle Daten liegen lokal in SQLite; es gibt kein Konto und keinen Server. Basko ist der saubere Nachfolger von `digi-list` (Nachbarordner `../digi-list`, nur als Referenz für alten Code).

## Quellen der Wahrheit

1. **Spezifikation** – „Basko – App-Spezifikation“
   - Live-Dokument: https://claude.ai/code/artifact/b34d56c0-1c9e-4def-ada0-833ec0da8812
   - Kopie im claude.ai-Projekt „Basko“: `Basko – App-Spezifikation.md`
   - Sie beschreibt jedes Verhalten. Wo Spezifikation und Design abweichen, gilt die Spezifikation.
2. **Design** – Claude-Design-Projekt „Basko“ (`Basko.dc.html`, 10 Bereiche, 57 Screens, 380 × 800)
   - https://claude.ai/design/p/448fe483-f502-4c86-9c92-f1eb6a2dce67?file=Basko.dc.html
   - Kopie im claude.ai-Projekt: `Basko Mobile Design.html`
   - Screen-IDs (1a, 3e·2, 6h …) aus dem Design werden in Code-Kommentaren und Gesprächen als Referenz benutzt.
3. **digi-list** – nur Referenz: TCP-Protokoll (`src/lib/transfer/tcp-transfer.ts`), Export (`src/hooks/use-export-list.ts`), Migrations-Setup (`drizzle.config.ts`, `metro.config.js`).

**Arbeitsregel:** Nicht raten. Weicht etwas von der Spezifikation ab oder ist es dort nicht geregelt, zuerst nachfragen. Wird eine Entscheidung geändert, die Spezifikation mit aktualisieren.

## Stack

- Expo 57, React Native 0.86, React 19, React Compiler aktiv, typed routes
- expo-router (Dateibasiertes Routing in `src/app`), Tabs selbst gebaut mit `expo-router/ui`
- gluestack-ui v5 (alpha) + NativeWind 5 (Tailwind 4, `src/global.css`)
- SQLite: expo-sqlite + Drizzle ORM (`src/lib/db`), Daten über TanStack Query
- Formulare: TanStack Form + Zod (`drizzle-zod`)
- Gesten/Animation: react-native-gesture-handler, Reanimated 4, react-native-reorderable-list
- Transfer: react-native-zeroconf + react-native-tcp-socket; Datei-Export über expo-sharing
- Rezepte: API Ninjas Recipe API v3, nur Free Tier
- Paketmanager: **pnpm**. Entwicklungs-Build (`expo-dev-client`), kein Expo Go (native Module).

### Noch zu installieren (laut Spezifikation)

`@expo-google-fonts/manrope`, `expo-image-picker`, `expo-document-picker`, `expo-keep-awake`, `expo-haptics`, `expo-localization`, `buffer`; dev: `drizzle-kit`, `babel-plugin-inline-import` (Migrations-SQL wie in digi-list). gluestack-Komponenten per CLI: button, input, alert-dialog, modal, actionsheet, toast, badge, spinner, popover, image-viewer. `react-native-awesome-gallery` wird durch den gluestack Image Viewer ersetzt.

## Befehle

```bash
pnpm install
pnpm start            # expo start (Dev-Client)
pnpm android          # expo start --android
pnpm lint
pnpm expo install <pkg>          # Expo-kompatible Version installieren
pnpm dlx gluestack-ui@latest add <komponente>
```

## Ordner

- `src/app` – Routen (expo-router). Tabs: Listen (Start), Produkte, Transfer, Rezepte. Stack-Screens ohne Tab-Leiste: Einkaufsmodus, Liste bearbeiten, Einstellungen, Ladenreihenfolge, Geräteauswahl, Rezept-Details.
- `src/components/ui` – gluestack-Komponenten (generiert, an unsere Tokens angepasst)
- `src/components` – eigene Komponenten (SwipeRow, Stepper, ColorSwatchPicker …)
- `src/lib/db` – Drizzle-Client und Schema (`schema/`); Migrationen kommen nach `src/lib/db/migrations`
- `src/lib` – Query-Client, Konstanten, später Queries, Transfer, i18n

## Konventionen

- TypeScript strict, Import-Alias `@/` → `src/`.
- Code und Bezeichner auf Englisch, UI-Texte auf Deutsch – aber **nie hart im Code**: alle Texte über die eigene i18n-Schicht mit `expo-localization` (vorerst nur Deutsch). Rezeptinhalte bleiben Englisch (API).
- Styling nur über NativeWind-Klassen mit den semantischen Tokens `bg`, `surface`, `ink`, `soft`, `line`, `chip`, `primary`, `primary-ink`, `amber`, `danger` (hell/dunkel, Werte in der Spezifikation). Keine Hex-Werte in Komponenten – Ausnahme: Listenfarben Blau `#3E6B8A`/Lila `#7A5CA3`, zentral definiert.
- Schrift Manrope 500–800; Icons `lucide-react-native` (nächstliegendes Icon).
- Maße: Radius 14 / 999 / 10, Seitenabstand 18, Touch-Fläche min. 44.
- IDs: UUID als Text (`expo-crypto`).
- Zahlen mit deutschem Komma anzeigen; Eingabe akzeptiert Komma und Punkt.
- Commits im Stil `feat: …`, `refactor: …`, `fix: …` (Conventional Commits), wie bisher.

## Fachregeln, die leicht übersehen werden

- Produkte sind ein globaler Katalog; **Menge, Einheit, Notiz hängen am Listeneintrag**, nicht am Produkt. `product.lastQuantity/lastUnit` dienen nur als Vorbelegung.
- Produkt- und Kategorienamen eindeutig **ohne** Beachtung der Groß-/Kleinschreibung. Suche: Teilwort, case-insensitive, umlauttolerant.
- Kategorie „Sonstiges“ (`isSystem`) existiert immer, steht immer am Ende, ist nicht umbenenn-/löschbar und erscheint nicht in der Ladenreihenfolge.
- Einheiten fest: Stk, kg, g, l, ml + 12 weitere (Schritt 1). Schritte: Stk 1, kg/l 0,1, g/ml 50. kg↔g und l↔ml umrechnen, sonst Standardwert. Minus ausgegraut bei Menge ≤ Schrittweite. Menge > 0, max. 2 Nachkommastellen.
- Sortierung in Einkaufsmodus **und** Bearbeiten: Kategorien in Ladenreihenfolge, darin alphabetisch (im Einkaufsmodus offene vor erledigten).
- Löschen mit Rückgängig = Soft-Delete über `deletedAt`, endgültig nach 5 s und beim App-Start.
- Namenskollision bei Listen → „Name (n)“ mit nächster freier Zahl.
- Einstellungen liegen in der Tabelle `settings` (nicht SecureStore) – der aktuelle `ThemeProvider` mit SecureStore wird ersetzt.
- Transfer: Haken werden nicht übertragen; Konflikt = gleicher Produktname mit anderer Kategorie oder anderen Fotos (Vergleich per Datei-Hash); unbekannte Kategorie → „Sonstiges“. Format-Versionsfeld im JSON.
- Dateien: Liste `.basko`, Sicherung `.baskobackup` (beide auch von außerhalb öffnbar).
- Rezepte: API-Key aus `EXPO_PUBLIC_API_NINJAS_KEY` (`.env`), Suche nur nach Titel bei Bestätigung, max. 5 Treffer, kein „Mehr laden“.

## Umsetzungsphasen

1. Fundament: Tokens hell/dunkel, gluestack-Theming, Manrope, Tab-Leiste, i18n, Drizzle-Schema + Migrationen + Seed (inkl. „Sonstiges“), `settings`, Theme beim Start, Basis-Komponenten
2. Listen-Übersicht, Liste bearbeiten, Einkaufsmodus
3. Produkte (Fotos, Bildansicht), Kategorien, Ladenreihenfolge
4. Transfer über Netzwerk, Datei-Export/-Import
5. Rezepte
6. Einstellungen, Sicherung/Wiederherstellung
