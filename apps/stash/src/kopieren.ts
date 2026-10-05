/**
 * Text in die Zwischenablage. Erst die Clipboard-API, sonst der alte Weg ueber
 * ein unsichtbares Textfeld (aeltere iOS-Versionen, oder http im WLAN beim
 * Testen - dort gibt es die Clipboard-API nicht). Muss direkt aus einem Tipp
 * heraus laufen, sonst verweigert iOS beides.
 */
export async function kopiere(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // weiter mit dem alten Weg
    }
  }
  return ueberTextfeld(text)
}

function ueberTextfeld(text: string): boolean {
  const feld = document.createElement('textarea')
  feld.value = text
  feld.readOnly = true
  // 16 px: sonst zoomt iOS beim Markieren hinein.
  feld.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px'
  document.body.appendChild(feld)
  feld.select()
  feld.setSelectionRange(0, text.length)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  feld.remove()
  return ok
}
