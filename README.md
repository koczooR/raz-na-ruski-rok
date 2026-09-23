# Licznik tygodni

Nieoficjalny licznik zespołu: ile pełnych tygodni minęło, odkąd Klaudia była z nami
w biurze cały tydzień. Statyczna strona — czysty HTML, CSS i JS, bez buildu
i bez zależności. Konfetti startuje przy wejściu na stronę.

## Struktura

```
index.html      – szkielet strony
styles.css      – style i responsywność
app.js          – konfiguracja, liczenie tygodni, obsługa konfetti
confetti.js     – animacja konfetti na canvasie
assets/
  favicon.svg
  klaudia.jpg   – zdjęcie (patrz niżej)
.nojekyll       – GitHub Pages serwuje pliki bez przetwarzania Jekyllem
```

## Konfiguracja

Wszystko siedzi w obiekcie `CONFIG` na górze [`app.js`](app.js):

| Pole | Znaczenie |
|---|---|
| `name` | imię osoby, której dotyczy licznik |
| `lastOfficeDate` | data ostatniego pełnego tygodnia w biurze, `YYYY-MM-DD` |
| `lastOfficeTime` | godzina, od której liczymy (domyślnie `17:00` — koniec piątku) |
| `rangeLabel` | opis zakresu pokazywany pod zdjęciem i w akapicie |
| `headline` | nagłówek; `{name}` zostanie podmienione na imię |
| `confettiColors`, `confettiCount` | wygląd konfetti |

Teksty statyczne (eyebrow, akapit pod licznikiem) są w `index.html`.

### Podgląd bez commita

Dwa parametry w adresie nadpisują konfigurację — przydatne do sprawdzenia,
jak strona wygląda przy innej liczbie:

```
?date=2026-04-21          → 22 tygodnie
?date=2026-09-16&name=Ala → 1 tydzień
```

Niepoprawna data jest ignorowana (strona wraca do `CONFIG`).

## Zdjęcie

Wrzuć plik jako `assets/klaudia.jpg` (obsługiwany jest też `assets/klaudia.png`).
Kadr to **4:5 w pionie**, sensowna szerokość to ok. 720 px — obraz i tak jest
przycinany przez `object-fit: cover`.

Bez pliku strona nie psuje się: polaroid pokazuje zastępczy kafel z inicjałem.

## Uruchomienie lokalne

Wystarczy dwuklik w `index.html` (skrypty są klasyczne, nie ma modułów ES).
Wygodniej przez serwer:

```bash
python -m http.server 8123
```

Potem `http://localhost:8123`.

## Wdrożenie na GitHub Pages

Strona jest serwowana wprost z brancha `main`, z katalogu głównego.

1. Utwórz puste repozytorium na GitHubie (bez README, bez `.gitignore`).
2. Podłącz je i wypchnij:

   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

3. W repozytorium: **Settings → Pages → Source: _Deploy from a branch_ →
   Branch: `main` / `(root)` → Save**.
4. Po ok. 1–2 minutach strona żyje pod `https://<user>.github.io/<repo>/`.

Kolejne zmiany publikują się przez zwykły `git push` na `main`.

Wszystkie ścieżki w kodzie są względne, więc strona działa zarówno w podkatalogu
(`/<repo>/`), jak i na domenie własnej.

## Dostępność i wydajność

- Liczba i odmiana ogłaszane czytnikom ekranu przez `aria-live`.
- `prefers-reduced-motion: reduce` wyłącza konfetti i animacje wejścia.
- Konfetti kończy się samo i zwalnia `requestAnimationFrame` — nie zajmuje CPU w tle.
- Licznik odświeża się co minutę oraz po powrocie do karty.
- Brak zależności, brak buildu; jedyny zasób zewnętrzny to fonty Google
  (`Bricolage Grotesque`, `DM Mono`) — bez nich strona nadal wygląda poprawnie.
