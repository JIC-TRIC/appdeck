import { useRef, useState } from 'react'
import { IconClipboard, IconExternal } from '../icons'
import { Sheet, SheetHead, Thumb } from '../ui'
import { PRESETS } from '../model'
import { addPiece, findDuplicate, updatePiece } from '../store'
import { extractVideoId, thumbnailUrl, youtubeSearchUrl } from '../util'
import type { PianoCtx } from '../types'

type PresetId = (typeof PRESETS)[number]['id']

// Neues Stueck oder Bearbeiten. Beim Anlegen grob den Lernstand waehlen statt
// neun Schalter; genauer geht es auf der Seite des Stuecks.
function PieceForm({ ctx, pieceId, onClose }: { ctx: PianoCtx; pieceId?: string; onClose: () => void }) {
  const editing = pieceId ? ctx.byId[pieceId] : undefined
  const [url, setUrl] = useState(editing?.youtubeUrl ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [artist, setArtist] = useState(editing?.artist ?? '')
  const [preset, setPreset] = useState<PresetId>('neu')
  const [error, setError] = useState<string | null>(null)
  const after = useRef<(() => void) | null>(null)

  const videoId = extractVideoId(url)

  const paste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (text) {
        setUrl(text)
        setError(null)
      }
    } catch {
      setError('Einfügen nicht erlaubt – bitte den Link von Hand einfügen.')
    }
  }

  const submit = (zu: () => void) => {
    if (!title.trim()) return
    const dup = url.trim() ? findDuplicate(url, pieceId) : undefined
    if (dup) {
      setError(`Dieses Video gibt es schon: „${dup.title}“.`)
      return
    }
    if (editing) {
      updatePiece(editing.id, { youtubeUrl: url.trim(), title: title.trim(), artist: artist.trim() })
      after.current = () => {
        ctx.refresh()
        ctx.notify('Gespeichert')
      }
    } else {
      const progress = PRESETS.find((p) => p.id === preset)?.progress ?? PRESETS[0].progress
      const piece = addPiece({ title, artist, youtubeUrl: url, progress })
      after.current = () => {
        ctx.refresh()
        ctx.push({ name: 'stueck', pieceId: piece.id })
      }
    }
    zu()
  }

  return (
    <Sheet
      label={editing ? 'Stück bearbeiten' : 'Neues Stück'}
      onClose={() => {
        const f = after.current
        after.current = null
        onClose()
        f?.()
      }}
    >
      {(zu) => (
        <form
          className="p-sheet-pad p-form"
          onSubmit={(e) => {
            e.preventDefault()
            submit(zu)
          }}
        >
          <SheetHead
            title={editing ? 'Bearbeiten' : 'Neues Stück'}
            onCancel={zu}
            onDone={() => submit(zu)}
            doneDisabled={!title.trim()}
          />

          <div className="p-field">
            <label className="p-lbl" htmlFor="f-link">
              YouTube-Link
            </label>
            <div className="p-hstack" style={{ gap: 8 }}>
              <input
                id="f-link"
                className="p-input"
                type="url"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://youtu.be/…"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
              />
              <button type="button" className="p-btn sm sec" onClick={paste}>
                <IconClipboard />
                Einfügen
              </button>
            </div>
            {videoId ? (
              <div className="p-hstack" style={{ gap: 10 }}>
                <Thumb src={thumbnailUrl(url)} className="preview" />
                <span className="p-s2">Video erkannt – das Vorschaubild kommt von YouTube.</span>
              </div>
            ) : url.trim() ? (
              <span className="p-s2">Kein YouTube-Link erkannt. Speichern geht trotzdem, nur ohne Video.</span>
            ) : null}
          </div>

          <div className="p-field">
            <label className="p-lbl" htmlFor="f-title">
              Titel
            </label>
            <input
              id="f-title"
              className="p-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Clair de Lune"
              enterKeyHint="next"
            />
          </div>

          <div className="p-field">
            <label className="p-lbl" htmlFor="f-artist">
              Interpret oder Komponist
            </label>
            <input
              id="f-artist"
              className="p-input"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="z. B. Claude Debussy"
              enterKeyHint="done"
            />
          </div>

          {!editing ? (
            <div className="p-field">
              <span className="p-lbl" id="f-stand">
                Wo stehst du?
              </span>
              <div className="p-chips" role="radiogroup" aria-labelledby="f-stand">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={preset === p.id}
                    className={`p-chip${preset === p.id ? ' on' : ''}`}
                    onClick={() => setPreset(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <span className="p-s3">Genauer geht’s später auf der Seite des Stücks.</span>
            </div>
          ) : null}

          {error ? <p className="p-error">{error}</p> : null}

          <a className="p-link" href={youtubeSearchUrl(title ? `${title} ${artist} piano` : '')} target="_blank" rel="noreferrer">
            Auf YouTube suchen
            <IconExternal />
          </a>
        </form>
      )}
    </Sheet>
  )
}

export default PieceForm
