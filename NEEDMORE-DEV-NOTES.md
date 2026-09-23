# NeedMore äpp — üleandmise kokkuvõte (jätkamiseks ChatGPT-s)

See dokument on mõeldud kopeerimiseks ChatGPT vestluse algusesse (koos lisatud
lähtekoodifailidega), et uus assistent saaks täpselt sealt jätkata, kus pooleli jäi.

## Mis see äpp on

"NeedMore" — jagatud pere ostunimekirja ja kulustatistika äpp kahele inimesele
(kaks eri telefoni, iPhone + Android), mis:
- ennustab tarbimismustri põhjal, mis kodus otsa saamas on (algoritm ostuajaloo pealt)
- lubab ühel lisada nimekirja, teine näeb reaalajas ja saab poes linnukesega ära märkida
- loeb tšeki fotolt automaatselt tooted+hinnad (AI, Claude API kaudu)
- pakub AI-retseptisoovitusi kodus olevatest toodetest
- on paigaldatav "päris äpina" mõlema telefoni avakuvale (PWA)

## Praegune tehniline seis (12.09.2026 seisuga)

**Elus link:** https://needmore-pere.netlify.app (Netlify, konto omanik: Ingmar)

**Firebase projekt:** `needmore-8ada2` (Firestore andmebaas, asukoht eur3/europe-west)
- Andmed asuvad teel `households/<pere-kood>/...` — pere-kood on lihtne tekstivõti
  (nt "roustiku-pere"), ei kasuta kasutajakontosid/autentimist
- **TÄHTIS:** Firestore on hetkel "test mode" turvareeglitega, mis **aeguvad ~30 päeva
  pärast loomist (u. 12. oktoober 2026)**. Enne seda tuleb kirjutada päris
  security rules (praegu on kõigil täielik luge/kirjuta ligipääs).

**Netlify sait:** `needmore-pere` (drag-and-drop deploy, mitte Git-põhine)
- Keskkonnamuutuja `ANTHROPIC_API_KEY` on seadistatud (Site configuration ->
  Environment variables), märgitud "Contains secret values"
- Serverless funktsioon `functions/ai.js` pöördub Claude API poole
  (`https://api.anthropic.com/v1/messages`), mudel on määratud konstandina
  `claude-sonnet-4-6` (vaikimisi; ülekirjutatav env muutujaga `ANTHROPIC_MODEL`)
- `netlify.toml` osutab funktsioonide kausta: `functions = "functions"`

## Arhitektuur / failid

- **app_head.jsx** — kogu taaskasutatav UI: disainisüsteem (värvid, ikoonid,
  komponendid), ennustusalgoritm (`buildProducts`), kõik vaated (ListView,
  AddView, RecipesView, MoneyTab/statistika, ProductSheet, SettingsSheet jne),
  AI-abifunktsioonid (`readReceipt`, `fetchRecipes`, `fetchRecipeDetail`, mis
  kõik kutsuvad `callAI()` helperit, mis omakorda POST'ib
  `/.netlify/functions/ai` peale)
- **app_tail.jsx** — andmekiht ja App-komponent: Firebase Firestore adapter
  (`makeDb`), local-only fallback ilma Firebase'ita (`makeLocalDb`,
  localStorage-põhine, kasutusel kui `window.__FIREBASE_CONFIG__` puudub),
  `HouseholdGate` (pere-koodi sisestamise ekraan), põhi-`App` komponent
- **app_full.jsx** = app_head.jsx + app_tail.jsx kokku pandult — see on
  esbuild'i sisend
- **app.js** = app_full.jsx kompileeritud tavaliseks JS-iks (esbuild, JSX ->
  React.createElement, ilma runtime-Babel'ita — see oli teadlik valik, kuna
  runtime-transpileerimine (Babel-standalone) põrkas algselt CSP piirangute
  vastu ühes varasemas hostimiskeskkonnas)
- **functions/ai.js** — Netlify serverless funktsioon, mis hoiab
  ANTHROPIC_API_KEY't serveripoolel ja edastab pilte/prompte Claude API-le,
  parsib JSON-vastuse, tagastab `{ok:true, data}` või `{ok:false, code, message}`
- **netlify.toml** — funktsioonide kausta konfiguratsioon
- **sw.js** — service worker (PWA), cache-nimi `needmore-v3`. Kasutab
  "network-first" strateegiat (proovib alati võrku enne, langeb vahemällu
  ainult võrguühenduse puudumisel) — see parandus tehti pärast seda, kui
  vana "cache-first" strateegia jättis kasutaja telefoni vana äpiversiooni
  püsima pärast uuendust. **Iga tuleviku-deploy'i puhul, kui app.js
  sisu muutub, tasub CACHE muutuja väärtust tõsta (nt "needmore-v4"), et
  vältida sama probleemi kordumist.**
- **index.html / index_top.html / index_mid.html / index_tail.html** —
  index.html on kokku pandud index_top + react.min.js + index_mid +
  react-dom.min.js + index_tail (React/ReactDOM on inline'itud, mitte
  CDN'ist laetud — kasutaja eelistus vältida väliseid CDN-sõltuvusi).
  index_tail.html sisaldab ka `window.__FIREBASE_CONFIG__` objekti tegelike
  väärtustega (need loeti kasutaja Firebase konsooli ekraanipildilt — VÄIKE
  RISK, et mõni sarnane märk sai valesti loetud; kui äpp lakkab ühel hetkel
  Firebase'iga ühendumast, kontrolli seda esimesena).

## Mis on juba VALMIS ja testitud

- Jagatud ostunimekiri kahe telefoni vahel (Firestore reaalajas sync) —
  testitud päriselt kahe seadme vahel, töötab
- Ennustusalgoritm (mis on otsas, kui kiiresti otsa saab)
- Kulustatistika (Money/Stats vaade, kuu/nädala graafikud)
- Hinnangulise ostu loogika: kui "Lõpeta ostukäik" tehakse ilma tšekita,
  luuakse "estimated" tšekk viimase teadaoleva hinnaga; kui päris tšekk
  lisatakse hiljem (14 päeva aknas), asendab see hinnangulise rea
- PWA install mõlemale platvormile (Android testitud päriselt, iPhone
  juhendatud aga mitte veel kasutaja poolt kinnitatud)
- Tšeki AI-lugemine (Pildista tšekk) ja AI-retseptid — kood on valmis ja
  Playwright-testitud mock-AI vastustega (kõik vood: pildi üleslaadimine ->
  parsitud read -> review -> salvestamine; retseptide genereerimine ->
  detailvaate laadimine). **Reaalse Claude API võtmega pole seda veel
  kasutaja poolt lõpuni läbi testitud** — viimane samm oli Netlify
  vahemälu (service worker cache) probleemi lahendamine, mis takistas
  uue versiooni nägemist kasutaja telefonis.

## POOLELI / järgmisena vaja teha

1. **Kinnitada, et AI tšeki-lugemine reaalselt töötab** kasutaja telefonis
   pärast vahemälu tühjendamist ja uue `app` kausta üleslaadimist Netlify's
   (see oli täpselt see samm, mille juures vestlus katkes)
2. **Firestore security rules** — LAHENDATUD 19.09.2026 osas, mis puudutab
   `households/<kood>/**` (ei aegu enam). Kui lisati "Minu konto" funktsioon
   (vt allpool), tuleb reeglitele juurde lisada ka `users/{uid}` match-blokk —
   vaata README.txt-st täpne tekst, mis tuleb Firebase konsoolis Publish'ida.
3. **iPhone'i "Lisa avakuvale"** — juhendatud, aga mitte kinnitatud, et
   teine pereliige on selle oma iPhone'i teinud
4. Võimalikud edasised soovid: PDF-eksport on juba olemas (`downloadRecipe`,
   `recipePdf` — omaette, ei vaja AI-d), täiendavad statistika-vaated,
   rohkem tootekategooriaid, vms — kasutajaga läbi rääkimata

## 19.09.2026 lisandus: konto, teavitused, Pro pakett

Tehti täielik UX/loogika audit (Playwright'iga läbi klikitud kõik vood) ja
paranadatud rida päris bugisid: koguse-parandus tšekil ei uuendanud enam
ühikuhinda õigesti; "Vali tavalised tooted" nupp kadus jäädavalt ära, kui
tootekogus ületas 14 (nüüd on see ka Seadetes alati kättesaadav); tühja
nimekirja tuvastus kasutas vale muutujat (nüüd eristab "nimekiri on
tühi" vs "kõik on praegu olemas"); "Vaheta kood" ja "Taasta failist"
said kinnitusdialoogi (varem üks vajutus ja kõik oli kadunud); tootele,
mille jälgimine oli peatatud, taastub jälgimine automaatselt, kui seda
uuesti ostetakse; jne — täisnimekiri on git'i baseline-commiti sõnumis
ja vestluse ajaloos.

Lisati ka reaalne isiklik kontosüsteem Firebase Authentication'iga
(email+parool), täiesti eraldiseisev pere-koodi jagatud andmetest:
- `useAccount()` hook ja `AccountSheet` komponent (app_tail.jsx / app_head.jsx)
- Isiklikud andmed elavad teel `users/{uid}` (MITTE households/ alla)
- Profiilis: `plan` ("free"/"pro") ja `notifications` ({enabled, categories})
- Retseptid-vaade on nüüd `plan === "pro"` taga (paywall UI olemas)
- Kohalikud brauseri-teavitused (Notification API) tootele, mis läheb
  "otsas" olekusse, kui kasutaja on need enda kontos sisse lülitanud —
  EI OLE päris push, töötab ainult kui äpp on hiljuti avatud olnud
- Pro pakett on "testrežiimis" (nupp lülitab kohe sisse) — PÄRIS MAKSED
  (nt Stripe) POLE seadistatud, see vajab kasutaja enda otsust hinna ja
  Stripe konto kohta enne edasi minekut
- Nõuab kaks Firebase konsooli sammu, mis pole veel tehtud (vt README.txt):
  1) Authentication -> Sign-in method -> Email/Password -> Enable
  2) Firestore Rules uuendamine, et lisada `users/{uid}` match-blokk

Testimiseks laiendati `mock-firebase.js`-i minimaalse in-memory Auth
mockiga (`window.firebase.auth()`), et kogu konto-voogu saaks Playwright'iga
läbi testida ilma päris Firebase'ita.

Enne neid muudatusi tehti git baseline-commit (`git log` selles kaustas) ja
täielik kausta-koopia `/home/claude/backups/pwa-baseline-2026-09-19/` —
kui uus versioon ei meeldi, saab sealt taastada.

## 19.09.2026 lisandus 2: Nädalaplaan (söögikorra planeerimine)

Ehitati üles kasutaja järgmine soov ("Ehita see ka nüüd") — päris
söögikorra-planeerimise tööriist, mitte ainult retseptisoovitused.
Retseptid-vaates on nüüd kaks alamsakki: "Retseptisoovitused" (vana
funktsioon) ja "Nädalaplaan" (uus). Uus `MealPlanner` komponent
(app_head.jsx, `RecipesView` ja `RecipeSheet` vahel) haldab:
- nädala navigatsiooni (esmaspäev-põhine, `off` state nihkega),
- `data.mealPlan = { "<YYYY-MM-DD>": { id?, name } }` andmemudelit,
- päeva peale valimist: kas olemasolev AI-retsept (klõps avab sama
  `RecipeSheet` mis Retseptisoovitused sakis) või vabalt kirjutatud
  toidunimi (ei ava retsepti-vaadet, kuna sellel pole `id`-d),
- kustutamist "×" nupuga.

Nädalaplaan on Pro pakett (sama paywall mis retseptidel, kuna elab
sama `RecipesView` sees). Testitud täielikult Playwright'iga
(`probe-mealplan.js`): konto loomine, Pro testrežiimi lülitamine,
retseptide genereerimine (mock AI), retsepti määramine esmaspäevale,
vaba teksti määramine teisipäevale, nädala vahetamine edasi-tagasi
(andmed püsivad), retsepti-põhise päeva avamine (RecipeSheet ilmub),
päeva tühjendamine "×" nupuga — kõik õnnestus, 0 konsooli viga.

`sw.js` CACHE tõsteti `needmore-v5` -> `needmore-v6`.

## 19.09.2026 lisandus 3: KRIITILINE parandus — äpp jäi "Avan…" peale kinni

Pärast eelmise lisanduse (konto/Auth) live'i panekut jäi äpp reaalse Firebase
küljes PÄRISELT kinni "Avan…" tekstile (index.html staatiline fallback),
mitte ei jõudnudki Reacti renderdamiseni. Brauseri konsoolist selgus:

  Uncaught FirebaseError: Firebase: No Firebase App '[DEFAULT]' has been
  created - call firebase.App.initializeApp() (app-compat/no-app).

Põhjus: `app_tail.jsx` mooduli tasemel (mitte React komponendi sees) oli rida
`const authApi = HAS_AUTH ? window.firebase.auth() : null;`, mis jookseb
KOHE app.js laadimisel — aga `firebase.initializeApp()` kutsuti alles hiljem,
App komponendi enda `useEffect`'is (st alles pärast Reacti esimest renderdust).
Nii viskas `firebase.auth()` vea juba enne, kui React üldse jõudis midagi
kuvada, ja KOGU app.js jäi pooleli seisma — sellepärast nägi kasutaja
lõputult staatilist "Avan…" teksti.

Testides seda ei tabatud, sest `mock-firebase.js` lubas `auth()`/`firestore()`
kutseid ka enne `initializeApp()`-i (leebem kui päris SDK). Parandati KAKS asja:
1. `app_tail.jsx`: `firebase.initializeApp()` viidi mooduli algusesse (kohe
   `FIREBASE_CONFIG` järel, `try/catch`'iga `FIREBASE_INIT_ERROR` muutujasse),
   nii et see jõuab käivituda enne, kui mistahes hilisem kood (sh `authApi`)
   `firebase.auth()`'it kutsub. App komponendi oma useEffect kannab nüüd
   lihtsalt selle tulemuse React state'i üle, ei kutsu `initializeApp()`-i
   enam ise teist korda.
2. `mock-firebase.js`: `firestore()`/`auth()` viskavad nüüd sama vea, mis
   päris SDK, kui `initializeApp()` pole veel jooksnud — nii tabab
   Playwright-test edaspidi sama klassi vea ise ära, mitte alles kasutaja.

`sw.js` CACHE tõsteti `needmore-v6` -> `needmore-v7`. Kõik olemasolevad
Playwright testid (probe-accounts, probe-collision, probe-mealplan,
probe-fixes, probe-progressbar, probe-qty) jooksid pärast parandust uuesti
läbi, 0 konsooli viga.

Hiljem samal päeval: "Loo konto" andis üldise vea, sest Firebase konsoolis
polnud Email/Password sisselogimist lubatud (auth/operation-not-allowed).
Koodis lisati selle vea jaoks konkreetne selgitav teade ning tundmatute
vigade puhul kuvatakse nüüd veakood sulgudes (CACHE -> needmore-v8).

## 23.09.2026 lisandus: uuendatud Juhend + uus KKK

Juhend (GuideSheet) uuendati, et kajastada kõiki praeguseid funktsioone
(varem kirjutatud enne konto/Pro/Nädalaplaani lisamist): 1. Loo pere-kood,
2. Lisa ost, 3. Nimekiri täieneb iseenesest (selgitab ennustuse loogikat),
4. Paranda kui äpp eksib, 5. Retseptid ja Nädalaplaan (Pro), 6. Kulud,
7. Minu konto (teavitused + pakett).

Uus KKK (`FaqSheet`, app_head.jsx GuideSheet'i järel) avaneb Juhendi lõpust
nupuga "Korduma kippuvad küsimused (KKK)": 5 kategooriat (Nimekiri ja
ennustus / Tšekid / Retseptid, Nädalaplaan ja Pro / Minu konto ja
teavitused / Andmed ja turvalisus), iga küsimus avaneb klõpsuga.

Pere-koodi algekraanile (HouseholdGate, enne liitumist) lisati link
"Loe enne alustamist kasutusjuhendit →", mis avab sama Juhendi.

Testitud: probe-guide-faq.js — 0 konsooli viga. CACHE -> `needmore-v9`.

## Kuidas jätkata

Kaasas olevad failid (zip'is):
- `source/needmore-source.jsx` — kogu loetav lähtekood (app_full.jsx)
- `app/` — valmis deploy-kaust (see, mida Netlify'sse lohistatakse):
  index.html, app.js, sw.js, manifest.webmanifest, ikoonid,
  functions/ai.js, netlify.toml
- `README.txt` — kasutaja-suunatud seadistusjuhend (Firebase + AI võtme
  seadistus)

Kui teed muudatusi lähtekoodis, pea meeles järjekorda:
1. Muuda `source/needmore-source.jsx` (või vastavaid app_head.jsx/app_tail.jsx
   faile, kui neid eraldi hoiad)
2. Kompileeri esbuild'iga plain JS-iks: `esbuild app_full.jsx --bundle=false
   --format=iife --outfile=app.js`
3. Kopeeri uus app.js `app/` kausta
4. Kui muutsid app.js sisu, tõsta sw.js CACHE-nime versiooni (vahemälu
   probleemi vältimiseks)
5. Anna kasutajale uus `app` kaust, mille ta lohistab Netlify Deploys
   vahekaardile (üle olemasoleva saidi)

Kasutaja pole IT-taustaga, eelistab valmis lahendusi ja täpseid
samm-sammult juhiseid koos ekraanipiltidega (tema jagab ekraanipilte,
sina ütled täpselt kuhu vajutada).

## 23.09.2026 lisandus (Claude Code, GitHub repo)

Kood elab nüüd GitHubis: ingmar12345-jpg/oura-ai-coach, haru
`claude/relaxed-maxwell-72m8fv` (kaustad `app/` ja `source/`).
Sinna ühendati 23.09 Juhendi/KKK uuendus koos järgmiste muudatustega:

- `useAccount.signUp`: pärast konto loomist kutsutakse
  `cred.user.sendEmailVerification()` — Firebase saadab kinnituskirja.
- "Minu konto" paneel näitab teadet "Saatsime sulle kinnituskirja…",
  kuni `authUser.emailVerified` on false.
- `friendlyAuthError`: tundmatu vea korral kuvatakse sulgudes `e.code`
  või `e.message`; signIn/signUp vead logitakse `console.error`-iga.
- CACHE -> `needmore-v10`.

Firebase: Authentication -> Email/Password on nüüd lubatud.
Domeen: needmore.eu (Zone.ee, DNS: A 75.2.60.5, CNAME www ->
needmore-pere.netlify.app), lisatud Netlify saidile needmore-pere.

## 23.09.2026: Poekott

Poe kaasavõtukotid (kilekott, paberkott, ostukott, kandekott, riidest kott,
"kott" jne) ei jää enam tšekilt välja, vaid salvestatakse alati ühe tootena
"Poekott" (kategooria Muu). Toidu-, prügi-, külmutus- jm kotid jäävad
tavalisteks toodeteks (`NOT_BAG_WORDS`).

- `readReceipt`: AI juhend palub kotid nimetada "Poekott"; `asBag()` teeb
  sama kaitseks koodis ja liidab kõik poekotid üheks ülevaatusreaks.
- AddView `commit`: `asBag()` ka käsitsi sisestatud ridadele.
- `buildProducts`: poekotil `bag: true`, `progress: 0` → ei tule nimekirja,
  teavitustesse ega retseptide "kodus olemas" loetellu; `units` = kotte kokku.
- Tooted/ProductSheet näitavad poekotil "N kotti · M poeskäigul" ja kulusid.

Ehitus: `app/app.js` = `esbuild source/needmore-source.jsx --format=iife`
(esbuild 0.23). CACHE -> `needmore-v11`.

## 23.09.2026: "Veel kodus"

Nimekirja all olev "Jälgin veel" (tooted progressiga 0.35–0.7) nimetati
ümber "Veel kodus". Pealkirja all on selgitav rida, iga toote juures
"jätkub veel ~N päeva" ja õhuke progressiriba põhinimekirja värvidega.
KKK "Nimekiri ja ennustus" alla lisati küsimus selle kohta.
CACHE -> `needmore-v12`.

## 23.09.2026: nimekirja järjestus

"Järjesta nimekiri riiulite järgi" poenupud (Selver, Rimi, Coop, Lidl,
Maxima) asendati kahe valikuga: "Kiireloomulisuse järgi" ja "Kategooriate
järgi". STORE_ORDER/STORES eemaldati, alles on üks CATEGORY_ORDER (poes
kõndimise suund). Seade on endiselt `settings.store`: "" = kiireloomulisus,
iga muu väärtus (ka vanad poenimed) = kategooriad. Tundmatu kategooriaga
toode läheb rühma "Muu". CACHE -> `needmore-v13`.

## 23.09.2026: Seaded

Seadetest eemaldati "Tavalised tooted" paneel: see avas sama
QuickStartSheet'i, mis on alati nimekirja all ("Vali tavalised tooted" tühja
nimekirja puhul, muidu "Lisa veel tavalisi tooteid"). CACHE -> `needmore-v14`.

## 23.09.2026: kalendripäeva tšekid

Kulude kuukalendris (MonthCalendar) on kuluga päevad klikitavad. Vajutus avab
DayReceiptsSheet'i: selle päeva tšekid (pood, summa) ja iga rea kogus, ühikuhind
ja summa. Hinnangulised ostukäigud (`estimated`) on märgitud. Aken on ainult
vaatamiseks; parandamine käib endiselt Tšekk → Salvestatud tšekid. Juhendi
Kulud-lõiku lisati lause. CACHE -> `needmore-v15`.

## 23.09.2026: Minu retseptid (tasuta)

Retseptid vaates on uus alamvaade "Minu retseptid", mis on kõigile tasuta
(AI "Retseptisoovitused" ja "Nädalaplaan" jäävad Pro paketti; vabal paketil
näidatakse nende all Pro lukku).

- Andmed: `data.myRecipes = [{id, name, serves, items:[{name, qty, unit}], steps, createdAt}]`
  (meta/state dokumendis). Ühikud: g, kg, ml, l, tk, pakk, spl, tl; qty 0 = "maitse järgi".
- MyRecipeEditor: nimi, mitmele inimesele (QtyStepper), koostisosad (nime
  soovitused varem ostetud toodetest datalist'iga), sammud (üks rida = üks samm).
- MyRecipeSheet: "Teen N inimesele" skaleerib kogused (`scaleAmount`,
  `roundQty`: tk/pakk üles täisarvuni, g/ml 5/10 kaupa, spl/tl 0,5 kaupa).
  Koostisosad on linnukestega; vaikimisi valitud need, mis on "vaja osta"
  (sama `classify` nagu AI retseptidel). "Lisa N toodet nimekirja".
- Ostunimekirja `extras` said väljad `amounts: [{qty, unit}]` (baasühikutes
  g/ml) ja `from: [retsepti nimi]`; sama toode liidab kogused (`mergeAmounts`).
  Nimekirjas kuvatakse nt "250 g · Hakklihakaste".
- Oma retsepte saab valida ka Nädalaplaani (Pro).
- Juhendi ja KKK retseptide tekstid uuendatud. CACHE -> `needmore-v16`.

## 23.09.2026: kogused ostunimekirjas

Iga nimekirja rea all on kogus (+/-), mitte ainult korvis olles.
- `buildProducts`: ostudel on nüüd `unit`; tootel `usual` = viimase kuni 5 ostu
  koguse mediaan: `{count, unit}` tükikaubal (tk/pakk), `{amount}` kaalukaubal
  (kaalukaubal näidatakse "tavaliselt ~1,2 kg" ilma +/- nuputa).
- `data.want = {tootevõti: n}` on pere ühine soovitud kogus (meta/state, nähtav
  kõigil). Vaikimisi `usual.count`. Korvi pannes `cart[k] = want`. Tühjendatakse
  ostureisi lõpetamisel, tšeki salvestamisel ja "On veel" vajutusel.
- "Lisa" kast loeb koguse (`parseListInput`): "Kodujuust 3", "3x kodujuust",
  "Hakkliha 500 g". Kui toode on juba nimekirjas (ülal või käsitsi lisatud),
  uuendatakse ainult kogust.
- Käsitsi lisatud read on kahel real (nimi + × ülal, kogus + Korvi all).
- KKK: "Kust poodi mineja teab, kui palju osta?". CACHE -> `needmore-v17`.
