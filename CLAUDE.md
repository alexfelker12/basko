# Basko – Hinweise für Claude

Basko ist eine private Einkaufslisten-App (Expo / React Native) für Android und iOS. Alle Daten liegen lokal in SQLite; es gibt kein Konto und keinen Server. Basko ist der saubere Nachfolger von `digi-list` (Nachbarordner `../digi-list`, nur als Referenz für alten Code).

## Quellen der Wahrheit

1. **Spezifikation** – „Basko – App-Spezifikation“
   - Live-Dokument: https://claude.ai/code/artifact/b34d56c0-1c9e-4def-ada0-833ec0da8812
   - Kopie im claude.ai-Projekt „Basko“: `Basko – App-Spezifikation.md` (Markdown-Export des Live-Dokuments; nach Änderungen am Live-Dokument neu exportieren)
   - Sie beschreibt jedes Verhalten. Wo Spezifikation und Design abweichen, gilt die Spezifikation.
2. **Design** – Claude-Design-Projekt „Basko“ (`Basko.dc.html`, 10 Bereiche, 57 Screens, 380 × 800)
   - https://claude.ai/design/p/448fe483-f502-4c86-9c92-f1eb6a2dce67?file=Basko.dc.html
   - Kopie im claude.ai-Projekt: `Basko Mobile Design.html`
   - Screen-IDs (1a, 3e·2, 6h …) aus dem Design werden in Code-Kommentaren und Gesprächen als Referenz benutzt.
3. **digi-list** – nur Referenz: TCP-Protokoll (`src/lib/transfer/tcp-transfer.ts`), Export (`src/hooks/use-export-list.ts`), Migrations-Setup (`drizzle.config.ts`, `metro.config.js`).

**Arbeitsregel:** Nicht raten. Weicht etwas von der Spezifikation ab oder ist es dort nicht geregelt, zuerst nachfragen. Wird eine Entscheidung geändert, die Spezifikation mit aktualisieren (Live-Dokument gezielt über den Claude-Docs-Connector, danach die Projekt-Kopie).

**Git:** Jede Phase läuft auf einem eigenen Branch (Phase 2 `phase-2-listen`, Phase 3 `phase-3-produkte`, Phase 4 `phase-4-transfer`, Phase 5 `phase-5-rezepte`). Commits als „Alex Felker <alexanderfelker@gmx.net>“ im Conventional-Commits-Stil. Claude committet nur die eigenen Dateien – lokale Änderungen von Alex bleiben unangetastet – und pusht nicht; den Push macht Alex selbst.

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

`expo-document-picker` – in Phase 6.

Vorhanden: `buffer` (Binärformat für Transfer und Datei), `@expo-google-fonts/manrope`, `expo-localization`, `expo-navigation-bar` (Navigationsleiste folgt dem Thema), `expo-haptics`, `expo-keep-awake`, `expo-image-picker` + `expo-image-manipulator` (Fotos aufnehmen/wählen und auf 1280 px / JPEG 80 % verkleinern; Berechtigungstexte über das Plugin in `app.json`), dev: `drizzle-kit`, `babel-plugin-inline-import`. Entfernt: `expo-secure-store`, `react-native-awesome-gallery` (ersetzt durch den gluestack Image Viewer). Neue native Module brauchen einen neuen Entwicklungs-Build.

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

**Sheets:** gluestack **BottomSheet** (`src/components/ui/bottomsheet`, @gorhom/bottom-sheet), nicht Actionsheet. Im App-Code immer über `Sheet` aus `src/components/sheet.tsx`: `isOpen`, `onDismiss` (nur wenn die Nutzerin selbst schließt), `onClosed` (nach jeder Schließ-Animation), optional `fullHeight` = 90 % mit `BottomSheetScrollView`. Nie zwei Sheets gleichzeitig öffnen/schließen – beim Wechsel das nächste erst in `onClosed` des vorigen öffnen (siehe `AddItemsSheets`). Eingabefelder im Sheet melden sich über `useSheetKeyboardHandlers()` an (die Formularfelder tun das schon), sonst ignoriert gorhom die Tastatur. Sheets mit Höhe nach Inhalt wandern über die Tastatur (`interactive`), hohe Sheets bleiben stehen (`extend`) und bekommen am Ende ihres Scroll-Inhalts einen `KeyboardSpacer`. In Sheets mit Höhe nach Inhalt **kein `BottomSheetScrollView`**: Er meldet nur die Höhe seines eigenen Inhalts (ohne Titel/Rand), das Sheet wird zu niedrig und der untere Teil rutscht unter den Bildschirmrand (siehe 4e: scrollt nur, wenn es hoch wird). Damit ein Sheet beim Zuschieben seinen Inhalt behält: `useLastDefined`. Android-Zurück schließt nur das oberste offene Sheet (BackHandler in `Sheet`, der zuletzt angemeldete gewinnt); mit `onBack` geht es stattdessen einen Schritt zurück (3e/4d → Suche 3c). Externe Oberflächen (Teilen-Menü) erst nach `onClosed` öffnen – sonst friert Android die Schließ-Animation ein.
**Modal-Backdrop:** In `ui/modal` ist der Backdrop ein normales `Pressable`, die Abdunklung (`bg-black/50`, FadeIn) liegt als `StyledAnimatedView` darin – mit `StyledAnimatedPressable` war auf dem Gerät keine Abdunklung zu sehen.
**Dialoge:** `Dialog` aus `src/components/dialog.tsx` (AlertDialog + Platzhalter in Tastaturhöhe). Ein Dialog darf über einem offenen Sheet aufgehen (z. B. 5c aus 4e) – er hängt im Overlay-Portal darüber.
**Sheet-Ketten:** Soll nach einem Sheet etwas anderes aufgehen (4f → Bearbeiten/Löschen, 3d → 4d → 3e), wird die Folgeaktion gemerkt und erst in `onClosed` ausgeführt (`ProductsScreen.runPending`, `AddItemsSheets`). Ein verschachteltes Sheet *über* einem offenen (4e über 4d, „Weitere Einheiten“ über 3e) ist dagegen erlaubt.
**Tastatur:** Der Android-Eingabemodus steht fest auf „resize“ (`app.json` + einmal `useResizeMode()` in `RootLayout`); mit dem `KeyboardProvider` ändert sich das Fenster dabei nicht – alles hebt sich selbst: Sheets (gorhom, `android_keyboardInputMode="adjustPan"`), Dialoge (`KeyboardSpacer`), Toasts, Suchleisten (`KeyboardSticky` mit `bottomGap`, z. B. Tab-Leiste), Inline-Eingaben in Listen (`useScrollFocusedInputIntoView` + `KeyboardSpacer` am Listenende). Tastaturwerte nur über `useKeyboardHeight()` (`src/hooks/use-keyboard.ts`) lesen – **nie** `useReanimatedKeyboardAnimation`, `KeyboardStickyView`, `KeyboardAwareScrollView` o. Ä. aus react-native-keyboard-controller: Die setzen beim Aushängen den Standardmodus zurück; mit dem früheren „pan“ sprang der Modus je nach Verlauf, Android schob das Fenster mal mit und mal nicht.
**Bilder:** `Image` aus `src/components/ui/image` (expo-image mit `className` über `styled()`, Standard `cachePolicy="memory-disk"` und `transition={0}`). Ein nacktes expo-image `Image` mit `className` bekommt keine Größe und bleibt unsichtbar; ohne Speicher-Cache blitzten Vorschaubilder beim Filtern auf.
**Vollbildansicht (4c):** `PhotoViewer` (Uris, z. B. Entwürfe im Formular) bzw. `ProductPhotoViewer` (lädt die Fotos eines Produkts) aus `src/components/image-viewer.tsx`, gebaut auf `ui/image-viewer` (gluestack, alpha; Zoom-Gesten repariert, `useImageViewer()` für eigene Kopf-/Fußzeilen).

**Tab-Leiste:** Eine gemeinsame Pille (`TabBarPill`, erstes Kind der Leiste) gleitet zum aktiven Tab; Icon und Text liegen je zweimal übereinander (`soft`/`primary`) und blenden abhängig vom Abstand der Pille über. Die Rundung steht im animierten Style (`rounded-[999px]` griff dort auf dem Gerät nicht).
**Hintergrundmuster:** `ScreenPattern` (Punktraster) als erstes Kind der Tab-Screens und der Einstellungen. Farbe über `useUnstableNativeVariable("--line")`, nie `currentColor` in react-native-svg (Absturz in `<Pattern>` auf Android, über `styled()` kam die Farbe nicht an). Punkte als winzige Striche mit runden Enden, je Größe ein `Path`, Ergebnis je Bildschirmgröße im Cache.

**Toasts:** eigener Host `AppToastProvider` (`src/components/toast-host.tsx`), liegt in `_layout.tsx` außerhalb von `GluestackUIProvider`, damit er über allen Overlay-Portalen (Sheets, Dialoge) rendert. Ein bildschirmhoher, unten ausgerichteter Stapel (`flex-1 justify-end` + Platzhalter `h-24` – so bleibt seine Oberkante fest und Toasts blenden an Ort und Stelle aus; kein Padding/Gap am animierten Stapel – mit `pb-24` landeten die Toasts auf Android am unteren Rand), max. 3 Toasts, über der Tastatur angehoben, wegwischbar nach unten/links/rechts (seitlich ab 10 px, nach unten ab 24 px, Achse steht danach fest; Timer pausiert beim Anfassen). Ein-/Ausblend-Animationen sitzen im Host, nicht in `ui/toast`. Aufruf über `useAppToast()` → `showToast({ title, action?, withCheck?, duration? })`. Den gluestack-`ToastProvider`/`useToast` nicht verwenden – der rendert jeden Toast in eigener SafeArea und stapelt mit großen Lücken.

**Transfer (Phase 4, `src/lib/transfer`):**
- `format.ts` – Binärformat für Netzwerk und `.basko` ([u32 JSON-Länge][JSON][u32 Anzahl], je Bild [u32][Name][u32][Bytes], Big Endian), Zod-Schema mit `formatVersion` (1) und `type: "list"`; Kategorie `null` = „Sonstiges“; je Foto MD5 (`file.info({ md5: true })`); optional `recipe` (Rezept einer Liste aus 7e, seit Phase 5 – ältere Stände ignorieren das Feld, `formatVersion` bleibt 1). `TransferFormatError` mit `reason` `corrupt`/`newerVersion`.
- `build.ts` (Paket aus einer Liste), `import.ts` (`analyzeImport` → Vorschau + Konflikte, `saveImport` → Fotos zuerst als neue Dateien, dann eine Transaktion; ersetzte Fotodateien danach löschen), `file.ts` (Export in den Cache + `expo-sharing`, Lesen geöffneter Dateien inkl. `content://`).
- `protocol.ts` – Rahmen [u8 Art][u32 Länge][Inhalt]: Art 1 Steuer-JSON (`hello`, `accept`, `reject`, `busy`, `not_ready`, `cancel`, `received`), Art 2 Paket. Port 41234, Zeroconf-Typ `_basko._tcp`, 30 s Antwortzeit, danach 30 s Leerlauf-Timeout.
- `session.ts` – Modul-Store außerhalb von React (`useTransfer()` über `useSyncExternalStore`): Sichtbarkeit (ein Zeroconf-Dienst mit TXT `{ id, name, status }`, Status über `updateService`; TCP-Server), Senden, Empfangen, offene Vorschau (`pendingImport`, Quelle Netzwerk oder Datei). Dienst + Server laufen, solange die App vorne ist oder ein Transfer läuft (`AppState`). `TransferHost` im Root-Layout startet das und zeigt Hinweise (`TransferNotice`) als Toast; Hinweise ohne Zuhörer werden gepuffert (Kaltstart über Datei).
- Eigenes Gerät in der Suche über die Kennung `id` (pro App-Start) im TXT-Eintrag ausblenden. Die Geräteauswahl (6b) nutzt `useZeroconf` (eigene Instanz) und sucht 8 s.
- Geöffnete Dateien: `src/app/+native-intent.tsx` liest `content://`/`file://` im Hintergrund und leitet auf `/transfer` um; Vorschau 6h/6i dort (`ImportFlow`), bei Netzwerk im Empfang-Screen.
- iOS: `NSLocalNetworkUsageDescription`, `NSBonjourServices` und Dokumenttyp „Basko-Liste“ stehen in `app.json` – Änderungen daran brauchen einen neuen iOS-Entwicklungs-Build.

**Rezepte (Phase 5, `src/lib/recipes`):**
- `api.ts` – `searchRecipes` (`GET /v3/recipe?title=…&limit=5`, Header `X-Api-Key`), Antwort per Zod geprüft (fehlerhafte Einträge fallen weg), Nährwerte `calories`/`protein`/`total_carbohydrate`/`total_fat`. `RecipeApiError` mit `reason` `offline` (Netzwerk, 15 s Timeout → „Keine Verbindung“ + „Erneut versuchen“) bzw. `unavailable` (HTTP-Fehler, Kontingent, fehlender Schlüssel, unlesbare Antwort → „Rezeptsuche gerade nicht verfügbar“).
- Schlüssel: `EXPO_PUBLIC_API_NINJAS_KEY` in `.env` (in `.gitignore`, Vorlage `.env.example`); nach dem Anlegen Metro neu starten (Werte werden beim Bündeln eingesetzt).
- `useRecipeSearch(query)` (`src/hooks/use-recipes.ts`): erst beim Bestätigen, Schlüssel `queryKeys.recipeSearch(normalisierterBegriff)`, `staleTime`/`gcTime` unendlich, kein Retry – Treffer bleiben die Sitzung über im Cache. Die Details (7d) lesen daraus über Route `/recipe/[index]?query=…` (es gibt keinen Detail-Endpunkt). Verlässt man den Tab (außer zu den Details), setzt er Suche und Treffer zurück (`usePathname`), damit beim Zurückkommen die gespeicherten Rezepte stehen.
- `ingredients.ts` – Zutaten für 7e: Produktname = Teil vor dem ersten „;“ oder „,“ („Onion; chopped“, „Onion, chopped“ → „Onion“), Einheiten umrechnen (lb/oz → g, cup/fl oz/pint/quart/gallon → ml, jeweils auf 50 gerundet; tbsp/tsp → 1 Stk; gram/kg/ml/l/cl/dl metrisch übernommen; sonst Stk aufgerundet, min. 1), Originalangabe wie geliefert („2 tablespoon“, Einheit „unit“ entfällt) in die Notiz. Doppelte Namen (ohne Groß-/Kleinschreibung) werden zusammengefasst – beim Öffnen von 7e und nach Umbenennen beim Erstellen noch einmal; Mengen in derselben Einheit (bzw. g/kg, ml/l) werden addiert, sonst gilt die erste.
- `createRecipeList` (`src/lib/queries/recipes.ts`): eine Transaktion – Rezept speichern (`findOrCreateRecipe`), Liste in Lila mit `recipeId` (Namensregel „(n)“), vorhandene Produkte per Name, neue in „Sonstiges“ ohne Fotos, Einträge über `insertListItem` (setzt `lastQuantity/lastUnit` und `lastUsedAt`).
- **Gespeicherte Rezepte:** Tabelle `recipe` (Schnappschuss: Titel, Portionen, Zutaten und Schritte als JSON, Nährwerte), `list.recipeId` (FK, `set null`). `findOrCreateRecipe` nimmt die übergebene `id` oder ein inhaltsgleiches Rezept (Titel, Portionen, Zutaten, Schritte), sonst neu – pro Rezept ein Eintrag, egal wie viele Listen. Ein Rezept lebt mit seinen Listen: `deleteOrphanRecipes` (`src/lib/db/purge.ts`) löscht es, sobald keine Liste mehr darauf zeigt (nach `purgeList` und beim Start); Duplizieren übernimmt `recipeId`. Der Rezepte-Tab zeigt ohne Suche „Gespeicherte Rezepte“ (`getSavedRecipes`: nur mit sichtbarer Liste, zuletzt benutzte zuerst; Query-Schlüssel unter `lists`, damit Löschen/Rückgängig sie mitnimmt); Details aus der DB über `/recipe/saved/[id]`. Die Detail-Ansicht ist für beide Wege `RecipeDetail` (`src/components/recipes/recipe-detail.tsx`). Transfer und `.basko` schicken das Rezept mit (`getListRecipe` in `build.ts`, `findOrCreateRecipe` in `saveImport`). **Phase 6:** Die Sicherung muss `recipe` und `list.recipeId` enthalten.
- Migration `0001_recipes.sql`: `ON DELETE set null` von Hand ergänzt – drizzle-kit lässt es bei `ALTER TABLE … ADD` weg. Bei künftigen `ADD`-Spalten mit Fremdschlüssel prüfen; Tabellen-Neuaufbau (`__new_…`) wäre wegen `PRAGMA foreign_keys = ON` gefährlich (Cascade).
- Nach „Erstellen“ (7e): Listen-Tab mit Parameter `edit={listId}` öffnet den Bearbeiten-Screen über der Übersicht (‹ → Übersicht). Aus den Details per `router.dismissTo`, aus dem Tab per `router.navigate`.
- 7e ist ein hohes Modal mit Eingabefeldern: oben `pt-safe`, unten `KeyboardSpacer` (Modal schrumpft über der Tastatur); ein fokussiertes Feld wird über den Footer gescrollt (`keyboardDidShow`). Den Ref-Typen von `ModalBody`/`ModalFooter` (gluestack) fehlt `ScrollView`/`View` – dort ein normales `ScrollView` bzw. ein `View` als Messpunkt nehmen.

**Formulare:** TanStack Form wie in digi-list – `useAppForm`/`withForm` aus `src/lib/form`, Felder über `form.AppField` (`field.TextField`, `field.QuantityField`, `field.UnitField`, `field.ColorField`, `field.CategoryField`, `field.PhotosField`, `field.CheckboxField`), Absenden über `form.AppForm` + `form.SubmitButton`. Feld-Komponenten liegen in `src/components/form` und sind unabhängig vom Einsatzort (Dialog, Sheet, Zeile). Schemas in `src/lib/validation.ts` mit Zod (ohne drizzle-zod – dessen Typen sind mit Zod 4.6 unbrauchbar), Grenzen aus den Konstanten des DB-Schemas. Leere Pflichtfelder grauen nur den Knopf aus (`min(1, "")` → kein Fehlertext); „gibt es schon“ prüft ein Feld-Validator gegen die vorhandenen Namen (`isNameTaken` aus `src/lib/names.ts`).

**gluestack-Komponenten:** Die CLI (`gluestack-ui@alpha add`) fällt derzeit auf die v4-Vorlagen zurück, die `cssInterop` aus NativeWind 4 nutzen und hier nicht laufen. Neue Komponenten daher aus GitHub `gluestack/gluestack-ui`, Branch `main`, Ordner `src/components/ui/<name>` übernehmen (NativeWind-5-Vorlagen) und auf unsere Tokens umstellen. `styled()` nie direkt auf `Animated.createAnimatedComponent(...)` anwenden – das lässt den TypeScript-Check hängen; stattdessen `src/components/ui/utils/animated.ts` nutzen.

## Ordner

- `src/app` – Routen (expo-router). Tabs: Listen (Start), Produkte, Transfer, Rezepte. Stack-Screens ohne Tab-Leiste: Einkaufsmodus, Liste bearbeiten, Einstellungen, Ladenreihenfolge, Geräteauswahl, Rezept-Details.
- `src/components/ui` – gluestack-Komponenten (generiert, an unsere Tokens angepasst)
- `src/components` – eigene Komponenten (SwipeRow, Stepper, ColorSwatchPicker, ViewToggle, ActionItem, HighlightedText, `image-viewer.tsx`, `toast-host.tsx`, `sheet.tsx`, `dialog.tsx` …); `items/` (Such-, Hinzufügen-/Bearbeiten-Sheets, Einheiten-Auswahl), `lists/` (Listenzeile, Dialoge, Aktionen-Sheet), `shop/` (Zeilen im Einkaufsmodus), `products/` (Zeile/Kachel, Produkt-Sheet 4d, Aktionen 4f, Löschen-Dialog), `categories/` (Kategorie wählen 4e, Neue Kategorie 5c, DragSortRow/Umbenennen 5a), `transfer/` (Zustands-Screen 6c–6f/6j, Verlaufszeile, Anfrage-Dialog 6g, `ImportFlow` 6h/6i, `TransferHost`), `recipes/` (Trefferzeile 7b, `RecipeDetail` 7d, `NutritionStat`, `CreateRecipeListModal` 7e)
- `src/lib/db` – Drizzle-Client, Schema (`schema/`), Migrationen (`migrations/`, generiert), `seed.ts` (Standard-Kategorien + „Sonstiges“), `demo-seed.ts` (Testdaten nur in `__DEV__`: ca. 30 Produkte, 5 Listen; einmal pro Gerät, Marker `dev.demoSeedVersion` in `settings` – gehört nicht in die Sicherung, Phase 6), `purge.ts` (Soft-Deletes beim Start, verwaiste Rezepte), `id.ts` (`newId()` – IDs immer explizit setzen, kein `$defaultFn` mit expo-crypto im Schema)
- `src/lib/i18n` – `t("schlüssel", { platzhalter })`, Texte in `locales/de.ts`; Pluralformen `{ one, other }` mit `count`
- `src/lib/queries` – DB-Funktionen je Bereich (`lists.ts`, `list-items.ts`, `products.ts`, `categories.ts`, `transfer-history.ts`, `recipes.ts`), synchron, nur Drizzle-Builder
- `src/lib/recipes` – Rezept-API (`api.ts`) und Zutaten-Umrechnung (`ingredients.ts`)
- `src/lib` – außerdem `settings.ts`, `theme.ts`, `units.ts` (Codes, Schritte, Umrechnung, Eingabe), `format.ts` (Mengen-Anzeige), `search.ts` + `product-search.ts` (Suche/Ranking, Filter im Produkte-Tab), `list-grouping.ts` (Ladenreihenfolge), `list-name.ts` (Namensregel „(n)“), `names.ts` (Namensvergleich ohne Groß-/Kleinschreibung), `images.ts` (Fotos aufnehmen/wählen, verkleinern, speichern, löschen; `PhotoDraft`), `haptics.ts`, `query-keys.ts`
- `src/hooks` – `useAppSetup`, `useSettings`, TanStack-Hooks je Bereich (`use-lists`, `use-list-items`, `use-catalog`, `use-categories`, `use-transfer`, `use-recipes`), `useAppToast`, `useUndoableDelete` (Löschen mit Rückgängig), `useSheetKeyboardHandlers`, `useLastDefined`
- `src/lib/form` + `src/components/form` – TanStack-Form-Hook und wiederverwendbare Felder; `src/lib/validation.ts` – Zod-Schemas
- Routen: `src/app/(tabs)/index.tsx` (Listen), `src/app/(tabs)/products.tsx` (Produkte), `src/app/list/[id]/index.tsx` (Einkaufsmodus), `src/app/list/[id]/edit.tsx` (Liste bearbeiten), `src/app/settings/index.tsx` (Einstellungen), `src/app/settings/store-order.tsx` (Ladenreihenfolge), `src/app/(tabs)/transfer.tsx` (Transfer 6a + Datei-Vorschau), `src/app/transfer/send/[listId].tsx` (6b–6e), `src/app/transfer/receive.tsx` (6f–6i), `src/app/transfer/saved.tsx` (6j), `src/app/+native-intent.tsx` (geöffnete `.basko`-Dateien), `src/app/(tabs)/recipes.tsx` (Rezepte 7a–7c, 7e), `src/app/recipe/[index].tsx` (Details 7d eines Suchtreffers), `src/app/recipe/saved/[id].tsx` (Details 7d eines gespeicherten Rezepts)

## Konventionen

- TypeScript strict, Import-Alias `@/` → `src/`.
- Code und Bezeichner auf Englisch, UI-Texte auf Deutsch – aber **nie hart im Code**: alle Texte über die eigene i18n-Schicht mit `expo-localization` (vorerst nur Deutsch). Rezeptinhalte bleiben Englisch (API).
- Styling nur über NativeWind-Klassen mit den semantischen Tokens `bg`, `surface`, `ink`, `soft`, `line`, `chip`, `primary`, `primary-ink`, `amber`, `danger` (hell/dunkel, Werte in der Spezifikation, definiert in `src/global.css`). Die Tailwind-Farbskalen sind entfernt; zusätzlich gibt es nur `white`, `black` und die Listenfarben `list-blue`/`list-purple`. Keine Hex-Werte in Komponenten.
- **Keine Pixelwerte** in Klassen, immer die Tailwind-Skala (1 Einheit = 4 px, 1-px-Schritte über 0.25: `h-7.5` = 30, `px-2.25` = 9). Ausnahmen nur für Radien wie `rounded-[999px]` (statt `rounded-full`) oder `rounded-[5px]`.
- **Schriftgrößen nur über `text-xs` … `text-2xl`** (Basis 16 px), keine `text-[…px]`. Designwerte runden: 11–12,5 → `xs`, 13–14 → `sm`, 15–16 → `base`, 17–18 → `lg`, 19–20 → `xl`.
- **Bedingte Klassen immer mit `cn()`** aus `@gluestack-ui/utils/nativewind-utils`, nie mit Template-Strings.
- Maß-Tokens: `rounded-card` (14), `rounded-thumb` (10), `px-page` (18), `py-row` (13).
- Eingabefelder: `Input size="default"` (48) oder `size="sm"` (44); `InputField` übernimmt die Höhe über den Style-Kontext, damit der Text mittig sitzt. In Formularen: `field.TextField size=…`.
- **Android-Fallen** (alle auf dem Gerät aufgefallen):
  - Wisch-Aktionen hinter Zeilen starten mit `opacity-0` als Klasse – der animierte Style greift beim Einblenden eines Screens erst einen Moment später (sonst blitzt die Aktion auf).
  - Kurze Chip-Texte mit Zahl + Einheit: geschütztes Leerzeichen und `textBreakStrategy="simple"` (`QuantityChip`), sonst verschwand „Stk“ bei „3 Stk“.
- Pan-Gesten (Gesture Handler): Android setzt `translationX/Y` beim Aktivieren auf 0 zurück. Wer die Richtung oder den Weg ab dem Aufsetzen braucht, rechnet mit `absoluteX/Y` ab `onBegin` (siehe `toast-host.tsx`).
- `ReorderableList` mit Wisch-Zeilen: eigene `panGesture` (`activeOffsetY` + `failOffsetX`), sonst gewinnt die Listen-Geste fast jeden seitlichen Wisch (5a).
- Fremdkomponenten ohne className-Unterstützung (z. B. `ReorderableList`) bekommen Layout per `style` (nur `flex`/Position); Abstände lieber über Kinder mit Klassen (`ListFooterComponent={<View className="h-6" />}`).
- Bei `cn()` keine eigenen Maß-Tokens mit Skalenwerten derselben Eigenschaft mischen (`mx-page` + `mx-3`): tailwind-merge erkennt `page` nicht als Konflikt, beide Klassen bleiben stehen. Stattdessen sich ausschließende Zweige (`isActive ? "mx-3 …" : "mx-page …"`).
- Animierte Views mit `className` über `StyledAnimatedView` aus `src/components/ui/utils/animated.ts` (inkl. `layout`/`entering`/`exiting`).
- **Datenbank: nur das Builder-Pattern** (`db.select().from(…)`, `insert`, `update`, `delete`), nicht die Query-API (`db.query.…`). Abfragen laufen synchron; Hooks invalidieren danach `queryKeys.lists` bzw. `queryKeys.products`. Lese-Hooks nutzen `useQuery(localQuery(key, read))` (`src/lib/query-client.ts`): `initialData` liest synchron, damit beim ersten Rendern nichts leer ist oder aufblitzt – keine Lade-Zustände für lokale Daten. **Keine verschachtelten Transaktionen:** Eine Query-Funktion mit eigenem `db.transaction` (z. B. `addTransferHistory`) nie innerhalb einer anderen Transaktion aufrufen – expo-sqlite bricht mit „Failed to run the query 'begin'“ ab.
- Texte immer mit `Text` aus `@/components/ui/text` (Manrope, Standard 500). Manrope ist nativ eingebunden (expo-font-Plugin in `app.json`), Gewichte über `font-medium` … `font-extrabold`.
- Units werden als Code gespeichert (`pcs`, `kg`, …) und über `t("units.<code>")` angezeigt.
- Schrift Manrope 500–800; Icons `lucide-react-native` (nächstliegendes Icon).
- Maße: Radius 14 / 999 / 10, Seitenabstand 18, Touch-Fläche min. 44.
- IDs: UUID als Text (`expo-crypto`).
- Zahlen mit deutschem Komma anzeigen; Eingabe akzeptiert Komma und Punkt.
- Commits im Stil `feat: …`, `refactor: …`, `fix: …` (Conventional Commits), wie bisher.

## Fachregeln, die leicht übersehen werden

- Produkte sind ein globaler Katalog; **Menge, Einheit, Notiz hängen am Listeneintrag**, nicht am Produkt. `product.lastQuantity/lastUnit` dienen nur als Vorbelegung.
- Produkt- und Kategorienamen eindeutig **ohne** Beachtung der Groß-/Kleinschreibung – bei Kollision Fehlertext unter dem Feld und Absenden ausgegraut (keine Namensregel „(n)“, die gilt nur für Listen). Suche: Teilwort, case-insensitive, umlauttolerant.
- Fotos: max. 8 pro Produkt, das erste ist das Vorschaubild. Neu gewählte liegen bis „Erstellen“/„Speichern“ im Cache (`PhotoDraft.fileName = null`) und werden erst dann in `product-images/` verschoben; entfernte Dateien löscht `updateProduct` nach dem Speichern. Produkt löschen = endgültig, inkl. Listeneinträgen (Cascade) und Fotodateien.
- Kategorie „Sonstiges“ (`isSystem`) existiert immer, steht immer am Ende, ist nicht umbenenn-/löschbar und erscheint nicht in der Ladenreihenfolge.
- Einheiten fest: Stk, kg, g, l, ml + 12 weitere (Schritt 1). Schritte: Stk 1, kg/l 0,1, g/ml 50. kg↔g und l↔ml umrechnen, sonst Standardwert. Minus ausgegraut bei Menge ≤ Schrittweite. Menge > 0, max. 2 Nachkommastellen.
- Sortierung in Einkaufsmodus **und** Bearbeiten: Kategorien in Ladenreihenfolge, darin alphabetisch (im Einkaufsmodus offene vor erledigten).
- Löschen mit Rückgängig = Soft-Delete über `deletedAt`, endgültig nach 5 s und beim App-Start.
- Namenskollision bei Listen → „Name (n)“ mit nächster freier Zahl.
- Einstellungen liegen in der Tabelle `settings` (nicht SecureStore), werden beim Start synchron gelesen und über `useSettings()` aus dem Query-Cache gelesen.
- Transfer: Haken werden nicht übertragen; Konflikt = gleicher Produktname mit anderer Kategorie oder anderen Fotos (Vergleich per Datei-Hash); unbekannte Kategorie → „Sonstiges“. Format-Versionsfeld im JSON.
- Dateien: Liste `.basko`, Sicherung `.baskobackup` (beide auch von außerhalb öffnbar).
- Rezepte: API-Key aus `EXPO_PUBLIC_API_NINJAS_KEY` (`.env`), Suche nur nach Titel bei Bestätigung, max. 5 Treffer, kein „Mehr laden“. Nährwerte gelten pro Rezept. Rezept-Listen sind Lila, neue Produkte landen in „Sonstiges“, die Originalangabe steht in der Notiz.

## Umsetzungsphasen

1. ✓ Fundament: Tokens hell/dunkel, gluestack-Theming, Manrope, Tab-Leiste, i18n, Drizzle-Schema + Migrationen + Seed (inkl. „Sonstiges“), `settings`, Theme beim Start, gluestack-Basiskomponenten (eigene Komponenten wie SwipeRow, Stepper kommen mit ihrer Phase)
2. ✓ Listen-Übersicht, Liste bearbeiten, Einkaufsmodus
   - Entschieden: „1 Produkt“ im Singular. Labels im Item-Sheet: „Löschen“ (Bearbeiten) bzw. „Entfernen“ (Einkaufsmodus). Badge „zuletzt genutzt“ nur, wenn das Produkt nicht schon „in Liste“ ist. Header im Einkaufsmodus: Zurücksetzen (ghost) links, Stift (secondary) außen. Eine gewählte weitere Einheit ist im Einheiten-Umschalter so breit wie ihr Name. Kein Toast „{Produkt} hinzugefügt“ beim Hinzufügen. Der Dialog „Neue Liste“ (1f) zeigt wie 3g eine Live-Vorschau der Listenzeile (leerer Name → „Name der Liste“). „‚{Suchtext}‘ neu anlegen“ öffnet bis Phase 3 direkt das Hinzufügen-Sheet; das Produkt entsteht erst beim Absenden in „Sonstiges“ (ohne Sheet 4d, `addNewProductToList`). Zahnrad, „Über Netzwerk senden“ und „Als Datei exportieren“ sind bis Phase 4/6 sichtbar, aber deaktiviert. Vorschaubild-Tipp → Vollbild folgt mit Phase 3.
3. ✓ Produkte (Fotos, Bildansicht), Kategorien, Ladenreihenfolge
   - Entschieden: Das Zahnrad ist aktiv; die Einstellungen (8a) zeigen bis Phase 6 nur „Ladenreihenfolge ›“. Fotos in 4d: Reihe waagerecht scrollbar, langer Druck + Ziehen sortiert um, ×-Knopf löscht, Tipp öffnet die Vollbildansicht. Kategorienamen: Kollision → Fehler unter dem Feld, Haken/„Erstellen“ ausgegraut. „‚{Suchtext}‘ neu anlegen“ öffnet 4d mit vorausgefülltem Namen, danach das Hinzufügen-Sheet (`addNewProductToList` ist entfernt). Vorschaubild-Tipp → Vollbild im Einkaufsmodus und im Produkte-Tab (nur mit Foto; ohne Foto gilt der Tipp der Zeile).
4. ✓ Transfer über Netzwerk, Datei-Export/-Import
   - Entschieden: 6i „Abbrechen“ führt zurück zur Vorschau 6h; vorgewählt ist „Behalten“. 6j „Fertig“ führt in den Transfer-Tab. Ein Tipp im Verlauf öffnet den Listen-Tab mit Parameter `menu={listId}` (öffnet das „···“-Menü).
5. ✓ Rezepte
   - Entschieden: Produktname in 7e = Teil vor „;“ oder „,“ (in 7d bleibt der Name wie geliefert). Einheiten außerhalb der Tabelle werden sinngemäß umgerechnet (pint/quart/gallon → ml, gram/kg/ml/l metrisch), alles Unbekannte → Stk. Nach „Erstellen“ führt ‹ im Bearbeiten-Screen in die Listen-Übersicht. `.env` steht in `.gitignore` (`.env.example` im Repo). „Liste erstellen“ beim Wischen ist grün (`primary`, 120 breit) statt amber wie im Design. In 7e sind Zeilen ohne Namen ausgenommen; „Erstellen“ braucht einen Listennamen und mindestens eine gewählte Zutat. Nährwerte per API geprüft (25 Treffer): einheitlich pro Rezept; nur `servings` ist unzuverlässig (oft „1 servings“ auch bei ganzen Kuchen) und wird deshalb nur angezeigt, nie zum Umrechnen genutzt. Rezepte werden mit ihrer Liste gespeichert und stehen ohne Suche im Rezepte-Tab („Gespeicherte Rezepte“); sie leben mit ihren Listen und werden beim Transfer mitgeschickt.
6. Einstellungen (restliche Zeilen von 8a, 8b–8e), Sicherung/Wiederherstellung
