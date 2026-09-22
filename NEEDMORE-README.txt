NeedMore — beeta äpp
=====================

Selles kaustas:
- app/            — kogu äpp, mida tuleb üles laadida Netlify'sse (see kaust,
                    mitte zip-fail ise, lohistatakse Netlify Deploys vahekaardile)
- source/          — loetav lähtekood (JSX), kui soovid kunagi mujal edasi arendada

Firebase (jagatud nimekiri) on juba seadistatud (projekt needmore-8ada2).


UUS: tšeki AI-lugemine ja AI-retseptid
--------------------------------------
Nüüd on äpis olemas päris tšeki fotolt lugemine (Pildista tšekk) ja
AI-retseptisoovitused. Need vajavad Anthropic'u (Claude) API võtit, mis
hoitakse turvaliselt Netlify serveris — mitte kunagi telefoni äpi sees.

Seadistamine (üks kord):

1. Mine aadressile console.anthropic.com ja loo tasuta konto (või logi sisse).
2. Vali vasakult "API Keys" ja vajuta "Create Key". Kopeeri saadud võti
   (algab tavaliselt "sk-ant-..."). See on nähtav ainult üks kord, seega
   kopeeri kohe.
3. Lisa "Billing" alt natuke krediiti (nt 5-10 dollarit) — iga tšeki
   lugemine või retseptisoovitus maksab mõne sendi murdosa, seega see
   krediit kestab kaua.
4. Mine oma Netlify saidi juurde (app.netlify.com -> sinu sait "needmore-pere").
5. Vali "Site configuration" -> "Environment variables" -> "Add a variable".
6. Key:   ANTHROPIC_API_KEY
   Value: <kleebi oma API võti>
   Vajuta "Create variable".
7. Mine "Deploys" vahekaardile ja lohista SEE "app" kaust uuesti sinna
   (üle olemasoleva saidi) — see on vajalik, et uus funktsioon ja
   keskkonnamuutuja jõustuksid.
8. Ava äpp uuesti, mine "Tšekk" vaatesse ja proovi "Pildista" — kui kõik
   on korras, loeb äpp tšeki pealt tooted ja hinnad automaatselt.

Kui midagi ei tööta, kontrolli:
- Kas ANTHROPIC_API_KEY on Netlify's täpselt õigesti kirjutatud (suured/väiksed
  tähed loevad)
- Kas kontol on piisavalt krediiti (Billing -> Usage)
- Kas tegid uue "Deploy" pärast muutuja lisamist (vana deploy ei tea
  uuest muutujast midagi)


UUS: Minu konto (teavitused + Pro pakett) — vajab 2 sammu Firebase's
---------------------------------------------------------------------
Lisandus "Minu konto" (inimese-kujuline nupp ülal päises). Seal saab igaüks
eraldi luua endale konto (e-post + parool), et:
- seadistada teavitusi (millal ja millistest kategooriatest märku anda,
  kui miski läheb "otsas" olekusse)
- näha oma paketti (Tasuta / Pro) — Pro sisaldab praegu AI-retsepte,
  tulevikus ka söögikorra planeerimist

See on ISIKLIK, mitte pere-kood — kumbki pereliige saab endale eraldi konto
teha. Ostunimekirja kasutamiseks pole kontot vaja, see on lisavõimalus.

Selleks et "Minu konto" reaalselt töötaks (mitte ei näita "vajab
veebi-seadistust"), tuleb Firebase konsoolis teha KAKS asja, mis pole veel
tehtud:

1. LUBA E-POSTIGA SISSELOGIMINE
   Mine Firebase konsooli (console.firebase.google.com) -> projekt
   needmore-8ada2 -> vasakult "Authentication" (Build alt) -> "Get started"
   (kui esimest korda) -> vahekaart "Sign-in method" -> vali "Email/Password"
   -> lülita "Enable" sisse -> "Save".

2. UUENDA FIRESTORE REEGLEID
   Mine "Firestore Database" -> "Rules" ja asenda praegune tekst sellega
   (see lisab eelmisele reeglile juurde konto-andmete kaitse — igaüks näeb
   ainult ENDA kontot, mitte kellegi teise oma):

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /households/{code}/{document=**} {
         allow read, write: if true;
       }
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }

   Vajuta "Publish".

Kui neid kahte sammu ei tee, näitab "Minu konto" lihtsalt teadet, et konto
vajab veebi-seadistust — ülejäänud äpp (nimekiri, tšekid, retseptid vanas
mõttes) töötab täiesti tavapäraselt ka ilma selleta.

Teavituste kohta on oluline teada: need on "kohalikud" brauseri-teavitused,
mis töötavad kõige paremini siis, kui äpp on hiljuti avatud olnud. See EI
OLE päris "push" teavitus, mis jõuaks kohale ka siis, kui äpp on kaua aega
täiesti suletud olnud — selle jaoks oleks vaja täiendavat seadistust
(Firebase Cloud Messaging), mida saab hiljem lisada, kui see osutub vajalikuks.

Pro pakett on praegu "testrežiimis" — nupp "Proovi Pro tasuta (testrežiim)"
lülitab paketi kohe sisse, ilma päris maksmiseta. Päris maksete
(nt Stripe) sisseehitamine on järgmine samm, kui otsustate, mis hinnaga ja
mis tingimustel Pro paketti müüa.


UUS: Nädalaplaan (söögikorra planeerimine) — Pro pakett
---------------------------------------------------------------------
Retseptid-vaates on nüüd kaks sakki üleval: "Retseptisoovitused" (endine
vaade) ja "Nädalaplaan". Nädalaplaanis saab iga nädalapäeva jaoks valida
kas mõne juba genereeritud AI-retsepti või kirjutada ise vabalt mõne muu
söögi nime. Nooltega saab liikuda eelmisesse/järgmisesse nädalasse, tänane
päev on esile tõstetud kuldse joonega. Kui päevale on valitud AI-retsept,
avab sellel klõpsamine sama retsepti-vaate, mis Retseptisoovitused sakis
(juhend, koostisosad jne). "×" nupp kustutab sellelt päevalt valiku ära.
Nädalaplaan on samuti Pro pakett — sama piirang, mis retseptidel.
