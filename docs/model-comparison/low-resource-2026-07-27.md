# Model comparison: m2m100 vs llama-3.1-8b vs llama-4-scout

Fixture: `comparison.properties` · Endpoint: `https://translatemessages-staging.justblackmagic.workers.dev/`

## Summary

Lower is better for every column except "translated".

| Language | Model | Translated | Unchanged | Placeholders lost | Reported failures | Missing keys | Latency |
|---|---|---|---|---|---|---|---|
| ff | m2m100 | 9/25 | 16 | 0 | 13 | 0 | 2728ms |
| ff | llama-3.1-8b | 20/25 | 5 | 0 | 1 | 0 | 2173ms |
| ff | llama-4-scout | 25/25 | 0 | 0 | 0 | 0 | 1913ms |
| ilo | m2m100 | 19/25 | 6 | 0 | 6 | 0 | 23287ms |
| ilo | llama-3.1-8b | 25/25 | 0 | 0 | 0 | 0 | 47893ms |
| ilo | llama-4-scout | 25/25 | 0 | 0 | 0 | 0 | 1208ms |
| ns | m2m100 | 14/25 | 11 | 0 | 8 | 0 | 4192ms |
| ns | llama-3.1-8b | 17/25 | 8 | 0 | 2 | 0 | 2332ms |
| ns | llama-4-scout | 20/25 | 5 | 0 | 0 | 0 | 705ms |
| wo | m2m100 | 14/25 | 11 | 0 | 8 | 0 | 7073ms |
| wo | llama-3.1-8b | 22/25 | 3 | 0 | 3 | 0 | 3177ms |
| wo | llama-4-scout | 24/25 | 1 | 0 | 1 | 0 | 1507ms |
| ast | m2m100 | 24/25 | 1 | 0 | 1 | 0 | 10612ms |
| ast | llama-3.1-8b | 24/25 | 1 | 0 | 1 | 0 | 2325ms |
| ast | llama-4-scout | 25/25 | 0 | 0 | 0 | 0 | 1168ms |
| am | m2m100 | 21/25 | 4 | 0 | 3 | 0 | 3307ms |
| am | llama-3.1-8b | 22/25 | 3 | 0 | 3 | 0 | 6579ms |
| am | llama-4-scout | 25/25 | 0 | 0 | 0 | 0 | 1452ms |

## Side by side

Read this part. The table above cannot tell you whether a translation is good,
only whether it is structurally intact.

### ff

**`app.name`**

```
en             Task Manager
m2m100         Teema
llama-3.1-8b   Task Manager   <-- UNCHANGED
llama-4-scout  Gestionnaire de t\u00e2ches
```

**`app.welcome`**

```
en             Welcome to your dashboard
m2m100         Mo Di Mi Do Fr Sa So
llama-3.1-8b   Bunnaa ka dashboard
llama-4-scout  Welcoming ngal laawol \u0257uniyaarum {0}
```

**`app.description`**

```
en             Manage your projects and collaborate with your team in one place
m2m100         Mo Di Mi Do Fr Sa So
llama-3.1-8b   Gastreer yor projectiin hawtu kalaajo yuun, teamiin kalaajo yuun.
llama-4-scout  Dii\u0263e nokku \u0253aleeji mum \u0253e ngam wata \u0253e e team ma \u0253e e gihndeeji e wonee
```

**`button.ok`**

```
en             OK
m2m100         Kombi
llama-3.1-8b   OK   <-- UNCHANGED
llama-4-scout  Dikko
```

**`button.save`**

```
en             Save
m2m100         Tigi
llama-3.1-8b   Saar
llama-4-scout  \u018aa\u0253\u0253a
```

**`label.hi`**

```
en             Hi {0}
m2m100         Hi {0}   <-- UNCHANGED
llama-3.1-8b   Xai {0}
llama-4-scout  Bonjour {0}
```

**`label.bye`**

```
en             Bye {0}
m2m100         Bye {0}   <-- UNCHANGED
llama-3.1-8b   Tubabili {0}
llama-4-scout  Baay {0}
```

**`message.greeting`**

```
en             Hello {0}
m2m100         Hello {0}   <-- UNCHANGED
llama-3.1-8b   Salaam {0}
llama-4-scout  Bonjour {0}
```

**`message.count`**

```
en             You have {0} of {1} messages
m2m100         You have {0} of {1} messages   <-- UNCHANGED
llama-3.1-8b   Afrikii {0} j\u00ebfandikoo {1} bokk.
llama-4-scout  Naa {0} des {1} mesaa\u01b3i
```

**`message.repeat`**

```
en             Hello {0}, we said hello {0} already
m2m100         Hello {0}, we said hello {0} already   <-- UNCHANGED
llama-3.1-8b   Salaam {0}, amal a ka faa {0}
llama-4-scout  Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}
```

**`message.order`**

```
en             {0} items shipped to {1} on {2}
m2m100         {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-3.1-8b   {0} itemsu xukkooni {1} le {2}
llama-4-scout  {0} articles exp\u00e9di\u00e9s \u00e0 {1} le {2}
```

**`user.welcome`**

```
en             Welcome back, ${name}
m2m100         Welcome back, ${name}   <-- UNCHANGED
llama-3.1-8b   Buumi bukka, ${name}
llama-4-scout  Welkam de, ${name}
```

**`user.profile`**

```
en             Profile for ${user.name} in ${user.role}
m2m100         Profile for ${user.name} in ${user.role}   <-- UNCHANGED
llama-3.1-8b   Fariin ${user.name} ayaan ${user.role}
llama-4-scout  Profilu p\u00ebr ${user.name} n\u00eb ${user.role}
```

**`stats.total`**

```
en             Total: %s items
m2m100         Total: %s items   <-- UNCHANGED
llama-3.1-8b   Total\: %s items
llama-4-scout  Totali\: %s tekkol
```

**`stats.indexed`**

```
en             %1$s scored %2$d points
m2m100         %1$s scored %2$d points   <-- UNCHANGED
llama-3.1-8b   %1$s aadaa %2$d bari
llama-4-scout  %1$s njii %2$d punti
```

**`alert.warning`**

```
en             Warning, {0}!
m2m100         Warning, {0}!   <-- UNCHANGED
llama-3.1-8b   Warning, {0}!   <-- UNCHANGED
llama-4-scout  Avertissement, {0} \!
```

**`alert.question`**

```
en             Are you sure you want to delete {0}?
m2m100         Are you sure you want to delete {0}?   <-- UNCHANGED
llama-3.1-8b   Sigi a mar a xaritaa {0}?
llama-4-scout  Nee\u0257aama, \u00f1in gi naanaka delete {0}?
```

**`alert.parens`**

```
en             Order ({0}) has shipped
m2m100         Order ({0}) has shipped   <-- UNCHANGED
llama-3.1-8b   Order ({0}) aadaa yi aadaa
llama-4-scout  Kiraa ({0}) de\u01b4ii\u0257e
```

**`help.multiline`**

```
en             First line\nSecond line
m2m100         First line\nSecond line   <-- UNCHANGED
llama-3.1-8b   First line\nSecond line   <-- UNCHANGED
llama-4-scout  Premi\u00e8re ligne\nDeuxi\u00e8me ligne
```

**`help.tabbed`**

```
en             Column one\tColumn two
m2m100         Column one\tColumn two   <-- UNCHANGED
llama-3.1-8b   Column one\tColumn two   <-- UNCHANGED
llama-4-scout  Sarakayel\tSarakayel mi\u0257ii
```

**`help.unicode`**

```
en             Café près de l’hôtel
m2m100         Caf\u00e9 pr\u00e8s de l'h\u00f4tel
llama-3.1-8b   Caf\u00e9 lagoni de hoteli
llama-4-scout  Caf\u00e9 njool hotel
```

**`terms.long`**

```
en             By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100         By continuing you agree to the terms {0} and the privacy policy {1} effective today   <-- UNCHANGED
llama-3.1-8b   By continuing you agree to the terms {0} na politika ya kujitolea kwa uhuru {1} inayofaa leo
llama-4-scout  En continuant, vous acceptez les conditions {0} et la politique de confidentialit\u00e9 {1} effective aujourd'hui
```

**`footer.copyright`**

```
en             All rights reserved  # do not translate the year
m2m100         Mo, Di, Mi, Do  # do not translate the year
llama-3.1-8b   Todii xukkoon  # do not translate the year
llama-4-scout  \u0181i\u0257e \u0257in hamma \n\n(Or, more formally, in a more suitable tone for "All rights reserved")\: \n\n\u0181i\u0257e \u0257in hamma ne \n\nHowever, considering standard translation practices for such phrases and ensuring it sounds natural in the target language\:\n\nHakkuuji \u0253uri \n\nis a more suitable and formal way to express "All rights reserved" in the language with ISO code "ff".  # do not translate the year
```

**`error.permission`**

```
en             You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100         Mo Di Mi Do Fr Sa So
llama-3.1-8b   Aa ka j\u00e0ngaaru waa xukkalee. Ka xukkalee waa xukkalee.
llama-4-scout  Ndii\u0257e ngam yewtere \u0257in, hana yii\u0253e. \u0181awoore e maako diga administrator maa, tawde \u0257um ko \u0253alee.
```

**`onboarding.step`**

```
en             Choose a workspace name. You can change it later in settings.
m2m100         Mo Di Mi Do Fr Sa So
llama-3.1-8b   Nj\u00eb punonje e gjeode
llama-4-scout  S\u00e9lectionnez un nom d'espace de travail. Vous pouvez le modifier ult\u00e9rieurement dans les param\u00e8tres.
```

### ilo

**`app.name`**

```
en             Task Manager
m2m100         Impanna iti Task Manager
llama-3.1-8b   Mangaralas
llama-4-scout  Tag-urong ti Trabaho
```

**`app.welcome`**

```
en             Welcome to your dashboard
m2m100         Imtuodenyo iti dashboard.
llama-3.1-8b   Salamat sa inyong dashboard
llama-4-scout  Iturong iti dashboard mo
```

**`app.description`**

```
en             Manage your projects and collaborate with your team in one place
m2m100         Manipud iti projekto ken collaborate iti team iti maysa a lugar.
llama-3.1-8b   Nagmamanangayon ti nagpapalabas ken nagkaykaykayam ti proyekto kadagiti tattao.
llama-4-scout  Agannad ken iramanyo dagiti proyekto mo ken kolaborar kadagiti ka-team mo iti maysa a lugar
```

**`button.ok`**

```
en             OK
m2m100         OK iti
llama-3.1-8b   Oo sariaye.
llama-4-scout  Dios ti agngina
```

**`button.save`**

```
en             Save
m2m100         Kayatna ti
llama-3.1-8b   Sakop
llama-4-scout  Ireserva
```

**`label.hi`**

```
en             Hi {0}
m2m100         Hi {0}   <-- UNCHANGED
llama-3.1-8b   Salaam {0}
llama-4-scout  Nabati {0}
```

**`label.bye`**

```
en             Bye {0}
m2m100         Goodbye iti {0}
llama-3.1-8b   Bayi {0}
llama-4-scout  Agan {0}
```

**`message.greeting`**

```
en             Hello {0}
m2m100         Hello iti {0}
llama-3.1-8b   Salamu {0}
llama-4-scout  Nabati {0}
```

**`message.count`**

```
en             You have {0} of {1} messages
m2m100         You have {0} of {1} messages   <-- UNCHANGED
llama-3.1-8b   Ka {0} na {1} mensahe
llama-4-scout  Adda {0} iti {1} a mensahe
```

**`message.repeat`**

```
en             Hello {0}, we said hello {0} already
m2m100         Hello {0}, kitaem ti hello {0} laeng.
llama-3.1-8b   Naimbag a pag-abot {0}, naimbag a pag-abot {0} metta
llama-4-scout  Nabati {0}, nagbalin nga nabati {0} kami met
```

**`message.order`**

```
en             {0} items shipped to {1} on {2}
m2m100         {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-3.1-8b   {0} items na ituyawadawad ni {1} idi {2}
llama-4-scout  {0} nga baranga nga naipatakda ken {1} idi {2}
```

**`user.welcome`**

```
en             Welcome back, ${name}
m2m100         Welcome back iti ${name}
llama-3.1-8b   Salamat sa pagbalik, ${name}
llama-4-scout  Nangngeg ka manen, ${name}
```

**`user.profile`**

```
en             Profile for ${user.name} in ${user.role}
m2m100         Profile para iti ${user.name} iti ${user.role}
llama-3.1-8b   Profile para kina ${user.name} sa ${user.role}
llama-4-scout  Proyil para ${user.name} iti ${user.role}
```

**`stats.total`**

```
en             Total: %s items
m2m100         Agtawenak idi iti %s item.
llama-3.1-8b   Total\: %s items
llama-4-scout  Kumplet\: %s nga ayatay
```

**`stats.indexed`**

```
en             %1$s scored %2$d points
m2m100         %1$s scored %2$d points   <-- UNCHANGED
llama-3.1-8b   Naiyaway %1$s %2$d puntos.
llama-4-scout  %1$s nagskor ti %2$d puntos
```

**`alert.warning`**

```
en             Warning, {0}!
m2m100         Ad-adu payen iti {0}\!
llama-3.1-8b   Nagtaudan, {0}\!
llama-4-scout  Babala, {0}\!
```

**`alert.question`**

```
en             Are you sure you want to delete {0}?
m2m100         Kasano a ti inaramid ti {0}?
llama-3.1-8b   Nagustuan ka sa pagtawag sa {0}?
llama-4-scout  Sigurado ka nga kayat mo nga i-delete {0}?
```

**`alert.parens`**

```
en             Order ({0}) has shipped
m2m100         Ti Order ({0}) ket nailawlawag.
llama-3.1-8b   Naiyari ({0})
llama-4-scout  Nayawanan ti order ({0})
```

**`help.multiline`**

```
en             First line\nSecond line
m2m100         First line\nSecond line   <-- UNCHANGED
llama-3.1-8b   Unang linya\nIkalawa linya
llama-4-scout  Inakdan nga linia\nMaikadua a linia
```

**`help.tabbed`**

```
en             Column one\tColumn two
m2m100         Column one\tColumn two   <-- UNCHANGED
llama-3.1-8b   Pundong one\tPundong two
llama-4-scout  Kulom uno\tKulom dua
```

**`help.unicode`**

```
en             Café près de l’hôtel
m2m100         Kafe iti hotel.
llama-3.1-8b   Kafe ti mabalin iti hotel
llama-4-scout  Kafe iti asideg ti otel
```

**`terms.long`**

```
en             By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100         Iti panagturay, dakayo ti dakayo kadagiti terma ti {0} ken ti privacy policy ti {1} a maipaay iti daytoy nga aldaw.
llama-3.1-8b   Nagpapatalon ka pay ket ti terms {0} ken ti privacy policy {1} amin a nagtutuloy a nagbalin epektibo amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nagbalin amin a nagtutuloy a nag
llama-4-scout  Diosag iti pagtuluy, sang-ayunan mo ti termino {0} ken ti patakaran ti pribasiya {1} nga ag-ikkat itan nga aldaw
```

**`footer.copyright`**

```
en             All rights reserved  # do not translate the year
m2m100         Dinan kayat a kitaen dagiti dadduma.  # do not translate the year
llama-3.1-8b   Sakop na lahi.  # do not translate the year
llama-4-scout  Nakareserba amin nga karbengan  # do not translate the year
```

**`error.permission`**

```
en             You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100         Ti maysa ket addaan iti maysa kadagiti dua a tao.Kontakto ti administrator iti maysa a tao.
llama-3.1-8b   Wakarayon ninyo amin a pamiyebalewto. Kansan ninyo amin amin administrator ninyo.
llama-4-scout  Nadayup nga awan ka permit ti agaramana iti ganagna. Palaglagan ti administrador mo no mamati ka nga isu daytoy ti maysa a sala.
```

**`onboarding.step`**

```
en             Choose a workspace name. You can change it later in settings.
m2m100         Ngem saan a naaddaan ti nagan ti lugar a trabaho, saan a naaddaan iti Settings.
llama-3.1-8b   Igbanewa nke gburugburu.
llama-4-scout  Pilian ti nagan ti workspace. Sabali ken change dagiti setting.
```

### ns

**`app.name`**

```
en             Task Manager
m2m100         Moka Moka
llama-3.1-8b   Gestor de Tareas
llama-4-scout  Gestionnaire de t\u00e2ches
```

**`app.welcome`**

```
en             Welcome to your dashboard
m2m100         Moka Moka Moka
llama-3.1-8b   Selamat datang di dashboard Anda
llama-4-scout  Velkommen til dit kontrolpanel
```

**`app.description`**

```
en             Manage your projects and collaborate with your team in one place
m2m100         Le boima le boima le boima le boima le boima.
llama-3.1-8b   G\u00e9rer vos projets et collaborer avec votre \u00e9quipe dans un seul endroit
llama-4-scout  Verwaltung von Projekten und Zusammenarbeit mit Ihrem Team an einem Ort
```

**`button.ok`**

```
en             OK
m2m100         Moka
llama-3.1-8b   OK   <-- UNCHANGED
llama-4-scout  OK   <-- UNCHANGED
```

**`button.save`**

```
en             Save
m2m100         Moka
llama-3.1-8b   Saqla'
llama-4-scout  Guardar
```

**`label.hi`**

```
en             Hi {0}
m2m100         Hi {0}   <-- UNCHANGED
llama-3.1-8b   Hiya {0}
llama-4-scout  Hallo {0}
```

**`label.bye`**

```
en             Bye {0}
m2m100         Bye {0}   <-- UNCHANGED
llama-3.1-8b   Bye {0}   <-- UNCHANGED
llama-4-scout  Auf Wiedersehen {0}
```

**`message.greeting`**

```
en             Hello {0}
m2m100         Hello {0}   <-- UNCHANGED
llama-3.1-8b   Hello {0}   <-- UNCHANGED
llama-4-scout  Hallo {0}
```

**`message.count`**

```
en             You have {0} of {1} messages
m2m100         You have {0} of {1} messages   <-- UNCHANGED
llama-3.1-8b   You have {0} of {1} berita
llama-4-scout  You have {0} of {1} meldinger
```

**`message.repeat`**

```
en             Hello {0}, we said hello {0} already
m2m100         Hello {0}, we said hello {0} already   <-- UNCHANGED
llama-3.1-8b   Hello {0}, kami sudah mengucapkan selamat pagi {0}
llama-4-scout  Hallo {0}, wir haben bereits Hallo {0} gesagt
```

**`message.order`**

```
en             {0} items shipped to {1} on {2}
m2m100         {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-3.1-8b   {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-4-scout  {0} art\u00edculos enviados a {1} el {2}
```

**`user.welcome`**

```
en             Welcome back, ${name}
m2m100         Welcome back, ${name}   <-- UNCHANGED
llama-3.1-8b   Selamat datang kembali, ${name}
llama-4-scout  Willkommen zur\u00fcck, ${name}
```

**`user.profile`**

```
en             Profile for ${user.name} in ${user.role}
m2m100         Profile for ${user.name} in ${user.role}   <-- UNCHANGED
llama-3.1-8b   Profil untuk ${user.name} di ${user.role}
llama-4-scout  Profil f\u00fcr ${user.name} in ${user.role}
```

**`stats.total`**

```
en             Total: %s items
m2m100         Total: %s items   <-- UNCHANGED
llama-3.1-8b   Total\: %s items
llama-4-scout  Gesamt\: %s Artikel
```

**`stats.indexed`**

```
en             %1$s scored %2$d points
m2m100         %1$s Goba %2$d Points
llama-3.1-8b   %1$s a skorirao %2$d poena
llama-4-scout  %1$s erzielte %2$d Punkte
```

**`alert.warning`**

```
en             Warning, {0}!
m2m100         Wago, {0}\!
llama-3.1-8b   Peringatan, {0}\!
llama-4-scout  Achtung, {0}\!
```

**`alert.question`**

```
en             Are you sure you want to delete {0}?
m2m100         Wago o hwet\u0161wa {0}?
llama-3.1-8b   Are you sure you want to delete {0}?   <-- UNCHANGED
llama-4-scout  Are you sure you want to delete {0}? -> \nAre you sure you want to delete {0}
```

**`alert.parens`**

```
en             Order ({0}) has shipped
m2m100         Order ({0}) le bo\u0161weu
llama-3.1-8b   Order ({0}) telah dikirim
llama-4-scout  Bestilling ({0}) er sendt
```

**`help.multiline`**

```
en             First line\nSecond line
m2m100         First line\nSecond line   <-- UNCHANGED
llama-3.1-8b   First line\nSecond line   <-- UNCHANGED
llama-4-scout  First line\nSecond line   <-- UNCHANGED
```

**`help.tabbed`**

```
en             Column one\tColumn two
m2m100         kolona 1\tkolona 2
llama-3.1-8b   Column one\tColumn two   <-- UNCHANGED
llama-4-scout  Column one\tColumn two   <-- UNCHANGED
```

**`help.unicode`**

```
en             Café près de l’hôtel
m2m100         Moka Moka Moka Moka
llama-3.1-8b   Caf\u00e9 pr\u00e8s de l'h\u00f4tel
llama-4-scout  Caf\u00e9 near the hotel
```

**`terms.long`**

```
en             By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100         By continuing you agree to the terms {0} and the privacy policy {1} effective today   <-- UNCHANGED
llama-3.1-8b   By continuing you agree to the terms {0} and the privacy policy {1} effective today   <-- UNCHANGED
llama-4-scout  By continuing you agree to the terms {0} and the privacy policy {1} effective today   <-- UNCHANGED
```

**`footer.copyright`**

```
en             All rights reserved  # do not translate the year
m2m100         Moka Moka  # do not translate the year
llama-3.1-8b   Tous droits r\u00e9serv\u00e9s  # do not translate the year
llama-4-scout  Alle Rechte vorbehalten  # do not translate the year
```

**`error.permission`**

```
en             You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100         Maemo a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe ke a nkgethilwe.
llama-3.1-8b   You do not have permission to perform this action. Please contact your administrator if you believe this is an error.
llama-4-scout  You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.   <-- UNCHANGED
```

**`onboarding.step`**

```
en             Choose a workspace name. You can change it later in settings.
m2m100         Tshepidi\u0161o ya t\u0161hirelet\u0161o ya t\u0161hirelet\u0161o ya t\u0161hirelet\u0161o ya t\u0161hirelet\u0161o ya t\u0161hirelet\u0161o.
llama-3.1-8b   Wybierz nazw\u0119 przestrzeni roboczej. Mo\u017cesz zmieni\u0107 j\u0105 p\u00f3\u017aniej w ustawieniach.
llama-4-scout  W\u00e4hlen Sie einen Arbeitsbereichsnamen. Sie k\u00f6nnen ihn sp\u00e4ter in den Einstellungen \u00e4ndern.
```

### wo

**`app.name`**

```
en             Task Manager
m2m100         TOPP
llama-3.1-8b   G\u00e0ttinaayu w\u00e0llif
llama-4-scout  Gestionnaire de t\u00e2ches
```

**`app.welcome`**

```
en             Welcome to your dashboard
m2m100         Lees meer \u00bb
llama-3.1-8b   Benvueni ngi \u00e0q ndoxe yi.
llama-4-scout  Ndakaru ci dashboard yi
```

**`app.description`**

```
en             Manage your projects and collaborate with your team in one place
m2m100         Lees meer \u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb
llama-3.1-8b   Gawriw yu benn team yu ngir wiyaas ak gis team yu nj\u00ebkk.
llama-4-scout  Gerir d\u00ebkk bu ci projet yi ak kollaborer ak ekip bu ci nj\u00ebkk
```

**`button.ok`**

```
en             OK
m2m100         Beeg
llama-3.1-8b   Akk\n\nWaxtu.
llama-4-scout  Dakaru
```

**`button.save`**

```
en             Save
m2m100         digg
llama-3.1-8b   Saw\n\n(No change, as "Save" is a single word)
llama-4-scout  Sauvegarder
```

**`label.hi`**

```
en             Hi {0}
m2m100         Hi {0}   <-- UNCHANGED
llama-3.1-8b   Jamono {0}
llama-4-scout  Salaam {0}
```

**`label.bye`**

```
en             Bye {0}
m2m100         Bye {0}   <-- UNCHANGED
llama-3.1-8b   Bisumal {0}
llama-4-scout  Ndak {0}
```

**`message.greeting`**

```
en             Hello {0}
m2m100         Hello {0}   <-- UNCHANGED
llama-3.1-8b   Hello {0}   <-- UNCHANGED
llama-4-scout  J\u00ebndel {0}
```

**`message.count`**

```
en             You have {0} of {1} messages
m2m100         {0} of {1} amul
llama-3.1-8b   Ndoofu {0} of {1} bokk\n\nor\n\nNdoofu {0} of {1} bokkale
llama-4-scout  Nguy {0} ci {1} mbay
```

**`message.repeat`**

```
en             Hello {0}, we said hello {0} already
m2m100         Hello {0}, we said hello {0} ya
llama-3.1-8b   Jamono {0}, am naa jamono {0} ame
llama-4-scout  J\u00ebnd {0}, jenu j\u00ebnd {0} d\u00e9jj\u00e9
```

**`message.order`**

```
en             {0} items shipped to {1} on {2}
m2m100         {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-3.1-8b   {0} jiitante yu {1} le {2}
llama-4-scout  {0} articles exp\u00e9di\u00e9s \u00e0 {1} le {2}
```

**`user.welcome`**

```
en             Welcome back, ${name}
m2m100         Welcome back, ${name}   <-- UNCHANGED
llama-3.1-8b   A bonday ci, ${name}
llama-4-scout  Ndakaru weer, ${name}
```

**`user.profile`**

```
en             Profile for ${user.name} in ${user.role}
m2m100         Profile for ${user.name} in ${user.role}   <-- UNCHANGED
llama-3.1-8b   Dakkuwaayu asukuru ${user.name} ak moom ajiit ${user.role}
llama-4-scout  Profile for ${user.name} in ${user.role}   <-- UNCHANGED
```

**`stats.total`**

```
en             Total: %s items
m2m100         Total\: %s items
llama-3.1-8b   Total: %s items   <-- UNCHANGED
llama-4-scout  Ndakaru\: %s yaw \n\n(Or, more naturally in Wolof\: J\u00ebm\: %s yi )
```

**`stats.indexed`**

```
en             %1$s scored %2$d points
m2m100         %1$s gni %2$d points
llama-3.1-8b   Jii ko xam-xam %1$s %2$d bataaxel.
llama-4-scout  %1$s m\u00ebn %2$d punti
```

**`alert.warning`**

```
en             Warning, {0}!
m2m100         Warning, {0}!   <-- UNCHANGED
llama-3.1-8b   Waa waa {0}\!
llama-4-scout  Yay, {0}\!
```

**`alert.question`**

```
en             Are you sure you want to delete {0}?
m2m100         Are you sure you want to delete {0}?   <-- UNCHANGED
llama-3.1-8b   Are you sure you want to delete {0}?   <-- UNCHANGED
llama-4-scout  Ndak rek \u00f1u d\u00eblee {0}?
```

**`alert.parens`**

```
en             Order ({0}) has shipped
m2m100         Beeg ({0})
llama-3.1-8b   Jumtugale ({0}) a w\u00e0ccoo.
llama-4-scout  Komanda ({0}) moo ngodem
```

**`help.multiline`**

```
en             First line\nSecond line
m2m100         First line\nSecond line   <-- UNCHANGED
llama-3.1-8b   Jattu\nLiggeey\n\nNote\: I assume "XQZ" is a placeholder and "0" is a number, so I left them as is.
llama-4-scout  Premi\u00e8re ligne\nDeuxi\u00e8me ligne
```

**`help.tabbed`**

```
en             Column one\tColumn two
m2m100         Column one\tColumn two   <-- UNCHANGED
llama-3.1-8b   Column waa\tColumn biir\n\nNote\: I assume "biir" is the correct translation for "two" in Wolof. If not, please let me know.
llama-4-scout  Kolon nj\u00eb\tKolon deux
```

**`help.unicode`**

```
en             Café près de l’hôtel
m2m100         Cafe pr\u00e8s de l'h\u00f4tel
llama-3.1-8b   Caf\u00e9 d\u00e9kat h\u00f4tel
llama-4-scout  Caf\u00e9 buur si l\u00ebkkalub\u00eb
```

**`terms.long`**

```
en             By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100         By continuing you agree to the terms {0} and the privacy policy {1} effective today   <-- UNCHANGED
llama-3.1-8b   Na defaral ngir aya, aya yor ngir tekk tekkal tekkal {0} ak tekk tekkal tekkal {1} ak yor ngir aya yor.
llama-4-scout  Mou contunu\u00e9 ndakko lekk {0} ak luwaay bu yaxu {1} \u00f1u wuutu ci wonee
```

**`footer.copyright`**

```
en             All rights reserved  # do not translate the year
m2m100         D E F  # do not translate the year
llama-3.1-8b   Yimun ciyaafe.  # do not translate the year
llama-4-scout  L\u00ebkk\u00ebr yi r\u00e9server  # do not translate the year
```

**`error.permission`**

```
en             You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100         T\u00e9l\u00e9fone / T\u00e9l\u00e9fone / T\u00e9l\u00e9fone / T\u00e9l\u00e9fone / T\u00e9l\u00e9fone / T\u00e9l\u00e9fone / T\u00e9l\u00e9fone / T\u00e9l\u00e9fone
llama-3.1-8b   Aar aadaam, aadaam a yor aadaam. Nguur a yor aadaam, aadaam a yor aadaam.
llama-4-scout  Ndakaru ci ndulenee woonu ci action bi. Luumu administrator bi laawol ci ndakaru yi ngir t\u00e0ng naawoonu.
```

**`onboarding.step`**

```
en             Choose a workspace name. You can change it later in settings.
m2m100         Lees meer \u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb\u00bb
llama-3.1-8b   Nj\u00ebb workspace nii.
llama-4-scout  S\u00e9lectionnez un nom d'espace de travail. Vous pouvez le modifier plus tard dans les param\u00e8tres.
```

### ast

**`app.name`**

```
en             Task Manager
m2m100         Xestor de Tareas
llama-3.1-8b   Xegresu de tareas
llama-4-scout  Xestor de Tarees
```

**`app.welcome`**

```
en             Welcome to your dashboard
m2m100         Bienven\u00edu al Dashboard
llama-3.1-8b   Bienven\u00edu al teu panel de control
llama-4-scout  Bienven\u00edu al to panel de control
```

**`app.description`**

```
en             Manage your projects and collaborate with your team in one place
m2m100         Xestionar los sos proyectos y collaborar col so equipu nun llugar
llama-3.1-8b   Xunir y xestionar los sos proyeutos y collaborar con el so equipu nun llugar
llama-4-scout  Alministra los tos proyeutos y collaborar col equipu nun solu sitiu
```

**`button.ok`**

```
en             OK
m2m100         De xac\u00edu
llama-3.1-8b   D'acord
llama-4-scout  Bien
```

**`button.save`**

```
en             Save
m2m100         S\u00e1bese
llama-3.1-8b   G\u00fcarden
llama-4-scout  Guardar
```

**`label.hi`**

```
en             Hi {0}
m2m100         Gracies {0}
llama-3.1-8b   Bai {0}
llama-4-scout  Hola {0}
```

**`label.bye`**

```
en             Bye {0}
m2m100         Bye {0}   <-- UNCHANGED
llama-3.1-8b   Adi\u00f3s {0}
llama-4-scout  Adi\u00f3s {0}
```

**`message.greeting`**

```
en             Hello {0}
m2m100         Gracies {0}
llama-3.1-8b   Buen d\u00eda {0}
llama-4-scout  Hola {0}
```

**`message.count`**

```
en             You have {0} of {1} messages
m2m100         Tienes {0} de {1} mensaxes
llama-3.1-8b   Tienes {0} de {1} mensaxes
llama-4-scout  Tienes {0} de {1} mensaxes
```

**`message.repeat`**

```
en             Hello {0}, we said hello {0} already
m2m100         Hello {0}, y\u00e1 dixemos hello {0}
llama-3.1-8b   Hola {0}, d\u00edmosos hola {0} ya
llama-4-scout  Hola {0}, diximos hola {0} y\u00e1
```

**`message.order`**

```
en             {0} items shipped to {1} on {2}
m2m100         {0} art\u00edculos embarcaos a {1} en {2}
llama-3.1-8b   Art\u00edculos {0} env\u00edaos a {1} el {2}
llama-4-scout  {0} unid\u00e1(es) unviada(s) a {1} el {2}
```

**`user.welcome`**

```
en             Welcome back, ${name}
m2m100         Bienven\u00edu al regresu ${name}
llama-3.1-8b   Bienven\u00edu de nuevu, ${name}
llama-4-scout  Bienven\u00edu de vuelta, ${name}
```

**`user.profile`**

```
en             Profile for ${user.name} in ${user.role}
m2m100         Profile pa ${user.name} en ${user.role}
llama-3.1-8b   Perfil pa ${user.name} en ${user.role}
llama-4-scout  Perfil de ${user.name} en ${user.role}
```

**`stats.total`**

```
en             Total: %s items
m2m100         Total\: %s elementos
llama-3.1-8b   Total\: %s elementos
llama-4-scout  Total\: %s elementos
```

**`stats.indexed`**

```
en             %1$s scored %2$d points
m2m100         %1$s anot\u00e1u %2$d puntos
llama-3.1-8b   Anque %1$s anot\u00f3 %2$d puntos
llama-4-scout  %1$s consigui\u00f3 %2$d puntos
```

**`alert.warning`**

```
en             Warning, {0}!
m2m100         \u00a1Alvertencia {0}\!
llama-3.1-8b   Atenci\u00f3n, {0}\!
llama-4-scout  Advertencia, {0}\!
```

**`alert.question`**

```
en             Are you sure you want to delete {0}?
m2m100         \u00bfTienes segurid\u00e1 de que quieres esaniciar {0}?
llama-3.1-8b   \u00bfTienes seguru de que quieras borrar {0}?
llama-4-scout  \u00bfEst\u00e1s seguro de que quies deshacer de {0}?
```

**`alert.parens`**

```
en             Order ({0}) has shipped
m2m100         La orde ({0}) foi unviada
llama-3.1-8b   Ordeya ({0}) tresport\u00f3se
llama-4-scout  El pid\u00edu ({0}) sali\u00f3 en cam\u00edn
```

**`help.multiline`**

```
en             First line\nSecond line
m2m100         Primera llinia\nSegunda llinia
llama-3.1-8b   Llinia primeru\nSegunda llinia
llama-4-scout  Primer ll\u00ednea\nSegunda llinia
```

**`help.tabbed`**

```
en             Column one\tColumn two
m2m100         Columna unu\tColumna dos
llama-3.1-8b   Column one\tColumn two   <-- UNCHANGED
llama-4-scout  Columnu unu\tColumnu dos
```

**`help.unicode`**

```
en             Café près de l’hôtel
m2m100         Caf\u00e9 cerca del hotel
llama-3.1-8b   Caf\u00e9 cerca de l'hoteles
llama-4-scout  Caf\u00e9 cerca del hotel
```

**`terms.long`**

```
en             By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100         Al siguir aceptando acepta los t\u00e9rminos {0} y la pol\u00edtica de privacid\u00e1 {1} efectiva g\u00fcei
llama-3.1-8b   Acordies con que sigas los t\u00e9rminos {0} y la pol\u00edtica de privacid\u00e1 {1} efeutiva dende g\u00fcei
llama-4-scout  De sigu\u00edo, aceptes los t\u00e9rminos {0} y la pol\u00edtica de privacida {1} efeutivos d' g\u00fcei
```

**`footer.copyright`**

```
en             All rights reserved  # do not translate the year
m2m100         Todos los derechos reservados  # do not translate the year
llama-3.1-8b   Tolos derechos reservaos  # do not translate the year
llama-4-scout  Toes los derechos reservaos  # do not translate the year
```

**`error.permission`**

```
en             You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100         Nun tien permisu pa realizar esta acci\u00f3n.Contacte col so administrador si cree que ye un erru.
llama-3.1-8b   Nun tien decesu permisu pa facer esti acci\u00f3n. Contauta col to administrator si crees que ye un error.
llama-4-scout  No tienes permisu pa realizar esta aici\u00f3n. Contauta col alministrador si crees que ye un error.
```

**`onboarding.step`**

```
en             Choose a workspace name. You can change it later in settings.
m2m100         Escoyer un nome d'espaciu de trabayu. Puede camudalo m\u00e1s tarde nes configuraciones.
llama-3.1-8b   Eliaxea un nome de trabayu. Puedes camudarlu m\u00e1s palantre nos rexistros de configuraci\u00f3n.
llama-4-scout  Escueye un nome pa workspace. Podes camudarlu m\u00e1s tarde en axustes.
```

### am

**`app.name`**

```
en             Task Manager
m2m100         \u12e8\u1274\u12ad\u1296\u120e\u1302 \u12a0\u1235\u1270\u12f3\u12f0\u122d
llama-3.1-8b   \u1263\u1208\u121b\u1295\u1308\u1275
llama-4-scout  \u12e8\u1270\u130d\u1263\u122d \u12a0\u1235\u1270\u12f3\u12f3\u122a
```

**`app.welcome`**

```
en             Welcome to your dashboard
m2m100         \u12e8\u12a5\u122d\u1235\u12ce Dashboard \u120b\u12ed \u12ed\u121d\u1228\u1321
llama-3.1-8b   \u12a0\u121b\u12ab\u1295\u1271 \u1208\u129b\u12ed\u1295\u1308\u122d
llama-4-scout  \u12f3\u123d\u1266\u122d\u12f1\u1295 \u1208\u1218\u1240\u120b\u1240\u120d \u12a5\u1295\u12b3\u1295 \u12f0\u1205\u1293 \u1218\u1321
```

**`app.description`**

```
en             Manage your projects and collaborate with your team in one place
m2m100         \u12e8\u12a5\u122d\u1235\u12ce\u1295 \u1355\u122e\u1300\u12ad\u1276\u127d \u12a0\u1235\u1270\u12f3\u12f0\u122d \u12a5\u1293 \u12a0\u1295\u12f5 \u1266\u1273 \u12cd\u1235\u1325 \u12e8\u12a5\u122d\u1235\u12ce \u1261\u12f5\u1295 \u130b\u122d \u12ed\u1230\u122b\u120d
llama-3.1-8b   \u12a0\u1235\u1270\u12f3\u121d\u1229 \u12a5\u1293 \u1263\u1208\u121b\u12ad\u1230\u120d \u12a5\u1293\u1275 \u12a0\u1295\u12f5 \u1266\u1273 \u120b\u12ed
llama-4-scout  \u12a0\u1295\u12f5 \u1266\u1273 \u120b\u12ed \u12e8\u12a5\u122d\u1235\u12ce\u1295 \u1355\u122e\u1300\u12ad\u1276\u127d \u12eb\u1235\u1270\u12f3\u12f5\u1229 \u12a5\u1293 \u12a8\u1261\u12f5\u1295\u12ce \u130b\u122d \u12ed\u1270\u1263\u1260\u1229
```

**`button.ok`**

```
en             OK
m2m100         \u12a0\u12ce
llama-3.1-8b   \u12a0\u1295\u12f5\u12a9
llama-4-scout  \u12a5\u123a
```

**`button.save`**

```
en             Save
m2m100         \u12eb\u130d\u1299\u1295
llama-3.1-8b   \u1270\u12a8\u1270\u1270
llama-4-scout  \u12a0\u1235\u1240\u121d\u1325
```

**`label.hi`**

```
en             Hi {0}
m2m100         \u12a5\u1263\u12ad\u12ce {0}
llama-3.1-8b   \u1230\u120b\u121d {0}
llama-4-scout  \u1230\u120b\u121d {0}
```

**`label.bye`**

```
en             Bye {0}
m2m100         \u12a0\u130d\u1299\u1295 {0}
llama-3.1-8b   \u12a0\u120d\u1245\u121d\u122b\u1208\u1201 {0}
llama-4-scout  \u1230\u120b\u121d {0}
```

**`message.greeting`**

```
en             Hello {0}
m2m100         \u12a5\u1263\u12ad\u12ce {0}
llama-3.1-8b   \u12a0\u1235\u121b\u121b\u1208\u1201 {0}
llama-4-scout  \u1230\u120b\u121d {0}
```

**`message.count`**

```
en             You have {0} of {1} messages
m2m100         \u12a5\u122d\u1235\u12ce {0} \u12e8 {1} \u12a0\u1235\u1270\u12eb\u12e8\u1276\u127d \u12a0\u120b\u1278\u12cd
llama-3.1-8b   \u12a0\u1295\u12f5 {0} \u12a0\u121b\u12ab\u12ac\u1295 {1}
llama-4-scout  \u12a5\u122d\u1235\u12ce {0} \u12e8{1} \u1218\u120d\u12d5\u12ad\u1276\u127d \u12a0\u1209\u12ce\u1275
```

**`message.repeat`**

```
en             Hello {0}, we said hello {0} already
m2m100         Hello {0}, we said hello {0} already   <-- UNCHANGED
llama-3.1-8b   \u12a0\u1235\u1240\u12cd\u1230\u1295 {0} \u12a5\u1295\u12f0\u121a\u1208\u12cd \u12a0\u1235\u1240\u12cd\u1230\u1295 {0} \u12a0\u1208
llama-4-scout  \u1230\u120b\u121d {0}, \ubc8c\uc368 {0} \u1230\u120b\u121d \u12a5\u1295\u12f5\u1295\u120b\u12ad \u1290\u1260\u122d
```

**`message.order`**

```
en             {0} items shipped to {1} on {2}
m2m100         \u1260 {2} \u120b\u12ed \u1260 {1} \u12c8\u12f0 {0} \u1241\u1233\u1241\u1236\u127d \u1270\u1295\u1240\u1233\u1243\u123d
llama-3.1-8b   \u12a0\u1308\u1295\u1263\u1275 {0} \u12a0\u1235\u1270\u12cb\u120d \u1260 {1} \u1260 {2}
llama-4-scout  {0} \u12d5\u1243\u12ce\u127d \u12c8\u12f0 {1} \u12e8\u1270\u120b\u12a9\u1260\u1275 \u1240\u1295 {2} \u1290\u12cd\u1362
```

**`user.welcome`**

```
en             Welcome back, ${name}
m2m100         \u1270\u1218\u120d\u12a8\u1275 ${name}
llama-3.1-8b   \u12a0\u121b\u12ab\u129d \u1270\u1218\u1208\u1208\u1208\u1208, ${name}
llama-4-scout  \u12a5\u1295\u12b3\u1295 \u12f0\u1205\u1293 \u1218\u1323\u1205\u1363 ${name}
```

**`user.profile`**

```
en             Profile for ${user.name} in ${user.role}
m2m100         \u1208 ${user.name} \u1260 ${user.role} profil
llama-3.1-8b   \u1245\u1325\u122d\u1293 \u1235\u121d\u1235\u122b\u1275 \u1208 ${user.name} \u1260 ${user.role}
llama-4-scout  \u1218\u1308\u1208\u132b \u1208 ${user.name} \u1260 ${user.role}
```

**`stats.total`**

```
en             Total: %s items
m2m100         \u12a0\u1320\u1243\u120b\u12ed\: %s \u1241\u1233\u1241\u1236\u127d
llama-3.1-8b   \u1245\u1325\u122d\: %s \u12a0\u1272\u1295\u1235
llama-4-scout  \u1320\u1245\u120b\u120b\u1361 %s \u1295\u1325\u120e\u127d
```

**`stats.indexed`**

```
en             %1$s scored %2$d points
m2m100         %1$s \u12e8 %2$d \u1290\u1325\u1266\u127d
llama-3.1-8b   \u1270\u12a8\u1270\u1270\u1295 %1$s  %2$d \u1265\u122d
llama-4-scout  %1$s \u12a0\u1235\u1246\u1320\u1228 %2$d \u1290\u1325\u1266\u127d
```

**`alert.warning`**

```
en             Warning, {0}!
m2m100         \u12a0\u130d\u1299\u1295 {0}\!
llama-3.1-8b   Warning, {0}!   <-- UNCHANGED
llama-4-scout  \u121b\u1235\u1320\u1295\u1240\u1242\u12eb\u1363 {0}\!
```

**`alert.question`**

```
en             Are you sure you want to delete {0}?
m2m100         \u12a5\u122d\u1235\u12ce {0} \u1218\u12cd\u1230\u12f5 \u12ed\u1348\u120d\u130b\u1209?
llama-3.1-8b   Are you sure you want to delete {0}?   <-- UNCHANGED
llama-4-scout  \u12a5\u122d\u130d\u1320\u129b \u1290\u12ce\u1275 {0} \u1295 \u1218\u1230\u1228\u12dd \u12ed\u1348\u120d\u130b\u1209?
```

**`alert.parens`**

```
en             Order ({0}) has shipped
m2m100         \u1275\u12d5\u12db\u12dd ({0}) \u1270\u1295\u1240\u1233\u1243\u123d \u1290\u12cd
llama-3.1-8b   Order ({0}) has shipped   <-- UNCHANGED
llama-4-scout  \u1275\u12d5\u12db\u12dd ({0}) \u1270\u120d\u12b3\u120d
```

**`help.multiline`**

```
en             First line\nSecond line
m2m100         First line\nSecond line   <-- UNCHANGED
llama-3.1-8b   \u12a0\u1295\u12f5 \u1230\u12d3\u1275\n\u12a0\u1295\u12f5 \u1230\u12d3\u1275
llama-4-scout  \u12e8\u1218\u1300\u1218\u122a\u12eb \u1218\u1235\u1218\u122d\n\u1201\u1208\u1270\u129b \u1218\u1235\u1218\u122d
```

**`help.tabbed`**

```
en             Column one\tColumn two
m2m100         Column one\tColumn two   <-- UNCHANGED
llama-3.1-8b   \u12ad\u120b\u1219\u1295 \u12a0\u1295\u12f5\t\u12ad\u120b\u1219\u1295 \u1201\u1208\u1275
llama-4-scout  \u12a0\u121d\u12f5 \u12a0\u1295\u12f5\t\u12a0\u121d\u12f5 \u1201\u1208\u1275
```

**`help.unicode`**

```
en             Café près de l’hôtel
m2m100         \u134e\u1276 \u1208 \u134e\u1276 \u1208 \u134e\u1276
llama-3.1-8b   \u12ae\u134d\u129b \u12c8\u1235\u120b\u1208\u127d \u12a0\u121b\u122d\u129b
llama-4-scout  \u12ab\u134c \u12a8\u1206\u1274\u1209 \u12a0\u1245\u122b\u1262\u12eb
```

**`terms.long`**

```
en             By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100         By continuing you agree to the terms {0} and the privacy policy {1} effective today   <-- UNCHANGED
llama-3.1-8b   \u1260\u1270\u12a8\u1270\u1208\u1260\u1275 \u12a5\u1293\u1275\u1295 \u12e8\u1205\u130d \u12a0\u1235\u1270\u12f3\u12f0\u122d {0} \u12a5\u1293 \u12e8\u1230\u12cd\u1290\u1275 \u1235\u122b\u1215 {1} \u12a5\u1295\u12f0\u121d\u1295\u1235 \u1270\u1308\u1295\u12d8\u1261
llama-4-scout  \u1260\u1218\u1240\u1320\u120d\u1205 {0} \u12cd\u120e\u1279\u1295 \u12a5\u1293 \u12e8\u130d\u120b\u12ca\u1290\u1275 \u1356\u120a\u1232 {1} \u12a8\u12db\u122c \u1300\u121d\u122e \u1270\u1348\u133b\u121a\u1290\u1273\u1278\u12cd\u1295  \u1270\u1240\u1260\u120d
```

**`footer.copyright`**

```
en             All rights reserved  # do not translate the year
m2m100         \u1201\u1209\u121d \u1218\u1265\u1276\u127d \u12e8\u1270\u1320\u1260\u1241 \u1293\u1278\u12cd  # do not translate the year
llama-3.1-8b   \u12a0\u121d\u1290\u1275 \u1208\u121b\u1208\u134d  # do not translate the year
llama-4-scout  \u1201\u1209\u121d \u1218\u1265\u1276\u127d \u12e8\u1270\u1320\u1260\u1241 \u1293\u1278\u12cd  # do not translate the year
```

**`error.permission`**

```
en             You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100         \u12a0\u1295\u1270 \u12ed\u1205\u1295 \u1270\u130d\u1263\u122d \u1208\u1218\u1300\u1218\u122d \u12a0\u12ed\u127d\u1209\u121d. \u12ed\u1205 \u12a0\u1295\u12f5 \u1235\u1205\u1270\u1275 \u1290\u12cd \u12a8\u1206\u1290 \u12e8\u12a5\u122d\u1235\u12ce \u12a0\u1235\u1270\u12f3\u12f3\u122a\u1295 \u12eb\u1290\u130b\u130d\u1229.
llama-3.1-8b   \u12a0\u1295\u1270 \u1260\u1325\u1265\u1245 \u12a0\u12ed\u127d\u120d\u120b\u127d\u1201\u1295\u1362 \u12a5\u1293\u1275 \u12a0\u1235\u1270\u12cb\u120d\u1295\u1235\u1275\u1205\u1295 \u1270\u12a8\u1270\u1208\u12cd\u1362
llama-4-scout  \u12e8\u12da\u1205\u1295 \u1270\u130d\u1263\u122d \u12e8\u121b\u12a8\u1293\u12c8\u1295 \u134d\u1243\u12f5 \u12e8\u1208\u12ce\u1275\u121d\u1362 \u1235\u1205\u1270\u1275 \u1290\u12cd \u1265\u1208\u12cd \u12e8\u121a\u12eb\u1235\u1261 \u12a8\u1206\u1290\u1363 \u12a0\u1235\u1270\u12f3\u12f3\u122a\u12ce\u1295 \u12eb\u1290\u130b\u130d\u1229\u1362
```

**`onboarding.step`**

```
en             Choose a workspace name. You can change it later in settings.
m2m100         \u12a0\u1295\u12f5 \u12e8\u1225\u122b \u1235\u134b\u1275 \u1235\u121d \u12ed\u121d\u1228\u1321. \u12a5\u122d\u1235\u12ce \u12a8\u12da\u12eb \u1260\u128b\u120b \u1218\u1270\u130d\u1260\u122a\u12eb\u12ce\u127d \u12cd\u1235\u1325 \u12ed\u1320\u1240\u1219 \u12ed\u127d\u120b\u1209.
llama-3.1-8b   \u12a0\u1235\u1270\u12f3\u12f0\u122d \u1235\u121d
llama-4-scout  \u12e8\u1235\u122b \u1266\u1273 \u1235\u121d \u12ed\u121d\u1228\u1321\u1362 \u1260\u128b\u120b \u1260\u1245\u1295\u1265\u122e\u127d \u12cd\u1235\u1325 \u1218\u1240\u12e8\u122d \u12ed\u127d\u120b\u1209\u1362
```
