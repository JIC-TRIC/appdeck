import { IonReorder, IonReorderGroup } from '@ionic/react'
import { isArchived } from '../calc'
import { IconGrip } from '../icons'
import { Screen, TextButton, hue, ruleShort } from '../ui'
import { reorderHabits } from '../store'
import type { Habit, ViewProps } from '../types'

// Reihenfolge im Raster. Ionic bringt das Ziehen mit; gespeichert wird beim
// Loslassen.
function Reorder({ ctx }: ViewProps) {
  const { habits, today, back, refresh } = ctx
  const list = habits.filter((h) => !isArchived(h))

  return (
    <Screen title="Reihenfolge" right={<TextButton strong onClick={back}>Fertig</TextButton>}>
      <IonReorderGroup
        className="s-list s-reorder"
        disabled={false}
        onIonReorderEnd={(e) => {
          const next = e.detail.complete(list) as Habit[]
          reorderHabits(next.map((h) => h.id))
          refresh()
        }}
      >
        {list.map((h) => {
          const rule = ruleShort(h, today)
          return (
            <div key={h.id} className="s-li" style={hue(h)}>
              <span className="two">
                <b>{h.name}</b>
                {rule ? <small>{rule}</small> : null}
              </span>
              <IonReorder>
                <span className="s-grip" aria-label={`${h.name} verschieben`}>
                  <IconGrip />
                </span>
              </IonReorder>
            </div>
          )
        })}
      </IonReorderGroup>
      <p className="s-note">Am Griff ziehen. Die Reihenfolge gilt für das Raster.</p>
    </Screen>
  )
}

export default Reorder
