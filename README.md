# ecogdmsrl.github.io

## Anyagátvétel kalkulátor

Belső segédeszköz hulladékanyagok átvételekor a fizetendő összeg kiszámítására (súly × egységár), hogy ne kelljen külön számológéppel számolni és papírra írni.

**Jogi megjegyzés / disclaimer:** Ez az alkalmazás kizárólag egy belső, nem hivatalos segédeszköz, amely egy hagyományos számológépet helyettesít az összegek kiszámításában. Nem hivatalos nyilvántartó, számlázó vagy könyvelési rendszer, nem minősül jogi, pénzügyi vagy számviteli dokumentumnak, és nem vált ki semmilyen jogszabály által előírt nyilvántartást, bizonylatot vagy engedélyt. A megjelenített árak és számítások tájékoztató jellegűek; a tényleges elszámolásért és a vonatkozó jogszabályi kötelezettségek betartásáért a használó felel.

---

### GitHub token beállítása (árlista mentéséhez a settings.html-en)

Az árlista megtekintéséhez nem kell token, azt bárhonnan lehet olvasni. A **mentéshez** viszont igen:

1. GitHub.com → profilkép → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Repository access: "Only select repositories" → `ecogdmsrl.github.io`.
3. Permissions → Repository permissions → Contents → **Read and write**. Minden más maradjon "No access".
4. Állíts be lejárati dátumot (pl. 90 nap vagy 1 év), majd Generate token.
5. A kapott tokent (`github_pat_...`-tal kezdődik) másold be a settings.html "GitHub mentési adatok" mezőjébe, amikor menteni szeretnél.

Ez a token csak erre az egy repóra és csak fájlok írására jogosít — ha valaki megszerzi, legfeljebb a `materials.json`-t tudja módosítani, mást nem. Mentés után a változás néhány percen belül (a GitHub rövid cache-elése miatt) jelenik meg minden eszközön.
