// Datenmodell von Stash. Regeln und Gruende: konzept.md.

/** Ein abgelegter Gedanke. Titel oder Text darf leer sein, aber nicht beides. */
export interface Notiz {
  id: string
  /** Eine Zeile, getrimmt - meist der Projektname. */
  titel: string
  /** Beliebig viele Zeilen, vorn und hinten getrimmt. */
  text: string
  /** Zeitpunkt des Ablegens (ms) */
  erstellt: number
}

/** Was gerade im Formular steht - uebersteht das Schliessen der App. */
export interface Entwurf {
  titel: string
  text: string
}

/** Der zuletzt geleerte Stapel, damit er sich einmal zurueckholen laesst. */
export interface Geleert {
  /** Zeitpunkt des Leerens (ms) */
  am: number
  notizen: Notiz[]
}

/** Wohin „Senden“ geht: ein privates GitHub-Repo und ein Token, der nur dort schreiben darf. */
export interface Inbox {
  /** „besitzer/name“ */
  repo: string
  token: string
}

/** Seiten ueber der Startseite (Schreiben). */
export type View = { name: 'stapel' }
