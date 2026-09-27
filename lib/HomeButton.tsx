/*
 * „‹ Apps“-Knopf für die Kopfzeile – führt zurück zum Launcher.
 *
 *   <IonButtons slot="start"><HomeButton /></IonButtons>
 */
import { IonButton, IonIcon } from '@ionic/react';
import { chevronBack } from 'ionicons/icons';

export function HomeButton({ label = 'Apps' }: { label?: string }) {
  const goHome = () => (window.Shell ? window.Shell.home() : (window.location.href = '../../'));
  return (
    <IonButton onClick={goHome}>
      <IonIcon slot="start" icon={chevronBack} />
      {label}
    </IonButton>
  );
}
