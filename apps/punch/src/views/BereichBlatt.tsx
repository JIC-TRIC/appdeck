import { useState } from 'react'
import { useIonActionSheet, useIonAlert, type ActionSheetButton } from '@ionic/react'
import { FARBEN } from '../farben'
import {
  bereichAendern,
  bereichAnlegen,
  bereichLoeschen,
  NAME_MAX,
  naechsteFarbe,
  pruefeName,
  taetigkeitAendern,
  taetigkeitAnlegen,
  taetigkeitLoeschen,
} from '../store'
import { Blatt, BlattKopf, Feld, mitFarbe } from '../ui'
import type { Bereich, Taetigkeit } from '../types'

interface Props {
  /** null = neuer Bereich */
  bereich: Bereich | null
  alle: Bereich[]
  /** Bereiche und Taetigkeiten mit Bloecken - die lassen sich nur archivieren */
  belegt: { bereiche: Set<string>; taetigkeiten: Set<string> }
  onClose: () => void
  onGeaendert: () => void
  onMeldung: (text: string) => void
}

// Ein Bereich als Blatt: Name und Farbe gelten mit Sichern, die Taetigkeiten
// sofort. Mit Bloecken laesst sich ein Bereich nur archivieren.
export function BereichBlatt({ bereich, alle, belegt, onClose, onGeaendert, onMeldung }: Props) {
  const [name, setName] = useState(bereich?.name ?? '')
  const [farbe, setFarbe] = useState(bereich?.farbe ?? naechsteFarbe(alle))
  const fehler = pruefeName(name, alle, bereich?.id ?? null)
  const [frage] = useIonAlert()
  const [aktion] = useIonActionSheet()

  const nameFrage = (header: string, wert: string, ok: (v: string) => boolean) =>
    frage({
      header,
      cssClass: 'p-alert',
      inputs: [{ name: 'name', value: wert, placeholder: 'Name', attributes: { maxlength: NAME_MAX, autocapitalize: 'sentences' } }],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        // false laesst die Frage offen (leer oder doppelt)
        { text: 'Sichern', handler: (v: { name: string }) => ok(v.name) },
      ],
    })

  const taetigkeitMenue = (b: Bereich, t: Taetigkeit) => {
    const buttons: ActionSheetButton[] = [
      {
        text: 'Umbenennen',
        handler: () => {
          nameFrage('Tätigkeit umbenennen', t.name, (v) => {
            if (!taetigkeitAendern(b.id, t.id, { name: v })) return false
            onGeaendert()
            return true
          })
        },
      },
    ]
    if (t.archiviert)
      buttons.push({
        text: 'Zurückholen',
        handler: () => {
          taetigkeitAendern(b.id, t.id, { archiviert: false })
          onGeaendert()
        },
      })
    else if (belegt.taetigkeiten.has(t.id))
      buttons.push({
        text: 'Archivieren',
        handler: () => {
          taetigkeitAendern(b.id, t.id, { archiviert: true })
          onGeaendert()
        },
      })
    else
      buttons.push({
        text: 'Löschen',
        role: 'destructive',
        handler: () => {
          taetigkeitLoeschen(b.id, t.id)
          onGeaendert()
        },
      })
    buttons.push({ text: 'Abbrechen', role: 'cancel' })
    aktion({ header: t.name, cssClass: 'p-as', buttons })
  }

  const aktiv = bereich?.taetigkeiten.filter((t) => !t.archiviert) ?? []
  const archiv = bereich?.taetigkeiten.filter((t) => t.archiviert) ?? []

  return (
    <Blatt label={bereich ? bereich.name : 'Neuer Bereich'} onClose={onClose}>
      {(zu) => (
        <>
          <BlattKopf
            titel={bereich ? 'Bereich' : 'Neuer Bereich'}
            onAbbrechen={zu}
            rechts="Sichern"
            aus={!!fehler}
            onRechts={() => {
              if (bereich) bereichAendern(bereich.id, { name, farbe })
              else bereichAnlegen(name, farbe)
              onGeaendert()
              zu()
            }}
          />
          <Feld titel="Name">
            <input
              className="p-input"
              value={name}
              maxLength={NAME_MAX}
              placeholder="z. B. Uni"
              autoFocus={!bereich}
              enterKeyHint="done"
              autoCapitalize="sentences"
              onChange={(e) => setName(e.target.value)}
            />
          </Feld>
          <Feld titel="Farbe">
            <div className="p-farben" role="radiogroup" aria-label="Farbe">
              {FARBEN.map((f, i) => (
                <button
                  type="button"
                  key={f.name}
                  role="radio"
                  aria-checked={i === farbe}
                  aria-label={f.name}
                  className={i === farbe ? 'an' : ''}
                  style={mitFarbe(f.wert)}
                  onClick={() => setFarbe(i)}
                />
              ))}
            </div>
          </Feld>
          {bereich ? (
            <Feld titel="Tätigkeiten">
              <div className="p-chips">
                {[...aktiv, ...archiv].map((t) => (
                  <button type="button" key={t.id} className={`p-chip${t.archiviert ? ' archiv' : ''}`} onClick={() => taetigkeitMenue(bereich, t)}>
                    {t.name}
                  </button>
                ))}
                <button
                  type="button"
                  className="p-chip leise"
                  onClick={() =>
                    nameFrage('Neue Tätigkeit', '', (v) => {
                      if (!taetigkeitAnlegen(bereich.id, v)) return false
                      onGeaendert()
                      return true
                    })
                  }
                >
                  + Neu
                </button>
              </div>
            </Feld>
          ) : null}
          {bereich ? (
            <button
              type="button"
              className={`p-weg${bereich.archiviert || belegt.bereiche.has(bereich.id) ? ' still' : ''}`}
              onClick={() => {
                if (bereich.archiviert) {
                  bereichAendern(bereich.id, { archiviert: false })
                  onMeldung(`${bereich.name} ist zurück`)
                } else if (belegt.bereiche.has(bereich.id)) {
                  bereichAendern(bereich.id, { archiviert: true })
                  onMeldung(`${bereich.name} archiviert`)
                } else {
                  bereichLoeschen(bereich.id)
                  onMeldung(`${bereich.name} gelöscht`)
                }
                onGeaendert()
                zu()
              }}
            >
              {bereich.archiviert ? 'Zurückholen' : belegt.bereiche.has(bereich.id) ? 'Archivieren' : 'Bereich löschen'}
            </button>
          ) : null}
        </>
      )}
    </Blatt>
  )
}
