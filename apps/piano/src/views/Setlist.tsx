import { useMemo, useState } from 'react'
import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonReorder,
  IonReorderGroup,
  type ItemReorderEventDetail,
} from '@ionic/react'
import { IconMore, IconPlay, IconPlus, IconSearch } from '../icons'
import { IconButton, ListSheet, Page, Sheet, Thumb } from '../ui'
import { avgSessionOf } from '../calc'
import { deleteSetlist, updateSetlist } from '../store'
import { formatMinutes } from '../util'
import { SetlistNameSheet } from './Sheets'
import { setlistPieces, setlistSeconds } from './Setlists'
import type { ViewProps } from '../types'

// Eine Setlist als Programm: nummeriert, mit Punktlinie und Dauer.
// Reihenfolge per Ziehen am Griff, Entfernen per Wischen.
function Setlist({ ctx, view }: ViewProps) {
  const { setlists, pieces, sessions, backLabel, back, push, refresh, notify, startUebung } = ctx
  const setlist = setlists.find((s) => s.id === view.setlistId)
  const [sheet, setSheet] = useState<null | 'actions' | 'rename' | 'add'>(null)
  const [query, setQuery] = useState('')

  const addable = useMemo(() => {
    if (!setlist) return []
    const q = query.trim().toLowerCase()
    return pieces
      .filter((p) => !setlist.pieceIds.includes(p.id))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.artist.toLowerCase().includes(q))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'))
  }, [pieces, setlist, query])

  if (!setlist) return <Page backLabel={backLabel} onBack={back}>{null}</Page>

  const list = setlistPieces(ctx, setlist)

  const reorder = (e: CustomEvent<ItemReorderEventDetail>) => {
    const ids = e.detail.complete(list.map((p) => p.id)) as string[]
    updateSetlist(setlist.id, { pieceIds: ids })
    refresh()
  }

  const removePiece = (id: string) => {
    const before = setlist.pieceIds
    updateSetlist(setlist.id, { pieceIds: before.filter((x) => x !== id) })
    refresh()
    notify(`Aus „${setlist.title}“ entfernt`, () => updateSetlist(setlist.id, { pieceIds: before }))
  }

  const remove = () => {
    const title = setlist.title
    back()
    const undo = deleteSetlist(setlist.id)
    refresh()
    notify(`Setlist „${title}“ gelöscht`, undo)
  }

  return (
    <Page
      backLabel={backLabel}
      onBack={back}
      right={
        <IconButton label="Umbenennen oder löschen" onClick={() => setSheet('actions')}>
          <IconMore />
        </IconButton>
      }
    >
      <section className="p-stack p-center" style={{ gap: 6, alignItems: 'center' }}>
        <span className="p-lbl">Programm</span>
        <h1 className="p-h1 p-setlist-h">{setlist.title}</h1>
        <span className="p-s2">
          {list.length} {list.length === 1 ? 'Stück' : 'Stücke'}
          {list.length ? ` · ca. ${formatMinutes(setlistSeconds(ctx, setlist))}` : ''}
        </span>
      </section>

      <button type="button" className="p-btn" disabled={!list.length} onClick={() => startUebung(list.map((p) => p.id))}>
        <IconPlay />
        Durchspielen
      </button>

      {list.length ? (
        <IonList className="p-list p-slides p-program" lines="none">
          <IonReorderGroup disabled={false} onIonItemReorder={reorder}>
            {list.map((p, i) => (
              <IonItemSliding key={p.id} className="p-slide">
                <IonItem className="p-slide-item" lines="none">
                  <div className="p-row p-prog-row">
                    <button type="button" className="p-prog-main" onClick={() => push({ name: 'stueck', pieceId: p.id })}>
                      <span className="p-ord">{i + 1}</span>
                      <span className="p-stack" style={{ gap: 1, minWidth: 0 }}>
                        <span className="p-row-t">{p.title}</span>
                        {p.artist ? <span className="p-s3 p-ell">{p.artist}</span> : null}
                      </span>
                      <span className="p-leader" aria-hidden="true" />
                      <span className="p-num p-s2">{formatMinutes(avgSessionOf(sessions, p.id))}</span>
                    </button>
                    <IonReorder className="p-handle" aria-label={`${p.title} verschieben`} />
                  </div>
                </IonItem>
                <IonItemOptions side="end" onIonSwipe={() => removePiece(p.id)}>
                  <IonItemOption className="p-slide-del" expandable onClick={() => removePiece(p.id)}>
                    Entfernen
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonReorderGroup>
        </IonList>
      ) : (
        <p className="p-note p-center">Noch leer. Füge Stücke hinzu – die Reihenfolge änderst du später am Griff.</p>
      )}

      <button type="button" className="p-link center" onClick={() => setSheet('add')}>
        <IconPlus />
        Stück hinzufügen
      </button>
      {list.length > 1 ? <p className="p-note p-center">Am Griff ziehen zum Umsortieren, nach links wischen zum Entfernen.</p> : null}

      {sheet === 'actions' ? (
        <ListSheet
          label="Setlist"
          onClose={() => setSheet(null)}
          items={[
            { key: 'rename', label: 'Umbenennen', onPick: () => setSheet('rename') },
            { key: 'delete', label: 'Setlist löschen', danger: true, onPick: remove },
          ]}
          note="Die Stücke selbst bleiben erhalten."
        />
      ) : null}

      {sheet === 'rename' ? (
        <SetlistNameSheet
          title="Umbenennen"
          initial={setlist.title}
          onClose={() => setSheet(null)}
          onSave={(name) => {
            updateSetlist(setlist.id, { title: name })
            refresh()
          }}
        />
      ) : null}

      {sheet === 'add' ? (
        <Sheet
          label="Stück hinzufügen"
          onClose={() => {
            setSheet(null)
            setQuery('')
          }}
        >
          {(zu) => (
            <div className="p-sheet-pad">
              <div className="p-between">
                <div className="p-sheet-title">Stück hinzufügen</div>
                <button type="button" className="p-link" onClick={zu}>
                  Fertig
                </button>
              </div>
              <label className="p-search">
                <IconSearch />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Titel oder Interpret"
                  aria-label="Suchen"
                />
              </label>
              {addable.length ? (
                <div className="p-list p-sheet-list">
                  {addable.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="p-row tight"
                      onClick={() => {
                        updateSetlist(setlist.id, { pieceIds: [...setlist.pieceIds, p.id] })
                        refresh()
                      }}
                    >
                      <Thumb piece={p} className="sm" />
                      <span className="p-row-main">
                        <span className="p-row-t">{p.title}</span>
                        {p.artist ? <span className="p-s3 p-ell">{p.artist}</span> : null}
                      </span>
                      <span className="p-acc">
                        <IconPlus />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-note">{pieces.length ? 'Alle Stücke sind schon in dieser Setlist.' : 'Noch keine Stücke angelegt.'}</p>
              )}
            </div>
          )}
        </Sheet>
      ) : null}
    </Page>
  )
}

export default Setlist
