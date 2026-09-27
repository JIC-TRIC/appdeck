import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { HomeButton } from '@lib/HomeButton';
import { useStored } from '@lib/useStored';

// WICHTIG: gleiche ID wie in apps.js – so bleiben die Daten jeder App getrennt
const APP_ID = 'vorlage';
const TITLE = 'Meine neue App';

export function App() {
  const [value, setValue] = useStored(APP_ID, 'value', 0);
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const reset = () =>
    presentAlert({
      header: 'Wirklich zurücksetzen?',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Zurücksetzen',
          role: 'destructive',
          handler: () => {
            setValue(0);
            presentToast({ message: 'Zurückgesetzt', duration: 1500, position: 'top' });
          },
        },
      ],
    });

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <HomeButton />
          </IonButtons>
          <IonTitle>{TITLE}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="grouped">
        {/* Großer Titel, der beim Scrollen in die Kopfzeile wandert (wie in iOS) */}
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">{TITLE}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonList inset>
          <div className="big-number">{value}</div>
        </IonList>
        <IonNote className="ion-padding-horizontal">
          Beispiel: Der Wert bleibt gespeichert, auch nach dem Schließen.
        </IonNote>

        <IonList inset>
          <IonListHeader>Aktionen</IonListHeader>
          <IonItem button detail={false} onClick={() => setValue((v) => v + 1)}>
            <IonLabel color="primary">Eins dazu</IonLabel>
          </IonItem>
          <IonItem button detail={false} onClick={reset}>
            <IonLabel color="danger">Zurücksetzen</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
