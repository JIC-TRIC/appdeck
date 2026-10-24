import { useIonAlert } from '@ionic/react'
import { NOTIZ_MAX, setzeUebung } from '../trainingStore'
import type { FormCtx, Uebung } from '../types'

// Die Notiz einer Uebung als Zettel: wie das Geraet eingestellt wird, worauf
// man achten will. Steht im Training immer unter dem Namen - sonst muesste man
// sie erst suchen, wenn man vor dem Geraet steht - und auf der Seite der
// Uebung. Ein Tipp aendert sie gleich dort. Sie gehoert zur Uebung, nicht zum
// Training, und gilt darum sofort fuer jedes Mal.

export function Zettel({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button type="button" className="f-zettel" onClick={onClick} aria-label={`Notiz: ${text}. Ändern`}>
      {text}
    </button>
  )
}

/** Rueckfrage mit Textfeld fuer die Notiz einer Uebung - gesichert wird sofort. */
export function useNotizAendern(refresh: FormCtx['refresh']) {
  const [frage] = useIonAlert()
  return (u: Uebung) =>
    frage({
      header: 'Notiz zur Übung',
      subHeader: u.name,
      cssClass: 'f-alert',
      inputs: [
        {
          name: 'notiz',
          type: 'textarea',
          value: u.notiz,
          placeholder: 'Sitz Stufe 4, Lehne 2 …',
          attributes: { maxlength: NOTIZ_MAX, rows: 3 },
        },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Sichern',
          handler: (d: { notiz?: string }) => {
            setzeUebung(u.id, { notiz: d.notiz ?? '' })
            refresh()
          },
        },
      ],
    })
}
