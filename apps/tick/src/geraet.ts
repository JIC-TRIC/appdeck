// Haptik beim Abhaken, wie in Form (apps/form/src/geraet.ts): Android ueber
// Vibration, iPhone ab iOS 18 ueber einen umgelegten Schalter. Nur ein Zusatz -
// ohne ihn bleiben Animation und Farbe als Rueckmeldung.

const ios = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)

function schalterTick() {
  // <input type="checkbox" switch> gibt beim Umlegen einen kurzen Tick, auch
  // in Web-Apps - aber nur aus einem Tipp heraus.
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

export function haptik() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(12)
    return
  }
  if (ios) schalterTick()
}
