/**
 * Deutsche Texte. Neue Sprachen bekommen eine Datei mit derselben Struktur
 * (`satisfies Dictionary`) und werden in `../index.ts` registriert.
 * Platzhalter: {name}. Mengen-abhängige Texte: { one, other } mit Parameter `count`.
 */
const de = {
  tabs: {
    lists: "Listen",
    products: "Produkte",
    transfer: "Transfer",
    recipes: "Rezepte",
  },
  common: {
    back: "Zurück",
    cancel: "Abbrechen",
    done: "Fertig",
    create: "Erstellen",
    undo: "Rückgängig",
    delete: "Löschen",
    edit: "Bearbeiten",
    deleted: "{name} gelöscht",
  },
  listColors: {
    green: "Grün",
    amber: "Orange",
    red: "Rot",
    blue: "Blau",
    purple: "Lila",
  },
  lists: {
    title: "Einkaufslisten",
    productCount: { one: "{count} Produkt", other: "{count} Produkte" },
    copyOf: "Kopie von {name}",
    settings: "Einstellungen",
    newList: "Neue Liste",
    actions: "Aktionen für {name}",
    nameInput: "Listenname",
    saveName: "Namen speichern",
    empty: {
      title: "Noch keine Listen",
      text: "Tippe oben rechts auf +, um deine erste Einkaufsliste anzulegen.",
    },
  },
  listActions: {
    edit: { title: "Liste bearbeiten", description: "Produkte und Mengen ändern" },
    rename: { title: "Umbenennen" },
    send: { title: "Über Netzwerk senden", description: "An ein Gerät im selben WLAN" },
    export: { title: "Als Datei exportieren", description: "Teilen per WhatsApp, Mail …" },
    duplicate: { title: "Duplizieren", description: "Kopie dieser Liste anlegen" },
    delete: { title: "Löschen" },
  },
  newList: {
    title: "Neue Liste",
    nameLabel: "Name",
    previewName: "Name der Liste",
  },
  listColor: {
    title: "Listenfarbe",
    change: "Listenfarbe ändern",
  },
  editList: {
    title: "Liste bearbeiten",
    autosave: "Änderungen werden automatisch gespeichert",
    searchPlaceholder: "Produkt suchen oder anlegen …",
    empty: {
      title: "Noch leer",
      text: "Nutze die Suche unten, um Produkte zu dieser Liste hinzuzufügen.",
    },
  },
  search: {
    noResult: "Kein Produkt gefunden.",
    create: "„{name}“ neu anlegen",
    recent: "zuletzt genutzt",
    inList: "in Liste",
  },
  itemSheet: {
    quantity: "Menge",
    step: "Schritt {step} {unit}",
    unit: "Einheit",
    moreUnits: "Weitere Einheiten",
    note: "Notiz",
    notePlaceholder: "Notiz (optional)",
    add: "Zur Liste hinzufügen",
    deleteItem: "Löschen",
    removeItem: "Entfernen",
  },
  moreUnits: {
    title: "Weitere Einheiten",
    forProduct: "für {name}",
  },
  quantity: {
    decrease: "{quantity} verringern",
    increase: "{quantity} erhöhen",
    edit: "Menge {quantity} eingeben",
    input: "Menge",
  },
  shop: {
    editList: "Liste bearbeiten",
    resetChecks: "Haken zurücksetzen",
    resetDialog: {
      title: "Alle Haken entfernen?",
      confirm: "Zurücksetzen",
    },
    allDone: "Alles erledigt",
    empty: {
      title: "Du hast noch keine Produkte hinzugefügt",
      action: "Einkaufsliste bearbeiten",
    },
    collapsed: "{name}, {done} von {total} erledigt – aufklappen",
    showImage: "Foto von {name} anzeigen",
  },
  products: {
    title: "Produkte",
  },
  transfer: {
    title: "Transfer",
  },
  recipes: {
    title: "Rezepte",
  },
  errors: {
    generic: "Etwas ist schiefgelaufen",
  },
  units: {
    pcs: "Stk",
    kg: "kg",
    g: "g",
    l: "l",
    ml: "ml",
    pack: "Packung",
    can: "Dose",
    bottle: "Flasche",
    jar: "Glas",
    cup: "Becher",
    bunch: "Bund",
    bag: "Beutel",
    net: "Netz",
    crate: "Kasten",
    slice: "Scheibe",
    roll: "Rolle",
    tube: "Tube",
  },
  seed: {
    categories: {
      produce: "Obst & Gemüse",
      bakery: "Backwaren",
      chilled: "Kühlregal",
      meatFish: "Fleisch & Fisch",
      frozen: "Tiefkühl",
      drinks: "Getränke",
      drugstore: "Drogerie",
      household: "Haushalt",
      other: "Sonstiges",
    },
  },
} as const;

export default de;
