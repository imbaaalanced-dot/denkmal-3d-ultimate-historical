# Bereinigung – 29.09.2026

## Beibehalten und zusammengeführt

Der Kael-Stand enthält mehr Funktionalität als der Rift-Stand. Deshalb bleiben
Hero-Saga, Ausrüstung, Heldenbilder, Stimmen und vorhandene Fehlerkorrekturen
erhalten. Aus dem Rift-Paket wurden nur die drei Stufengrafiken, deren Laden
und die Auswahl beim Zeichnen übernommen. Alle sieben Turmtypen bleiben
im Code und in dieser archivbasierten Oberfläche erhalten.

## Aus dem neuen Paket ausgeschlossen

- `work/site/dist/`: identische Kopien der Quelldateien und Assets.
- `floor-stage`, `hell-stage`, `package-stage`, `release-2-3-stage`: ältere Builds.
- Verschachtelte TAR.GZ-Releases: zusätzliche archivierte Buildkopien.
- `patch.py`, `merge-patch.py`, `refine.py`, `integrate-kael.cjs`,
  `test-game.cjs`: alte einmalige Arbeits-/Integrationsskripte.
- Archivierte `.git`-Daten: gehören zum damaligen Repository.
- `.openai/hosting.json`: an das damalige Hosting gebundene Konfiguration.
- `Denkmal-Held-Quellen-und-Frames.zip`: separate Animationsquellen,
  QA-Bilder und Prüfberichte; der Spielcode lädt stattdessen die Kael-Assets.
  Dieses Archiv ist als Material für spätere Animationen weiterhin nützlich.
- Doppelte Basisdateien und identische Basisgrafiken der Rift-ZIP.

Alle Original-ZIPs bleiben unverändert. Aussortieren bedeutet hier:
nicht in das neue GitHub-Paket aufnehmen, nicht die Sicherungen löschen.

## Neu in Version 2.5.0

Vier feste Spawn-Tore in Level 1, Abschluss nach Welle 5, Levelauswahl im
Hauptmenü und persistente Freischaltung von Level 2. Im Maze-Level laufen
Gegner auf einem festen Weg und Türme stehen ausschließlich auf markierten
Bauplätzen. Ein neuer Level-2-Lauf startet bei Welle 6; kein Mid-Wave-Save.

## Weiterhin offen

Beschränkung der Oberfläche auf Bogen-/Kanonenturm, neue Grafiken dieser
beiden Türme und Zauberstab statt Glutklinge sind nicht Teil dieses Patches.
Die vorhandenen sieben Turmtypen und ihre Assets bleiben erhalten.

## Validierung

27 Gameplay-Prüfungen einschließlich aller drei Rift-Stufen und der Kampagne;
zusätzliche Prüfungen für Speicherung über frische Script-Kontexte hinweg
und blockierten Speicher. JavaScript-Syntax und lokale Assetverweise geprüft.

Browser-/Sichtprüfung konnte nicht ausgeführt werden: In der Arbeitsumgebung
war kein Chromium vorhanden und der Browserdownload schlug fehl.
GitHub-Uploadversuch: Schreibzugriff der Integration mit HTTP 403 abgewiesen;
dieser Build wurde noch nicht ins Repository übertragen.
