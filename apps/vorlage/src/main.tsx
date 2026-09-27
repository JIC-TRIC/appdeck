import { mountApp } from '@lib/mount';
// Dark Mode folgt der iPhone-Einstellung – wie beim Launcher. Weglassen, wenn die App nur hell sein soll.
import '@lib/dark';
import { App } from './App';
import './app.css';

mountApp(<App />);
