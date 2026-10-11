// Was das Geraet fuers Training kann: einen kurzen Ton am Ende der Pause und
// den Bildschirm anlassen. Beides nur, solange die App offen ist - iOS haelt
// Web-Apps im Hintergrund an, eine Mitteilung gibt es dort nicht.

import { useEffect } from 'react'

// ---------- Ton ----------

let audio: AudioContext | null = null

/**
 * Safari spielt Ton erst nach einem Tipp ab. Darum wird der Ton beim Abhaken
 * vorbereitet - am Ende der Pause tippt ja niemand.
 */
export function tonBereit() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    audio ??= new AC()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

/** Zwei kurze Toene (und Vibration, wo es sie gibt - auf dem iPhone im Browser nicht). */
export function piep() {
  navigator.vibrate?.([120, 80, 120])
  const a = audio
  if (!a) return
  const t0 = a.currentTime
  for (const [ab, hz] of [
    [0, 880],
    [0.22, 1175],
  ]) {
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = 'sine'
    o.frequency.value = hz
    g.gain.setValueAtTime(0.0001, t0 + ab)
    g.gain.exponentialRampToValueAtTime(0.3, t0 + ab + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ab + 0.18)
    o.connect(g)
    g.connect(a.destination)
    o.start(t0 + ab)
    o.stop(t0 + ab + 0.2)
  }
}

// ---------- Haptik ----------

/** iPhone: Safari kennt navigator.vibrate nicht. */
const ios = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)

function schalterTick() {
  // Ab iOS 18 gibt ein umgelegter Schalter (<input type="checkbox" switch>)
  // einen kurzen Haptik-Tick - auch in Web-Apps, aber nur aus einem Tipp
  // heraus. Ein Zusatz: geht es nicht (aelteres iOS, spaeter abgeschaltet),
  // bleiben Animation und Farbe als Rueckmeldung.
  try {
    const label = document.createElement('label')
    label.ariaHidden = 'true'
    label.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.head.appendChild(label)
    label.click()
    label.remove()
  } catch {
    /* ohne Haptik */
  }
}

/** Kurzer Tick beim Abhaken - doppelt bei einem Rekord. */
export function tick(stark = false) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(stark ? [18, 70, 28] : 12)
    return
  }
  if (!ios) return
  schalterTick()
  if (stark) window.setTimeout(schalterTick, 110)
}

// ---------- Bildschirm an ----------

export const kannWach = typeof navigator !== 'undefined' && 'wakeLock' in navigator

/**
 * Haelt den Bildschirm an, solange `an` gilt. iOS gibt die Sperre beim
 * Verlassen der App frei - beim Zurueckkommen wird sie neu geholt.
 */
export function useWach(an: boolean) {
  useEffect(() => {
    if (!an || !kannWach) return
    let sperre: WakeLockSentinel | null = null
    let vorbei = false
    const hole = async () => {
      if (vorbei || document.visibilityState !== 'visible') return
      try {
        sperre = await navigator.wakeLock.request('screen')
      } catch {
        sperre = null
      }
    }
    void hole()
    const sichtbar = () => void hole()
    document.addEventListener('visibilitychange', sichtbar)
    return () => {
      vorbei = true
      document.removeEventListener('visibilitychange', sichtbar)
      void sperre?.release().catch(() => {})
    }
  }, [an])
}
