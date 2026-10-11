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
  lists: {
    title: "Einkaufslisten",
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
