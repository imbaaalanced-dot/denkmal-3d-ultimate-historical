# Denkmal 3D – Vier Tore und Maze (2.5.0)

Aus den drei bereitgestellten Archiven zusammengestellt am 29.09.2026.
Basis: `work/site` (Kael-/Hero-Saga-Stand, HTML-Version 2.4.0) aus
`denkmal-3d-ultimate-historical-edition-sites.zip`, ergänzt um Riftlanze I–III
und die zugehörige Darstellung aus `denkmal-3d-ultimate-rift-levels.zip`.
Darauf aufbauend ergänzt Version 2.5.0 vier feste Tore, Level-Abschluss nach
Welle 5 und ein dauerhaft freischaltbares Maze-Level 2. Die bestehende Live-Seite
wird durch einen GitHub-Upload nicht automatisch aktualisiert.

## Kampagne

Level 1 umfasst Wellen 1–5 mit festen Nord-, Ost-, Süd- und Westtoren.
Nach Welle 5 wird Level 2 im Hauptmenü freigeschaltet. Die Freischaltung liegt
in localStorage dieses Browsers; es gibt keine Kontosynchronisation.
Level 2 startet jederzeit neu bei Welle 6 mit 120 Essenz und sechs verfügbaren
Turmbauten. Gegner folgen einer festen Maze-Route; Türme dürfen nur auf den
markierten Plätzen am Wegrand stehen. Einzelne laufende Wellen werden nicht
gespeichert. Bei blockiertem Speicher erscheint ein Hinweis.

## Starten

Im Projektordner `python3 -m http.server 8000` ausführen und
http://localhost:8000 öffnen. Keine npm-Pakete und kein Build erforderlich.
Zum statischen Hosting den Projektordner als Webroot verwenden.
Die alte Sites-Konfiguration mit `dist`-Pfad wurde bewusst nicht übernommen.

## Prüfen

`node --check game.js`

`node --check hero-saga.js`

`node tests/game.test.cjs`

Die automatisierten Prüfungen simulieren DOM und Canvas. Sie ersetzen keinen
Browser- oder Touch-Test auf einem echten Android-Gerät.

## Dateien

- `index.html`, `styles.css`, `hero.css`: Oberfläche und Darstellung.
- `levels.js`: Karten, Maze-Pfad, Bauplätze und gespeicherte Freischaltung.
- `game.js`: Spielablauf, Gegner, Türme, Steuerung und Rendering.
- `hero-saga.js`: Kael, Ausrüstung, Geschichte und Sprachausgabe.
- `assets/`: verwendete Spielgrafiken und lokale MP3-Dateien.
- `tests/game.test.cjs`: bestehende Spielprüfungen plus Rift-Stufenauswahl.
- `ASSETS-KAEL.md`: übernommene Dokumentation der Helden-Assets.
- `CHANGELOG.md`: historisches Änderungsprotokoll, keine aktuelle Versionsangabe.
- `CLEANUP.md`: Auswahlentscheidungen und offene Entwicklungswünsche.

## GitHub

Den Inhalt dieses Ordners in das Zielrepository übernehmen. Keine alte
`.git`-Historie und keine Zugangsdaten aus den Archiven übernehmen.
Zielrepository: https://github.com/imbaaalanced-dot/denkmal-3d-ultimate-historical
