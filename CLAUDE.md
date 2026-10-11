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
- Formulare: TanStack Form + Zod
- Gesten/Animation: react-native-gesture-handler, Reanimated 4, react-native-reorderable-list
- Transfer: react-native-zeroconf + react-native-tcp-socket; Datei-Export über expo-sharing
- Rezepte: API Ninjas Recipe API v3, nur Free Tier
- Paketmanager: **pnpm**. Entwicklungs-Build (`expo-dev-client`), kein Expo Go (native Module).

### Noch zu installieren (laut Spezifikation)

`expo-image-picker`, `expo-document-picker`, `buffer` – jeweils in der Phase, die sie braucht. `react-native-awesome-gallery` wird durch den gluestack Image Viewer ersetzt (Phase 3).

Vorhanden: `@expo-google-fonts/manrope`, `expo-localization`, `expo-navigation-bar` (Navigationsleiste folgt dem Thema), `expo-haptics`, `expo-keep-awake`, dev: `drizzle-kit`, `babel-plugin-inline-import`. `expo-secure-store` ist entfernt.

**Patch `react-native-css@3.0.4`** (`patches/`, eingetragen in `pnpm-workspace.yaml`, Stellen mit „Basko-Patch“ markiert), beide Fehler auch in 3.0.7 noch vorhanden:
1. Der Metro-Transformer las `inlineRem` aus dem falschen Objekt → rem war 14 statt 16 (`text-base` 14 px, `h-11` 38,5 px).
2. `TextInput` mappt `textAlign` mit `true`; die Laufzeit rief darauf `.split` auf → „undefined is not a function“ bei `text-center` & Co. auf Eingabefeldern.
Bei einem Update von `react-native-css` prüfen, ob der Patch noch nötig ist.

## Befehle

```bash
pnpm install
pnpm start            # expo start (Dev-Client)
pnpm android          # expo start --android
pnpm lint
pnpm expo install <pkg>          # Expo-kompatible Version installieren
pnpm db:generate                 # Drizzle-Migration aus dem Schema erzeugen (src/lib/db/migrations)
```

**Sheets:** gluestack **BottomSheet** (`src/components/ui/bottomsheet`, @gorhom/bottom-sheet), nicht Actionsheet. Im App-Code immer über `Sheet` aus `src/components/sheet.tsx`: `isOpen`, `onDismiss` (nur wenn die Nutzerin selbst schließt), `onClosed` (nach jeder Schließ-Animation), optional `fullHeight` = 90 % mit `BottomSheetScrollView`. Nie zwei Sheets gleichzeitig öffnen/schließen – beim Wechsel das nächste erst in `onClosed` des vorigen öffnen (siehe `AddItemsSheets`). Eingabefelder im Sheet melden sich über `useSheetKeyboardHandlers()` an (die Formularfelder tun das schon), damit das Sheet über die Tastatur wandert. Damit ein Sheet beim Zuschieben seinen Inhalt behält: `useLastDefined`.
**Dialoge:** `Dialog` aus `src/components/dialog.tsx` (AlertDialog + Platzhalter in Tastaturhöhe).

**Toasts:** eigener Host `AppToastProvider` (`src/components/toast-host.tsx`), liegt in `_layout.tsx` außerhalb von `GluestackUIProvider`, damit er über allen Overlay-Portalen (Sheets, Dialoge) rendert. Ein Stapel `bottom-24` mit `gap-2`, max. 3 Toasts, über der Tastatur angehoben. Aufruf über `useAppToast()` → `showToast({ title, action?, withCheck?, duration? })`. Den gluestack-`ToastProvider`/`useToast` nicht verwenden – der rendert jeden Toast in eigener SafeArea und stapelt mit großen Lücken.

**Formulare:** TanStack Form wie in digi-list – `useAppForm`/`withForm` aus `src/lib/form`, Felder über `form.AppField` (`field.TextField`, `field.QuantityField`, `field.UnitField`, `field.ColorField`), Absenden über `form.AppForm` + `form.SubmitButton`. Feld-Komponenten liegen in `src/components/form` und sind unabhängig vom Einsatzort (Dialog, Sheet, Zeile). Schemas in `src/lib/validation.ts` mit Zod (ohne drizzle-zod – dessen Typen sind mit Zod 4.6 unbrauchbar), Grenzen aus den Konstanten des DB-Schemas.

**gluestack-Komponenten:** Die CLI (`gluestack-ui@alpha add`) fällt derzeit auf die v4-Vorlagen zurück, die `cssInterop` aus NativeWind 4 nutzen und hier nicht laufen. Neue Komponenten daher aus GitHub `gluestack/gluestack-ui`, Branch `main`, Ordner `src/components/ui/<name>` übernehmen (NativeWind-5-Vorlagen) und auf unsere Tokens umstellen. `styled()` nie direkt auf `Animated.createAnimatedComponent(...)` anwenden – das lässt den TypeScript-Check hängen; stattdessen `src/components/ui/utils/animated.ts` nutzen.

## Ordner

- `src/app` – Routen (expo-router). Tabs: Listen (Start), Produkte, Transfer, Rezepte. Stack-Screens ohne Tab-Leiste: Einkaufsmodus, Liste bearbeiten, Einstellungen, Ladenreihenfolge, Geräteauswahl, Rezept-Details.
- `src/components/ui` – gluestack-Komponenten (generiert, an unsere Tokens angepasst)
- `src/components` – eigene Komponenten (SwipeRow, Stepper, ColorSwatchPicker …)
- `src/lib/db` – Drizzle-Client, Schema (`schema/`), Migrationen (`migrations/`, generiert), `seed.ts` (Standard-Kategorien + „Sonstiges“), `purge.ts` (Soft-Deletes beim Start), `id.ts` (`newId()` – IDs immer explizit setzen, kein `$defaultFn` mit expo-crypto im Schema)
- `src/lib/i18n` – `t("schlüssel", { platzhalter })`, Texte in `locales/de.ts`; Pluralformen `{ one, other }` mit `count`
- `src/lib/queries` – DB-Funktionen je Bereich (`lists.ts`, `list-items.ts`, `products.ts`), synchron, nur Drizzle-Builder
- `src/lib` – außerdem `settings.ts`, `theme.ts`, `units.ts` (Codes, Schritte, Umrechnung, Eingabe), `format.ts` (Mengen-Anzeige), `search.ts` + `product-search.ts` (Suche/Ranking), `list-grouping.ts` (Ladenreihenfolge), `list-name.ts` (Namensregel „(n)“), `haptics.ts`, `query-keys.ts`
- `src/hooks` – `useAppSetup`, `useSettings`, TanStack-Hooks je Bereich (`use-lists`, `use-list-items`, `use-catalog`), `useAppToast`, `useUndoableDelete` (Löschen mit Rückgängig), `useSheetKeyboardHandlers`, `useLastDefined`
- `src/lib/form` + `src/components/form` – TanStack-Form-Hook und wiederverwendbare Felder; `src/lib/validation.ts` – Zod-Schemas
- Routen: `src/app/(tabs)/index.tsx` (Listen), `src/app/list/[id]/index.tsx` (Einkaufsmodus), `src/app/list/[id]/edit.tsx` (Liste bearbeiten)

## Konventionen

- TypeScript strict, Import-Alias `@/` → `src/`.
- Code und Bezeichner auf Englisch, UI-Texte auf Deutsch – aber **nie hart im Code**: alle Texte über die eigene i18n-Schicht mit `expo-localization` (vorerst nur Deutsch). Rezeptinhalte bleiben Englisch (API).
- Styling nur über NativeWind-Klassen mit den semantischen Tokens `bg`, `surface`, `ink`, `soft`, `line`, `chip`, `primary`, `primary-ink`, `amber`, `danger` (hell/dunkel, Werte in der Spezifikation, definiert in `src/global.css`). Die Tailwind-Farbskalen sind entfernt; zusätzlich gibt es nur `white`, `black` und die Listenfarben `list-blue`/`list-purple`. Keine Hex-Werte in Komponenten.
- **Keine Pixelwerte** in Klassen, immer die Tailwind-Skala (1 Einheit = 4 px, 1-px-Schritte über 0.25: `h-7.5` = 30, `px-2.25` = 9). Ausnahmen nur für Radien wie `rounded-[999px]` (statt `rounded-full`) oder `rounded-[5px]`.
- **Schriftgrößen nur über `text-xs` … `text-2xl`** (Basis 16 px), keine `text-[…px]`. Designwerte runden: 11–12,5 → `xs`, 13–14 → `sm`, 15–16 → `base`, 17–18 → `lg`, 19–20 → `xl`.
- **Bedingte Klassen immer mit `cn()`** aus `@gluestack-ui/utils/nativewind-utils`, nie mit Template-Strings.
- Maß-Tokens: `rounded-card` (14), `rounded-thumb` (10), `px-page` (18), `py-row` (13).
- Eingabefelder: `Input size="default"` (48) oder `size="sm"` (44); `InputField` übernimmt die Höhe über den Style-Kontext, damit der Text mittig sitzt. In Formularen: `field.TextField size=…`.
- Animierte Views mit `className` über `StyledAnimatedView` aus `src/components/ui/utils/animated.ts` (inkl. `layout`/`entering`/`exiting`).
- **Datenbank: nur das Builder-Pattern** (`db.select().from(…)`, `insert`, `update`, `delete`), nicht die Query-API (`db.query.…`). Abfragen laufen synchron; Hooks invalidieren danach `queryKeys.lists` bzw. `queryKeys.products`.
- Texte immer mit `Text` aus `@/components/ui/text` (Manrope, Standard 500). Manrope ist nativ eingebunden (expo-font-Plugin in `app.json`), Gewichte über `font-medium` … `font-extrabold`.
- Units werden als Code gespeichert (`pcs`, `kg`, …) und über `t("units.<code>")` angezeigt.
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
- Einstellungen liegen in der Tabelle `settings` (nicht SecureStore), werden beim Start synchron gelesen und über `useSettings()` aus dem Query-Cache gelesen.
- Transfer: Haken werden nicht übertragen; Konflikt = gleicher Produktname mit anderer Kategorie oder anderen Fotos (Vergleich per Datei-Hash); unbekannte Kategorie → „Sonstiges“. Format-Versionsfeld im JSON.
- Dateien: Liste `.basko`, Sicherung `.baskobackup` (beide auch von außerhalb öffnbar).
- Rezepte: API-Key aus `EXPO_PUBLIC_API_NINJAS_KEY` (`.env`), Suche nur nach Titel bei Bestätigung, max. 5 Treffer, kein „Mehr laden“.

## Umsetzungsphasen

1. ✓ Fundament: Tokens hell/dunkel, gluestack-Theming, Manrope, Tab-Leiste, i18n, Drizzle-Schema + Migrationen + Seed (inkl. „Sonstiges“), `settings`, Theme beim Start, gluestack-Basiskomponenten (eigene Komponenten wie SwipeRow, Stepper kommen mit ihrer Phase)
2. ✓ Listen-Übersicht, Liste bearbeiten, Einkaufsmodus
   - Entschieden: „1 Produkt“ im Singular. „‚{Suchtext}‘ neu anlegen“ öffnet bis Phase 3 direkt das Hinzufügen-Sheet; das Produkt entsteht erst beim Absenden in „Sonstiges“ (ohne Sheet 4d, `addNewProductToList`). Zahnrad, „Über Netzwerk senden“ und „Als Datei exportieren“ sind bis Phase 4/6 sichtbar, aber deaktiviert. Vorschaubild-Tipp → Vollbild folgt mit Phase 3.
3. Produkte (Fotos, Bildansicht), Kategorien, Ladenreihenfolge
4. Transfer über Netzwerk, Datei-Export/-Import
5. Rezepte
6. Einstellungen, Sicherung/Wiederherstellung
