# De Verborgen Republiek

**De Verborgen Republiek** is een statische browsergame voor geschiedenis, gemaakt voor **vmbo bk leerjaar 1**.

Leerlingen spelen een historische escape room over **Hoofdstuk 6 - Tijd van ontdekkers en hervormers, 1500-1600**. Ze lossen vijf kamers op, verzamelen codes en openen daarna de eindkluis met `1588`.

## Hoe speel je?

1. Open de GitHub Pages-link.
2. Klik op **Start de escape room**.
3. Lees per kamer het verhaal en de vraag.
4. Gebruik eventueel de hint.
5. Verzamel alle codes.
6. Open de finale met eindcode `1588`.

## Leerdoelen

- Uitleggen waarom Europeanen zelf naar Azië wilden varen.
- Columbus en Vasco da Gama aan hun routes koppelen.
- Begrijpen dat de drukpers nieuwe ideeën sneller verspreidde.
- Begrijpen wat hervorming, katholiek, protestant en ketter betekenen.
- Oorzaken van de Opstand tegen Filips II herkennen.
- Weten wie de watergeuzen waren.
- Weten dat de Republiek ontstond in 1588 en door Spanje werd erkend in 1648.

## Kamers

1. De Haven van Specerijen
2. De Kaartenkamer
3. De Drukperskamer
4. De Zaal van Filips II
5. De Geuzenhaven
6. De Kluis van de Republiek

## Privacy en AVG

Deze game verwerkt geen persoonsgegevens.

- Geen naamveld.
- Geen e-mailadres.
- Geen leerlingnummer.
- Geen login of account.
- Geen database.
- Geen cookies.
- Geen tracking of analytics.
- Geen externe scripts, fonts, CDN's of API's.
- Geen OpenAI API.

De game gebruikt alleen `localStorage` om anonieme voortgang op hetzelfde apparaat te bewaren: huidige kamer en verzamelde codes.

## Geen GPT/API-kosten

De game gebruikt geen GPT, geen OpenAI API en geen andere externe API. Er zijn dus geen API-kosten.

## Publiceren via GitHub Pages

1. Ga naar **Settings** van deze repository.
2. Ga naar **Pages**.
3. Kies **Deploy from a branch**.
4. Kies branch **main** en map **root**.
5. Klik op **Save**.
6. Open daarna de GitHub Pages-link.

## Vragen aanpassen

Alle lesinhoud staat in:

```text
data/escape-room.json
```

Pas daar vragen, antwoorden, hints, feedback en codes aan. De game blijft statisch en werkt zonder buildstap.

## Bestandsstructuur

```text
index.html
style.css
src/main.js
data/escape-room.json
data/chapters.json
README.md
.nojekyll
```
