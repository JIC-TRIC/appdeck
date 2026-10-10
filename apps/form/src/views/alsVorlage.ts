import { useIonAlert } from '@ionic/react'
import { NAME_MAX } from '../store'
import { vorlageAus } from '../trainingCalc'
import { speichereTraining, speichereVorlage } from '../trainingStore'
import type { FormCtx, Training } from '../types'

// Ein beendetes Training als Vorlage speichern - gleich nach dem Beenden
// (Fertig) oder spaeter unter "Ein Training". Danach gehoert das Training zur
// Vorlage: beim naechsten Mal steht grau, was damals war.
export function useAlsVorlage({ refresh, melde }: Pick<FormCtx, 'refresh' | 'melde'>) {
  const [frage] = useIonAlert()
  return (t: Training, danach?: () => void) =>
    frage({
      header: 'Als Vorlage speichern',
      cssClass: 'f-alert',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: t.name === 'Training' ? '' : t.name,
          placeholder: 'Name, z. B. Push',
          attributes: { maxlength: NAME_MAX, autocapitalize: 'words' },
        },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Speichern',
          handler: (d: { name?: string }) => {
            const v = speichereVorlage({ name: d.name ?? '', uebungen: vorlageAus(t) })
            if (!v) return false
            speichereTraining({ ...t, vorlage: v.id, name: v.name })
            refresh()
            danach?.()
            melde(`${v.name} gespeichert`)
            return true
          },
        },
      ],
    })
}
