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
| `fullWeeks` | lista piątków kończących pełne tygodnie w biurze, od najstarszego |
| `lastOfficeTime` | godzina, od której liczymy (domyślnie `15:00` — koniec piątku) |
| `rangeLabel` | opis ostatniego tygodnia, pokazywany pod zdjęciem i w akapicie |
| `headline` | nagłówek; `{name}` zostanie podmienione na imię |
| `ranksTitle` | nagłówek listy rang (pełny tekst — imię trzeba odmienić) |
| `confettiColors`, `confettiCount` | wygląd konfetti |

Teksty statyczne (eyebrow, akapit pod licznikiem) są w `index.html`.

### Dlaczego lista dat, a nie jedna data

Ostatnia pozycja `fullWeeks` napędza główny licznik. Przerwy między kolejnymi
pozycjami dają **rekord wszech czasów** — najdłuższą serię bez pełnego tygodnia
w biurze. Jedna data oznacza brak historii, więc trwająca seria jest od razu
rekordem.

Przykład:

```js
fullWeeks: ["2025-06-06", "2026-06-05"],
```

Przerwa między tymi piątkami to 52 tygodnie, z czego jeden spędzony w biurze,
więc rekord wynosi 51. Kiedy obecna seria go przebije, pojawia się plakietka
„nowy rekord" i dodatkowe konfetti.

Po pełnym tygodniu w biurze dopisujesz nowy piątek na koniec listy — licznik
startuje od zera, a poprzednia seria wchodzi do historii rekordów.

### Podgląd bez commita

Parametry w adresie nadpisują konfigurację — przydatne do sprawdzenia,
jak strona wygląda przy innych danych:

```
?dates=2025-06-06,2026-06-05   → historia z rekordem 51 tygodni
?date=2026-09-16               → skrót na jedną datę
?name=Ala                      → podmiana imienia
```

Niepoprawne daty są pomijane; gdy nie zostanie żadna, strona wraca do `CONFIG`.

## Zdjęcie

Plik to `assets/klaudia.png` — na sztywno, bez wariantów. Kadr wyświetlany to
**4:5 w pionie**, obraz jest przycinany przez `object-fit: cover`, więc kwadratowe
źródło straci lewy i prawy margines.

Bez pliku strona nie psuje się: polaroid pokazuje zastępczy kafel z inicjałem.

## Rekord i rangi

Pod licznikiem są dwa bloki wyliczane z `fullWeeks`:

**Rekord wszech czasów** — najdłuższa historyczna seria bez pełnego tygodnia,
pasek postępu obecnej serii względem rekordu i komentarz („Do pobicia rekordu
brakuje 33 tygodni.", „Remis z rekordem.", „Poprzedni rekord właśnie padł.").
Pobicie rekordu odpala konfetti i toast 2,6 s po wejściu na stronę.

**Rangi** — siedem progów (1, 4, 10, 20, 26, 39, 52 tygodnie) z nazwami i
statusem: zdobyta, obecna ranga albo ile tygodni brakuje. Progi zdefiniowane
w stałej `TIERS` w [`app.js`](app.js).

O tym, czy ranga jest **zdobyta**, decyduje rekord wszech czasów, nie trwająca
seria — raz wbitej rangi pełny tydzień w biurze nie odbiera. Zeruje się tylko
podświetlenie **obecnej rangi** i odliczanie do kolejnych progów.

## Easter eggi

Sześć ukrytych reakcji, wszystkie kończą się toastem u dołu ekranu (znika po 3,6 s).
Definicje siedzą w sekcji „easter eggi" w [`app.js`](app.js).

| Gdzie | Co robi |
|---|---|
| Kliknięcie w zdjęcie | cykl sześciu podpisów (wymówki), za każdym razem inny przechył polaroidu |
| 3. kliknięcie w licznik | „Kliknięcie nie zeruje licznika. Próbowaliśmy." |
| 7. kliknięcie w licznik | konfetti w nagrodę |
| 12. kliknięcie w licznik | warunek resetu i wyzerowanie serii |
| Słowo „herbata" w akapicie | okrągłe konfetti w barwach naparu |
| Trzykrotne kliknięcie w datę w stopce | „Dziś? Pewnie jeden dzień zdalnie." |
| Wpisanie `biuro` | duży wystrzał konfetti |
| Wpisanie `chora` | tryb L4 — zdjęcie zielenieje na 6 sekund |

Hasła z klawiatury działają globalnie: skrypt trzyma bufor ostatnich 12 znaków
i sprawdza jego końcówkę, więc nie trzeba niczego klikać ani w nic celować.

Zdjęcie i „herbata" są dostępne z klawiatury (Tab, potem Enter/Spacja). Data
w stopce celowo nie ma `cursor: pointer` — ma być znaleziona przypadkiem.
Przy `prefers-reduced-motion: reduce` konfetti nie leci, ale toasty i podpisy
działają normalnie.

## Widoczność w wyszukiwarkach

Strona jest wyłączona z indeksowania: `<meta name="robots" content="noindex, nofollow,
noarchive, noimageindex">` w `index.html` oraz `robots.txt` z `Disallow: /`.

Uwaga: przy Pages projektowych (`https://<user>.github.io/<repo>/`) roboty czytają
`robots.txt` z katalogu głównego domeny, czyli z repozytorium `<user>.github.io` —
plik z tego repo nie zadziała. Realną ochroną jest tu meta `robots`, która działa
niezależnie od adresu.

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
