# Model comparison: m2m100 vs llama-3.1-8b vs llama-3.2-3b vs llama-3.3-70b vs llama-4-scout vs mistral-small-3.1

Fixture: `comparison.properties` · Endpoint: `https://translatemessages-staging.justblackmagic.workers.dev/`

## Summary

Lower is better for every column except "translated".

| Language | Model | Translated | Unchanged | Placeholders lost | Reported failures | Missing keys | Latency |
|---|---|---|---|---|---|---|---|
| fr | m2m100 | 25/25 | 0 | 0 | 0 | 0 | 6644ms |
| fr | llama-3.1-8b | 25/25 | 0 | 0 | 0 | 0 | 2173ms |
| fr | llama-3.2-3b | 24/25 | 1 | 0 | 1 | 0 | 865ms |
| fr | llama-3.3-70b | 24/25 | 1 | 0 | 0 | 0 | 1648ms |
| fr | llama-4-scout | 25/25 | 0 | 0 | 0 | 0 | 1229ms |
| fr | mistral-small-3.1 | 25/25 | 0 | 0 | 0 | 0 | 1879ms |
| es | m2m100 | 25/25 | 0 | 0 | 0 | 0 | 2682ms |
| es | llama-3.1-8b | 25/25 | 0 | 0 | 0 | 0 | 2416ms |
| es | llama-3.2-3b | 22/25 | 3 | 0 | 3 | 0 | 666ms |
| es | llama-3.3-70b | 25/25 | 0 | 0 | 0 | 0 | 2807ms |
| es | llama-4-scout | 25/25 | 0 | 0 | 0 | 0 | 946ms |
| es | mistral-small-3.1 | 25/25 | 0 | 0 | 0 | 0 | 1990ms |
| de | m2m100 | 23/25 | 2 | 0 | 0 | 0 | 4518ms |
| de | llama-3.1-8b | 25/25 | 0 | 0 | 0 | 0 | 2462ms |
| de | llama-3.2-3b | 23/25 | 2 | 0 | 2 | 0 | 767ms |
| de | llama-3.3-70b | 24/25 | 1 | 0 | 0 | 0 | 1562ms |
| de | llama-4-scout | 24/25 | 1 | 0 | 0 | 0 | 1175ms |
| de | mistral-small-3.1 | 25/25 | 0 | 0 | 0 | 0 | 2697ms |
| ja | m2m100 | 22/25 | 3 | 0 | 1 | 0 | 2208ms |
| ja | llama-3.1-8b | 25/25 | 0 | 0 | 0 | 0 | 2227ms |
| ja | llama-3.2-3b | 20/25 | 5 | 0 | 3 | 0 | 758ms |
| ja | llama-3.3-70b | 24/25 | 1 | 0 | 0 | 0 | 4117ms |
| ja | llama-4-scout | 24/25 | 1 | 0 | 0 | 0 | 1506ms |
| ja | mistral-small-3.1 | 24/25 | 1 | 0 | 0 | 0 | 3190ms |

## Side by side

Read this part. The table above cannot tell you whether a translation is good,
only whether it is structurally intact.

### fr

**`app.name`**

```
en                 Task Manager
m2m100             Gestionnaire de t\u00e2ches
llama-3.1-8b       Gestionnaire de t\u00e2ches
llama-3.2-3b       Gestionnaire de t\u00e2ches
llama-3.3-70b      Gestionnaire de t\u00e2ches
llama-4-scout      Gestionnaire de t\u00e2ches
mistral-small-3.1  Gestionnaire des t\u00e2ches
```

**`app.welcome`**

```
en                 Welcome to your dashboard
m2m100             Bienvenue sur votre dashboard
llama-3.1-8b       Bienvenue sur votre tableau de bord
llama-3.2-3b       Bienvenue sur votre tableau de bord
llama-3.3-70b      Bienvenue sur votre tableau de bord
llama-4-scout      Bienvenue sur votre tableau de bord
mistral-small-3.1  Bienvenue sur votre tableau de bord
```

**`app.description`**

```
en                 Manage your projects and collaborate with your team in one place
m2m100             G\u00e9rer vos projets et collaborer avec votre \u00e9quipe en un seul endroit
llama-3.1-8b       G\u00e9rer vos projets et collaborer avec votre \u00e9quipe dans un seul endroit
llama-3.2-3b       G\u00e9rer vos projets et collaborer avec votre \u00e9quipe dans un seul endroit
llama-3.3-70b      G\u00e9rez vos projets et collaborez avec votre \u00e9quipe en un seul endroit
llama-4-scout      G\u00e9rez vos projets et collaborez avec votre \u00e9quipe en un seul endroit
mistral-small-3.1  G\u00e9rez vos projets et collaborez avec votre \u00e9quipe en un seul endroit
```

**`button.ok`**

```
en                 OK
m2m100             OK \u00e0
llama-3.1-8b       D'accord
llama-3.2-3b       d'accord
llama-3.3-70b      OK   <-- UNCHANGED
llama-4-scout      D'accord
mistral-small-3.1  D'accord
```

**`button.save`**

```
en                 Save
m2m100             Sauvons
llama-3.1-8b       Sauvegarder
llama-3.2-3b       Enregistrer
llama-3.3-70b      Enregistrer
llama-4-scout      Enregistrer
mistral-small-3.1  Enregistrer
```

**`label.hi`**

```
en                 Hi {0}
m2m100             Bonjour {0}
llama-3.1-8b       Bonjour {0}
llama-3.2-3b       Bonjour {0}
llama-3.3-70b      Bonjour {0}
llama-4-scout      Bonjour {0}
mistral-small-3.1  Bonjour {0}
```

**`label.bye`**

```
en                 Bye {0}
m2m100             Au revoir {0}
llama-3.1-8b       Au revoir {0}
llama-3.2-3b       Au revoir {0}
llama-3.3-70b      Au revoir {0}
llama-4-scout      Au revoir {0}
mistral-small-3.1  Au revoir {0}
```

**`message.greeting`**

```
en                 Hello {0}
m2m100             Bonjour {0}
llama-3.1-8b       Bonjour {0}
llama-3.2-3b       Bonjour {0}
llama-3.3-70b      Bonjour {0}
llama-4-scout      Bonjour {0}
mistral-small-3.1  Bonjour {0}
```

**`message.count`**

```
en                 You have {0} of {1} messages
m2m100             Vous avez {0} de messages {1}
llama-3.1-8b       Vous avez {0} de {1} messages
llama-3.2-3b       Vous avez {0} de {1} messages
llama-3.3-70b      Vous avez {0} sur {1} messages
llama-4-scout      Vous avez {0} sur {1} messages
mistral-small-3.1  Vous avez {0} sur {1} messages
```

**`message.repeat`**

```
en                 Hello {0}, we said hello {0} already
m2m100             Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}
llama-3.1-8b       Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}
llama-3.2-3b       Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}.
llama-3.3-70b      Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}
llama-4-scout      Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}
mistral-small-3.1  Bonjour {0}, nous avons d\u00e9j\u00e0 dit bonjour {0}
```

**`message.order`**

```
en                 {0} items shipped to {1} on {2}
m2m100             {0} articles exp\u00e9di\u00e9s \u00e0 {1} sur {2}
llama-3.1-8b       {0} articles exp\u00e9di\u00e9s \u00e0 {1} le {2}
llama-3.2-3b       {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-3.3-70b      {0} articles exp\u00e9di\u00e9s \u00e0 {1} le {2}
llama-4-scout      {0} articles exp\u00e9di\u00e9s \u00e0 {1} le {2}
mistral-small-3.1  {0} articles exp\u00e9di\u00e9s \u00e0 {1} le {2}
```

**`user.welcome`**

```
en                 Welcome back, ${name}
m2m100             Bienvenue \u00e0 nouveau, ${name}
llama-3.1-8b       Bienvenue de retour, ${name}
llama-3.2-3b       Bienvenue \u00e0 nouveau, ${name}
llama-3.3-70b      Bienvenue, ${name}
llama-4-scout      Bienvenue en arri\u00e8re, ${name}
mistral-small-3.1  Bienvenue \u00e0 nouveau, ${name}
```

**`user.profile`**

```
en                 Profile for ${user.name} in ${user.role}
m2m100             Profil pour ${user.name} en ${user.role}
llama-3.1-8b       Profil pour ${user.name} dans ${user.role}
llama-3.2-3b       Profile pour ${user.name} en ${user.role}
llama-3.3-70b      Profil pour ${user.name} en ${user.role}
llama-4-scout      Profil pour ${user.name} dans ${user.role}
mistral-small-3.1  Profil pour ${user.name} dans le r\u00f4le ${user.role}
```

**`stats.total`**

```
en                 Total: %s items
m2m100             Total \: %s articles
llama-3.1-8b       Total \: %s articles
llama-3.2-3b       Total \: %s items
llama-3.3-70b      Total \: %s \u00e9l\u00e9ments
llama-4-scout      Total \: %s articles
mistral-small-3.1  Total\u00a0\: %s articles
```

**`stats.indexed`**

```
en                 %1$s scored %2$d points
m2m100             %1$s marqu\u00e9 %2$d points
llama-3.1-8b       %1$s a marqu\u00e9 %2$d points
llama-3.2-3b       %1$s a marqu\u00e9 %2$d points
llama-3.3-70b      %1$s a marqu\u00e9 %2$d points
llama-4-scout      %1$s a obtenu %2$d points
mistral-small-3.1  %1$s a marqu\u00e9 %2$d points
```

**`alert.warning`**

```
en                 Warning, {0}!
m2m100             Avertissement {0} \!
llama-3.1-8b       Attention, {0} \!
llama-3.2-3b       Attention, {0} \!
llama-3.3-70b      Avertissement, {0} \!
llama-4-scout      Avertissement, {0} \!
mistral-small-3.1  Attention, {0}\!
```

**`alert.question`**

```
en                 Are you sure you want to delete {0}?
m2m100             \u00cates-vous s\u00fbr que vous voulez supprimer {0}?
llama-3.1-8b       Voulez-vous vraiment supprimer {0} ?
llama-3.2-3b       {0}
llama-3.3-70b      \u00cates-vous s\u00fbr de vouloir supprimer {0} ?
llama-4-scout      \u00cates-vous s\u00fbr de vouloir supprimer {0} ?
mistral-small-3.1  \u00cates-vous s\u00fbr de vouloir supprimer {0} ?
```

**`alert.parens`**

```
en                 Order ({0}) has shipped
m2m100             La commande ({0}) a \u00e9t\u00e9 exp\u00e9di\u00e9e
llama-3.1-8b       Commande ({0}) a \u00e9t\u00e9 exp\u00e9di\u00e9e
llama-3.2-3b       L'ordre ({0}) a \u00e9t\u00e9 exp\u00e9di\u00e9
llama-3.3-70b      Commande ({0}) a \u00e9t\u00e9 exp\u00e9di\u00e9e
llama-4-scout      La commande ({0}) a \u00e9t\u00e9 exp\u00e9di\u00e9e
mistral-small-3.1  Commande ({0}) a \u00e9t\u00e9 exp\u00e9di\u00e9e
```

**`help.multiline`**

```
en                 First line\nSecond line
m2m100             Premi\u00e8re ligne\nSeconde ligne
llama-3.1-8b       Premi\u00e8re ligne\nDeuxi\u00e8me ligne
llama-3.2-3b       Premi\u00e8re ligne\nDeuxi\u00e8me ligne
llama-3.3-70b      Premi\u00e8re ligne\nDeuxi\u00e8me ligne
llama-4-scout      Premi\u00e8re ligne\nDeuxi\u00e8me ligne
mistral-small-3.1  Premi\u00e8re ligne\nDeuxi\u00e8me ligne
```

**`help.tabbed`**

```
en                 Column one\tColumn two
m2m100             Colonne une\tColonne deux
llama-3.1-8b       Colonnes un\tColonnes deux
llama-3.2-3b       Colonne un\tColonne deux
llama-3.3-70b      Colonne un\tColonne deux
llama-4-scout      Colonne un\tColonne deux
mistral-small-3.1  Colonne une\tColonne deux
```

**`help.unicode`**

```
en                 Café près de l’hôtel
m2m100             Caf\u00e9 pr\u00e8s de l'h\u00f4tel
llama-3.1-8b       Caf\u00e9 pr\u00e8s de l'h\u00f4tel
llama-3.2-3b       Caf\u00e9 pr\u00e8s de l'h\u00f4tel
llama-3.3-70b      Caf\u00e9 pr\u00e8s de l'h\u00f4tel
llama-4-scout      Caf\u00e9 near the hotel -> Caf\u00e9 pr\u00e8s de l'h\u00f4tel \n Caf\u00e9 -> Caf\u00e9 \n near -> pr\u00e8s de \n the -> l' \n hotel -> h\u00f4tel \nCaf\u00e9 pr\u00e8s de l'h\u00f4tel
mistral-small-3.1  Caf\u00e9 pr\u00e8s de l'h\u00f4tel
```

**`terms.long`**

```
en                 By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100             En continuant, vous acceptez les termes {0} et la politique de confidentialit\u00e9 {1} en vigueur aujourd'hui
llama-3.1-8b       En continuant, vous acceptez les termes {0} et la politique de confidentialit\u00e9 {1} en vigueur aujourd'hui
llama-3.2-3b       En continuant, vous acceptez les termes {0} et la politique de confidentialit\u00e9 {1} applicable \u00e0 partir aujourd'hui
llama-3.3-70b      En continuant, vous acceptez les conditions {0} et la politique de confidentialit\u00e9 {1} en vigueur aujourd'hui
llama-4-scout      En poursuivant, vous acceptez les conditions {0} et la politique de confidentialit\u00e9 {1} en vigueur aujourd'hui
mistral-small-3.1  En continuant, vous acceptez les conditions {0} et la politique de confidentialit\u00e9 {1} en vigueur \u00e0 partir d'aujourd'hui
```

**`footer.copyright`**

```
en                 All rights reserved  # do not translate the year
m2m100             Tous droits r\u00e9serv\u00e9s  # do not translate the year
llama-3.1-8b       Tous droits r\u00e9serv\u00e9s  # do not translate the year
llama-3.2-3b       Tous droits r\u00e9serv\u00e9s  # do not translate the year
llama-3.3-70b      Tous droits r\u00e9serv\u00e9s  # do not translate the year
llama-4-scout      Tous droits r\u00e9serv\u00e9s  # do not translate the year
mistral-small-3.1  Tous droits r\u00e9serv\u00e9s  # do not translate the year
```

**`error.permission`**

```
en                 You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100             Vous n'avez pas l'autorisation d'effectuer cette action. Contactez votre administrateur si vous pensez que c'est une erreur.
llama-3.1-8b       Vous n'avez pas la permission d'ex\u00e9cuter cette action. Contactez votre administrateur si vous pensez que c'est une erreur.
llama-3.2-3b       {0}Vous n'avez pas les droits n\u00e9cessaires pour effectuer cette action. Contactez votre administrateur si vous pensez qu'il s'agit d'un erreur.
llama-3.3-70b      Vous n'avez pas la permission d'effectuer cette action. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
llama-4-scout      Vous n'avez pas la permission d'effectuer cette action. Contactez votre administrateur si vous pensez que c'est une erreur.
mistral-small-3.1  Vous n'avez pas la permission d'effectuer cette action. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
```

**`onboarding.step`**

```
en                 Choose a workspace name. You can change it later in settings.
m2m100             Choisissez un nom d'espace de travail. Vous pouvez le modifier plus tard dans les param\u00e8tres.
llama-3.1-8b       Choisissez un nom de bureau. Vous pouvez le modifier ult\u00e9rieurement dans les param\u00e8tres.
llama-3.2-3b       Nom du nom de l'espace de travail.
llama-3.3-70b      Choisissez un nom d'espace de travail. Vous pouvez le modifier plus tard dans les param\u00e8tres.
llama-4-scout      Choisissez un nom d'espace de travail. Vous pouvez le modifier plus tard dans les param\u00e8tres.
mistral-small-3.1  Choisissez un nom d'espace de travail. Vous pouvez le modifier plus tard dans les param\u00e8tres.
```

### es

**`app.name`**

```
en                 Task Manager
m2m100             Gerente de tareas
llama-3.1-8b       Administrador de Tareas
llama-3.2-3b       Administrador de tareas
llama-3.3-70b      Administrador de tareas
llama-4-scout      Administrador de tareas
mistral-small-3.1  Gestor de tareas
```

**`app.welcome`**

```
en                 Welcome to your dashboard
m2m100             Bienvenido a tu dashboard
llama-3.1-8b       Bienvenido a su panel de control
llama-3.2-3b       Bienvenido a su panel de control
llama-3.3-70b      Bienvenido a tu panel de control
llama-4-scout      Bienvenido a su panel de control
mistral-small-3.1  Bienvenido a su panel de control
```

**`app.description`**

```
en                 Manage your projects and collaborate with your team in one place
m2m100             Gestiona tus proyectos y colabora con tu equipo en un solo lugar
llama-3.1-8b       Administre sus proyectos y colabore con su equipo en un solo lugar
llama-3.2-3b       Gestiona tus proyectos y colabora con tu equipo en un lugar
llama-3.3-70b      Administra tus proyectos y colabora con tu equipo en un solo lugar
llama-4-scout      Gestiona tus proyectos y colabora con tu equipo en un solo lugar
mistral-small-3.1  Gestiona tus proyectos y colabora con tu equipo en un solo lugar
```

**`button.ok`**

```
en                 OK
m2m100             bien
llama-3.1-8b       \u00a1De acuerdo
llama-3.2-3b       ok
llama-3.3-70b      De acuerdo
llama-4-scout      Bien
mistral-small-3.1  Aceptar
```

**`button.save`**

```
en                 Save
m2m100             Salvar
llama-3.1-8b       Guardar
llama-3.2-3b       guardar
llama-3.3-70b      Guardar
llama-4-scout      Guardar
mistral-small-3.1  Guardar
```

**`label.hi`**

```
en                 Hi {0}
m2m100             Hola {0}
llama-3.1-8b       Hola {0}
llama-3.2-3b       Hola {0}
llama-3.3-70b      Hola {0}
llama-4-scout      Hola {0}
mistral-small-3.1  Hola {0}
```

**`label.bye`**

```
en                 Bye {0}
m2m100             Adi\u00f3s {0}
llama-3.1-8b       Adi\u00f3s {0}
llama-3.2-3b       Adi\u00f3s {0}
llama-3.3-70b      Adi\u00f3s {0}
llama-4-scout      Adi\u00f3s {0}
mistral-small-3.1  Adi\u00f3s {0}
```

**`message.greeting`**

```
en                 Hello {0}
m2m100             Hola {0}
llama-3.1-8b       Hola {0}
llama-3.2-3b       Hola {0}
llama-3.3-70b      Hola {0}
llama-4-scout      Hola {0}
mistral-small-3.1  Hola {0}
```

**`message.count`**

```
en                 You have {0} of {1} messages
m2m100             Usted tiene {0} de mensajes de {1}
llama-3.1-8b       Tienes {0} de {1} mensajes
llama-3.2-3b       Tienes {0} de {1} mensajes
llama-3.3-70b      Tienes {0} de {1} mensajes
llama-4-scout      Tienes {0} de {1} mensajes
mistral-small-3.1  Tienes {0} de {1} mensajes
```

**`message.repeat`**

```
en                 Hello {0}, we said hello {0} already
m2m100             Hola {0}, ya hemos dicho hello {0}
llama-3.1-8b       Hola {0}, ya saludamos a {0}
llama-3.2-3b       Hola {0}, ya dijimos hola {0} ya
llama-3.3-70b      Hola {0}, ya dijimos hola {0}
llama-4-scout      Hola {0}, ya nos saludamos {0} anteriormente
mistral-small-3.1  Hola {0}, ya dijimos hola {0}
```

**`message.order`**

```
en                 {0} items shipped to {1} on {2}
m2m100             {0} art\u00edculos enviados a {1} en {2}
llama-3.1-8b       {0} art\u00edculos enviados a {1} el {2}
llama-3.2-3b       {0} art\u00edculos enviados a {1} el {2}
llama-3.3-70b      {0} art\u00edculos enviados a {1} el {2}
llama-4-scout      {0} art\u00edculos enviados a {1} el {2}
mistral-small-3.1  {0} art\u00edculos enviados a {1} el {2}
```

**`user.welcome`**

```
en                 Welcome back, ${name}
m2m100             Bienvenido a ${name}
llama-3.1-8b       Bienvenido de nuevo, ${name}
llama-3.2-3b       Bienvenido de vuelta, ${name}
llama-3.3-70b      Bienvenido de nuevo, ${name}
llama-4-scout      Bienvenido de nuevo, ${name}
mistral-small-3.1  Bienvenido de nuevo, ${name}
```

**`user.profile`**

```
en                 Profile for ${user.name} in ${user.role}
m2m100             Perfil para ${user.name} en ${user.role}
llama-3.1-8b       Perfil para ${user.name} en ${user.role}
llama-3.2-3b       Perfil para ${user.name} en ${user.role}
llama-3.3-70b      Perfil para ${user.name} en ${user.role}
llama-4-scout      Perfil de ${user.name} en ${user.role}
mistral-small-3.1  Perfil para ${user.name} en ${user.role}
```

**`stats.total`**

```
en                 Total: %s items
m2m100             Total\: %s art\u00edculos
llama-3.1-8b       Total\: %s \u00edtems
llama-3.2-3b       Total\: %s art\u00edculos
llama-3.3-70b      Total\: %s elementos
llama-4-scout      Total\: %s art\u00edculos
mistral-small-3.1  Total\: %s art\u00edculos
```

**`stats.indexed`**

```
en                 %1$s scored %2$d points
m2m100             %1$s marcado %2$d puntos
llama-3.1-8b       %1$s anot\u00f3 %2$d puntos
llama-3.2-3b       %1$s anot\u00f3 %2$d puntos
llama-3.3-70b      %1$s anot\u00f3 %2$d puntos
llama-4-scout      %1$s obtuvo %2$d puntos
mistral-small-3.1  %1$s anot\u00f3 %2$d puntos
```

**`alert.warning`**

```
en                 Warning, {0}!
m2m100             \u00a1Alerta {0}\!
llama-3.1-8b       \u00a1Advertencia, {0}\!
llama-3.2-3b       Advertencia, {0}\!
llama-3.3-70b      Advertencia, {0}\!
llama-4-scout      Advertencia, {0}\!
mistral-small-3.1  \u00a1Advertencia, {0}\!
```

**`alert.question`**

```
en                 Are you sure you want to delete {0}?
m2m100             \u00bfEst\u00e1s seguro de que quieres eliminar {0}?
llama-3.1-8b       \u00bfEst\u00e1s seguro de que deseas eliminar {0}?
llama-3.2-3b       Are you sure you want to delete {0}?   <-- UNCHANGED
llama-3.3-70b      \u00bfEst\u00e1s seguro de que deseas eliminar {0}?
llama-4-scout      \u00bfEst\u00e1 seguro de que desea eliminar {0}?
mistral-small-3.1  \u00bfEst\u00e1s seguro de que quieres eliminar {0}?
```

**`alert.parens`**

```
en                 Order ({0}) has shipped
m2m100             Orden ({0}) ha sido enviado
llama-3.1-8b       Ha sido enviado el ({0})
llama-3.2-3b       El pedido ({0}) ha sido entregado
llama-3.3-70b      El pedido ({0}) ha sido enviado
llama-4-scout      El pedido ({0}) ha sido enviado
mistral-small-3.1  Pedido ({0}) ha sido enviado
```

**`help.multiline`**

```
en                 First line\nSecond line
m2m100             Primera l\u00ednea\nSegunda l\u00ednea
llama-3.1-8b       Primera l\u00ednea\nSegunda l\u00ednea
llama-3.2-3b       First line\nSecond line   <-- UNCHANGED
llama-3.3-70b      Primera l\u00ednea\nSegunda l\u00ednea
llama-4-scout      Primera l\u00ednea\nSegunda l\u00ednea
mistral-small-3.1  Primera l\u00ednea\nSegunda l\u00ednea
```

**`help.tabbed`**

```
en                 Column one\tColumn two
m2m100             Columna uno\tColumna dos
llama-3.1-8b       Column uno\tColumn dos
llama-3.2-3b       Column one\tColumn two   <-- UNCHANGED
llama-3.3-70b      Columna uno\tColumna dos
llama-4-scout      Columna uno\tColumna dos
mistral-small-3.1  Columna uno\tColumna dos
```

**`help.unicode`**

```
en                 Café près de l’hôtel
m2m100             Caf\u00e9 cerca del hotel
llama-3.1-8b       Caf\u00e9 cerca del hotel
llama-3.2-3b       Caf\u00e9 cerca del hotel
llama-3.3-70b      Cafeter\u00eda cerca del hotel
llama-4-scout      Caf\u00e9 cerca del hotel
mistral-small-3.1  Caf\u00e9 cerca del hotel
```

**`terms.long`**

```
en                 By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100             Al continuar aceptas los t\u00e9rminos {0} y la pol\u00edtica de privacidad {1} en vigor hoy
llama-3.1-8b       Al continuar, usted acepta los t\u00e9rminos {0} y la pol\u00edtica de privacidad {1} efectiva a partir de hoy
llama-3.2-3b       Al seguir adelante, acepta los t\u00e9rminos {0} y la pol\u00edtica de privacidad {1} efectiva a partir de hoy
llama-3.3-70b      Al continuar, acepta los t\u00e9rminos {0} y la pol\u00edtica de privacidad {1} efectiva a partir de hoy
llama-4-scout      Al continuar acepta los t\u00e9rminos {0} y la pol\u00edtica de privacidad {1} vigente hoy
mistral-small-3.1  Al continuar, acepta los t\u00e9rminos {0} y la pol\u00edtica de privacidad {1} vigente a partir de hoy
```

**`footer.copyright`**

```
en                 All rights reserved  # do not translate the year
m2m100             Todos los derechos reservados  # do not translate the year
llama-3.1-8b       Todos los derechos reservados  # do not translate the year
llama-3.2-3b       Todos los derechos reservados  # do not translate the year
llama-3.3-70b      Todos los derechos reservados  # do not translate the year
llama-4-scout      Todos los derechos reservados  # do not translate the year
mistral-small-3.1  Todos los derechos reservados  # do not translate the year
```

**`error.permission`**

```
en                 You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100             No tienes permiso para realizar esta acci\u00f3n.Contacta con tu administrador si crees que esto es un error.
llama-3.1-8b       No tiene permiso para realizar esta acci\u00f3n. Comun\u00edquese con su administrador si cree que esto es un error.
llama-3.2-3b       No tienes permiso para realizar esta acci\u00f3n. Contacta con tu administrador si crees que esto es un error.
llama-3.3-70b      No tiene permiso para realizar esta acci\u00f3n. P\u00f3ngase en contacto con su administrador si cree que se trata de un error.
llama-4-scout      No tiene permiso para realizar esta acci\u00f3n. P\u00f3ngase en contacto con su administrador si cree que se trata de un error.
mistral-small-3.1  No tiene permiso para realizar esta acci\u00f3n. P\u00f3ngase en contacto con su administrador si cree que esto es un error.
```

**`onboarding.step`**

```
en                 Choose a workspace name. You can change it later in settings.
m2m100             Seleccione un nombre de espacio de trabajo. Puede cambiarlo m\u00e1s adelante en la configuraci\u00f3n.
llama-3.1-8b       Elige un nombre de espacio de trabajo. Puedes cambiarlo m\u00e1s tarde en ajustes.
llama-3.2-3b       Nombre del espacio de trabajo. Puedes cambiarlo m\u00e1s adelante en configuraciones.
llama-3.3-70b      Elige un nombre de espacio de trabajo. Puedes cambiarlo m\u00e1s tarde en la configuraci\u00f3n.
llama-4-scout      Elige un nombre para el espacio de trabajo. Puedes cambiarlo m\u00e1s tarde en ajustes.
mistral-small-3.1  Elige un nombre para el espacio de trabajo. Puedes cambiarlo m\u00e1s tarde en la configuraci\u00f3n.
```

### de

**`app.name`**

```
en                 Task Manager
m2m100             Task Manager   <-- UNCHANGED
llama-3.1-8b       Aufgabenmanager
llama-3.2-3b       Aufgabenverwaltung
llama-3.3-70b      Aufgaben-Manager
llama-4-scout      Aufgaben-Manager
mistral-small-3.1  Aufgaben-Manager
```

**`app.welcome`**

```
en                 Welcome to your dashboard
m2m100             Willkommen auf Ihrem Dashboard
llama-3.1-8b       Willkommen zur Ihr Dashboard
llama-3.2-3b       Willkommen zu Ihrem Dashboard
llama-3.3-70b      Willkommen auf Ihrem Dashboard
llama-4-scout      Willkommen auf Ihrem Dashboard
mistral-small-3.1  Willkommen zu Ihrem Dashboard
```

**`app.description`**

```
en                 Manage your projects and collaborate with your team in one place
m2m100             Verwalten Sie Ihre Projekte und arbeiten Sie mit Ihrem Team an einem Ort zusammen
llama-3.1-8b       Verwalten Sie Ihre Projekte und arbeiten Sie mit Ihrem Team in einem Ort
llama-3.2-3b       Verwaltet Sie Ihre Projekte und arbeitet mit Ihrem Team in einem Ort
llama-3.3-70b      Verwalten Sie Ihre Projekte und arbeiten Sie mit Ihrem Team an einem Ort zusammen
llama-4-scout      Verwalten Sie Ihre Projekte und arbeiten Sie mit Ihrem Team an einem Ort zusammen
mistral-small-3.1  Verwalten Sie Ihre Projekte und arbeiten Sie mit Ihrem Team an einem Ort zusammen
```

**`button.ok`**

```
en                 OK
m2m100             OK ist
llama-3.1-8b       Ja
llama-3.2-3b       Ja
llama-3.3-70b      OK   <-- UNCHANGED
llama-4-scout      OK   <-- UNCHANGED
mistral-small-3.1  In Ordnung
```

**`button.save`**

```
en                 Save
m2m100             Rettung
llama-3.1-8b       Speichern
llama-3.2-3b       Speichern
llama-3.3-70b      Speichern
llama-4-scout      Speichern
mistral-small-3.1  Speichern
```

**`label.hi`**

```
en                 Hi {0}
m2m100             Hi {0}   <-- UNCHANGED
llama-3.1-8b       Hallo {0}
llama-3.2-3b       Hallo {0}
llama-3.3-70b      Hallo {0}
llama-4-scout      Hallo {0}
mistral-small-3.1  Hallo {0}
```

**`label.bye`**

```
en                 Bye {0}
m2m100             Abschied von {0}
llama-3.1-8b       Auf Wiedersehen {0}
llama-3.2-3b       Auf Wiedersehen {0}
llama-3.3-70b      Tsch\u00fcss {0}
llama-4-scout      Auf Wiedersehen {0}
mistral-small-3.1  Tsch\u00fcss {0}
```

**`message.greeting`**

```
en                 Hello {0}
m2m100             Hallo {0}
llama-3.1-8b       Hallo {0}
llama-3.2-3b       Hallo {0}
llama-3.3-70b      Hallo {0}
llama-4-scout      Hallo {0}
mistral-small-3.1  Hallo {0}
```

**`message.count`**

```
en                 You have {0} of {1} messages
m2m100             Sie haben {0} von {1} Nachrichten
llama-3.1-8b       Sie haben {0} von {1} Nachrichten
llama-3.2-3b       I habe {0} von {1} Nachrichten
llama-3.3-70b      Sie haben {0} von {1} Nachrichten
llama-4-scout      Sie haben {0} von {1} Nachrichten
mistral-small-3.1  Sie haben {0} von {1} Nachrichten
```

**`message.repeat`**

```
en                 Hello {0}, we said hello {0} already
m2m100             Hallo {0}, wir sagten Hallo {0} bereits
llama-3.1-8b       Hallo {0}, wir sagten bereits Hallo {0}
llama-3.2-3b       Hallo {0}, wir haben bereits {0} gesagt
llama-3.3-70b      Hallo {0}, wir haben uns bereits verabschiedet {0} schon
llama-4-scout      Hallo {0}, wir haben bereits Hallo {0} gesagt
mistral-small-3.1  Hallo {0}, wir haben uns schon begr\u00fc\u00dft {0}
```

**`message.order`**

```
en                 {0} items shipped to {1} on {2}
m2m100             {0} Artikel an {1} auf {2} versandt
llama-3.1-8b       {0} Artikel wurden an {1} am {2} geschickt.
llama-3.2-3b       {0} Artikel geliefert an {1} am {2}
llama-3.3-70b      {0} Artikel an {1} am {2} geliefert
llama-4-scout      {0} Artikel an {1} am {2} versendet
mistral-small-3.1  {0} Artikel versendet an {1} am {2}
```

**`user.welcome`**

```
en                 Welcome back, ${name}
m2m100             Willkommen zur\u00fcck, ${name}
llama-3.1-8b       Willkommen zur\u00fcck, ${name}
llama-3.2-3b       Willkommen zur\u00fcck, ${name}
llama-3.3-70b      Willkommen zur\u00fcck, ${name}
llama-4-scout      Willkommen zur\u00fcck, ${name}
mistral-small-3.1  Willkommen zur\u00fcck, ${name}
```

**`user.profile`**

```
en                 Profile for ${user.name} in ${user.role}
m2m100             Profil f\u00fcr ${user.name} in ${user.role}
llama-3.1-8b       Profil f\u00fcr ${user.name} in ${user.role}
llama-3.2-3b       Profile for ${user.name} in ${user.role}   <-- UNCHANGED
llama-3.3-70b      Profil f\u00fcr ${user.name} in ${user.role}
llama-4-scout      Profil f\u00fcr ${user.name} in ${user.role}
mistral-small-3.1  Profil f\u00fcr ${user.name} in ${user.role}
```

**`stats.total`**

```
en                 Total: %s items
m2m100             Gesamt\: %s Artikel
llama-3.1-8b       Gesamt\: %s Artikel
llama-3.2-3b       Gesamt\: %s Artikel
llama-3.3-70b      Gesamt\: %s Artikel
llama-4-scout      Insgesamt\: %s Artikel
mistral-small-3.1  Gesamt\: %s Artikel
```

**`stats.indexed`**

```
en                 %1$s scored %2$d points
m2m100             %1$s erzielt %2$d Punkte
llama-3.1-8b       %1$s erzielte %2$d Punkte
llama-3.2-3b       %1$s erzielte %2$d Punkte
llama-3.3-70b      %1$s hat %2$d Punkte erzielt
llama-4-scout      %1$s erzielte %2$d Punkte
mistral-small-3.1  %1$s hat %2$d Punkte erzielt
```

**`alert.warning`**

```
en                 Warning, {0}!
m2m100             Warnung {0}\!
llama-3.1-8b       Warnung, {0}\!
llama-3.2-3b       Vorsicht, {0}\!
llama-3.3-70b      Warnung, {0}\!
llama-4-scout      Warnung, {0}\!
mistral-small-3.1  Warnung, {0}\!
```

**`alert.question`**

```
en                 Are you sure you want to delete {0}?
m2m100             Sind Sie sicher, dass Sie {0} l\u00f6schen m\u00f6chten?
llama-3.1-8b       Sind Sie sicher, dass Sie {0} l\u00f6schen m\u00f6chten?
llama-3.2-3b       Are you sure you want to delete {0}?   <-- UNCHANGED
llama-3.3-70b      Sind Sie sicher, dass Sie {0} l\u00f6schen m\u00f6chten?
llama-4-scout      Sind Sie sicher, dass Sie {0} l\u00f6schen m\u00f6chten?
mistral-small-3.1  Bist du sicher, dass du {0} l\u00f6schen m\u00f6chtest?
```

**`alert.parens`**

```
en                 Order ({0}) has shipped
m2m100             Bestellung ({0}) wurde versandt
llama-3.1-8b       Bestellung ({0}) wurde verschickt
llama-3.2-3b       Bestellung ({0}) hat verschickt
llama-3.3-70b      Bestellung ({0}) wurde versandt
llama-4-scout      Bestellung ({0}) ist versendet worden
mistral-small-3.1  Bestellung ({0}) wurde versendet
```

**`help.multiline`**

```
en                 First line\nSecond line
m2m100             Erste Linie\nZZ Zweite Linie
llama-3.1-8b       Erster Zeile\nZweite Zeile
llama-3.2-3b       Erster Zeile\nZweite Zeile
llama-3.3-70b      Erste Zeile\nZweite Zeile
llama-4-scout      Erste Zeile\nZweite Zeile
mistral-small-3.1  Erste Zeile\nZweite Zeile
```

**`help.tabbed`**

```
en                 Column one\tColumn two
m2m100             Spalte one\tSpalte zwei
llama-3.1-8b       Spalte \tSpalte zwei
llama-3.2-3b       Spalte eins\tSpalte zwei
llama-3.3-70b      Spalte eins\tSpalte zwei
llama-4-scout      Spalte eins\tSpalte zwei
mistral-small-3.1  Spalte eins\tSpalte zwei
```

**`help.unicode`**

```
en                 Café près de l’hôtel
m2m100             Caf\u00e9 in der N\u00e4he des Hotels
llama-3.1-8b       Kaffee nahe dem Hotel
llama-3.2-3b       Kaffee in der N\u00e4he des Hotels
llama-3.3-70b      Caf\u00e9 in der N\u00e4he des Hotels
llama-4-scout      Caf\u00e9 nahe dem Hotel
mistral-small-3.1  Caf\u00e9 in der N\u00e4he des Hotels
```

**`terms.long`**

```
en                 By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100             Durch die Fortsetzung erkl\u00e4ren Sie sich mit den Bedingungen {0} und der Datenschutzerkl\u00e4rung {1} heute g\u00fcltig.
llama-3.1-8b       Indem Sie fortfahren, stimmen Sie den Bedingungen {0} und der Datenschutzerkl\u00e4rung {1} ab, die heute anwenden.
llama-3.2-3b       Indem du forderst die Fortsetzung, stimmst du den Nutzungsbedingungen {0} und der Datenschutzrichtlinie {1} ab, die ab dem heutigen Tag anwendbar sind.
llama-3.3-70b      Indem Sie fortfahren, stimmen Sie den Bedingungen {0} und der Datenschutzrichtlinie {1} ab, die heute in Kraft treten
llama-4-scout      Indem Sie fortfahren, stimmen Sie den Bedingungen {0} und der Datenschutzerkl\u00e4rung {1} mit Wirkung vom heutigen Tag zu
mistral-small-3.1  Durch das Fortfahren stimmen Sie den Bedingungen {0} und der Datenschutzrichtlinie {1} ab heute zu
```

**`footer.copyright`**

```
en                 All rights reserved  # do not translate the year
m2m100             Alle Rechte vorbehalten  # do not translate the year
llama-3.1-8b       Alle Rechte vorbehalten  # do not translate the year
llama-3.2-3b       Alle Rechte vorbehalten  # do not translate the year
llama-3.3-70b      Alle Rechte vorbehalten  # do not translate the year
llama-4-scout      Alle Rechte vorbehalten  # do not translate the year
mistral-small-3.1  Alle Rechte vorbehalten  # do not translate the year
```

**`error.permission`**

```
en                 You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100             Sie haben keine Berechtigung, diese Aktion durchzuf\u00fchren. Kontaktieren Sie Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
llama-3.1-8b       Sie haben keine Berechtigung, diese Aktion durchzuf\u00fchren. Wenden Sie sich an Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
llama-3.2-3b       Sie haben keinen Zugriff auf diese Aktion. Wenden Sie sich an Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
llama-3.3-70b      Sie haben keine Berechtigung, um diese Aktion auszuf\u00fchren. Wenden Sie sich an Ihren Administrator, wenn Sie der Meinung sind, dass dies ein Fehler ist.
llama-4-scout      Sie haben keine Berechtigung, diese Aktion auszuf\u00fchren. Wenden Sie sich an Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
mistral-small-3.1  Sie haben keine Berechtigung, diese Aktion auszuf\u00fchren. Wenden Sie sich an Ihren Administrator, wenn Sie glauben, dass dies ein Fehler ist.
```

**`onboarding.step`**

```
en                 Choose a workspace name. You can change it later in settings.
m2m100             W\u00e4hlen Sie einen Arbeitsplatznamen aus. Sie k\u00f6nnen ihn sp\u00e4ter in den Einstellungen \u00e4ndern.
llama-3.1-8b       W\u00e4hle einen Arbeitsbereichsnamen. Du kannst ihn sp\u00e4ter in den Einstellungen \u00e4ndern.
llama-3.2-3b       Arbeitsplatzname w\u00e4hlen. Sie k\u00f6nnen es sp\u00e4ter in Einstellungen \u00e4ndern.
llama-3.3-70b      W\u00e4hlen Sie einen Arbeitsbereichsnamen. Sie k\u00f6nnen ihn sp\u00e4ter in den Einstellungen \u00e4ndern.
llama-4-scout      W\u00e4hlen Sie einen Arbeitsbereichsnamen. Sie k\u00f6nnen ihn sp\u00e4ter in den Einstellungen \u00e4ndern.
mistral-small-3.1  W\u00e4hlen Sie einen Arbeitsbereichsnamen. Sie k\u00f6nnen ihn sp\u00e4ter in den Einstellungen \u00e4ndern.
```

### ja

**`app.name`**

```
en                 Task Manager
m2m100             \u30bf\u30b9\u30af\u30de\u30cd\u30fc\u30b8\u30e3\u30fc
llama-3.1-8b       \u30bf\u30b9\u30af\u30de\u30cd\u30fc\u30b8\u30e3
llama-3.2-3b       \u30bf\u30b9\u30af\u30de\u30cd\u30fc\u30b8\u30e3\u30fc
llama-3.3-70b      \u30bf\u30b9\u30af\u30de\u30cd\u30fc\u30b8\u30e3\u30fc
llama-4-scout      \u30bf\u30b9\u30af \u30de\u30cd\u30fc\u30b8\u30e3\u30fc
mistral-small-3.1  \u30bf\u30b9\u30af \u30de\u30cd\u30fc\u30b8\u30e3\u30fc
```

**`app.welcome`**

```
en                 Welcome to your dashboard
m2m100             \u3088\u3046\u3053\u305d\u3042\u306a\u305f\u306e\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u3078
llama-3.1-8b       \u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u306b\u3088\u3046\u3053\u305d
llama-3.2-3b       welcome to your dashboard
llama-3.3-70b      \u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u3078\u3088\u3046\u3053\u305d
llama-4-scout      \u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u3078\u3088\u3046\u3053\u305d
mistral-small-3.1  \u3088\u3046\u3053\u305d\u3001\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u3078
```

**`app.description`**

```
en                 Manage your projects and collaborate with your team in one place
m2m100             \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u7ba1\u7406\u3057\u30011\u3064\u306e\u5834\u6240\u3067\u30c1\u30fc\u30e0\u3068\u5354\u529b
llama-3.1-8b       \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u7ba1\u7406\u3057\u3001\u30c1\u30fc\u30e0\u3068\u5354\u529b\u3059\u308b\u5834\u6240\u306b\u3042\u308a\u307e\u3059\u3002
llama-3.2-3b       {0}\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u7ba1\u7406\u3057\u3001\u30c1\u30fc\u30e0\u3068\u5354\u529b\u3059\u308b\u5834\u6240\u3067 {1}
llama-3.3-70b      \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u7ba1\u7406\u3057\u3001\u4e00\u304b\u6240\u3067\u30c1\u30fc\u30e0\u3068\u5171\u540c\u4f5c\u696d\u3092\u884c\u3046
llama-4-scout      \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u7ba1\u7406\u3057\u3001\u30c1\u30fc\u30e0\u3068\u9023\u643a\u3057\u3066\u4e00\u3064\u306e\u5834\u6240\u3067\u4f5c\u696d\u3057\u307e\u3057\u3087\u3046
mistral-small-3.1  \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u7ba1\u7406\u3057\u3001\u30c1\u30fc\u30e0\u3068\u4e00\u7dd2\u306b\u5354\u529b\u3057\u3066\u4f5c\u696d\u3092\u9032\u3081\u308b
```

**`button.ok`**

```
en                 OK
m2m100             OK   <-- UNCHANGED
llama-3.1-8b       \uff2f\uff2b
llama-3.2-3b       OK   <-- UNCHANGED
llama-3.3-70b      OK   <-- UNCHANGED
llama-4-scout      OK   <-- UNCHANGED
mistral-small-3.1  OK   <-- UNCHANGED
```

**`button.save`**

```
en                 Save
m2m100             SAVE
llama-3.1-8b       \u30bb\u30fc\u30d6
llama-3.2-3b       Save   <-- UNCHANGED
llama-3.3-70b      \u4fdd\u5b58
llama-4-scout      \u4fdd\u5b58
mistral-small-3.1  \u4fdd\u5b58
```

**`label.hi`**

```
en                 Hi {0}
m2m100             \u3053\u3093\u306b\u3061\u306f {0}
llama-3.1-8b       \u3053\u3093\u306b\u3061\u306f{0}
llama-3.2-3b       \u3053\u3093\u306b\u3061\u306f {0}
llama-3.3-70b      \u3053\u3093\u306b\u3061\u306f {0}
llama-4-scout      \u3053\u3093\u306b\u3061\u306f {0}
mistral-small-3.1  \u3053\u3093\u306b\u3061\u306f {0}
```

**`label.bye`**

```
en                 Bye {0}
m2m100             Bye {0}   <-- UNCHANGED
llama-3.1-8b       \u30d0\u30a4\u30d0\u30a4 {0}
llama-3.2-3b       \u3055\u3088\u3046\u306a\u3089 {0}
llama-3.3-70b      \u3055\u3088\u3046\u306a\u3089 {0}
llama-4-scout      \u3055\u3088\u3046\u306a\u3089 {0}
mistral-small-3.1  \u3055\u3088\u3046\u306a\u3089 {0}
```

**`message.greeting`**

```
en                 Hello {0}
m2m100             \u3053\u3093\u306b\u3061\u306f {0}
llama-3.1-8b       \u3053\u3093\u306b\u3061\u306f {0}
llama-3.2-3b       \u3053\u3093\u306b\u3061\u306f {0}
llama-3.3-70b      \u3053\u3093\u306b\u3061\u306f {0}
llama-4-scout      \u3053\u3093\u306b\u3061\u306f {0}
mistral-small-3.1  \u3053\u3093\u306b\u3061\u306f {0}
```

**`message.count`**

```
en                 You have {0} of {1} messages
m2m100             \u3042\u306a\u305f\u306f {1} \u30e1\u30c3\u30bb\u30fc\u30b8\u306e {0} \u3092\u6301\u3063\u3066\u3044\u307e\u3059
llama-3.1-8b       {0}\u306e\u3046\u3061{1}\u306e\u30e1\u30c3\u30bb\u30fc\u30b8
llama-3.2-3b       {0} of {1} messages
llama-3.3-70b      {0} \u500b\u306e {1} \u30e1\u30c3\u30bb\u30fc\u30b8\u304c\u3042\u308a\u307e\u3059
llama-4-scout      \u3042\u306a\u305f\u306f{0}\u4ef6\u306e{1}\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u6301\u3063\u3066\u3044\u307e\u3059
mistral-small-3.1  \u3042\u306a\u305f\u306f {0} \u306e {1} \u30e1\u30c3\u30bb\u30fc\u30b8\u304c\u3042\u308a\u307e\u3059
```

**`message.repeat`**

```
en                 Hello {0}, we said hello {0} already
m2m100             \u3053\u3093\u306b\u3061\u306f {0}, we said hello {0} already
llama-3.1-8b       \u3053\u3093\u306b\u3061\u306f{0}\u3001\u3082\u3046{0}\u306b\u4f1a\u3063\u305f\u3053\u3068\u304c\u3042\u308b
llama-3.2-3b       \u3053\u3093\u306b\u3061\u306f {0}\u3001\u79c1\u305f\u3061\u306f\u3059\u3067\u306b\u300c\u3053\u3093\u306b\u3061\u306f {0}\u300d\u3092\u8a00\u3063\u3066\u3044\u307e\u3057\u305f
llama-3.3-70b      \u3053\u3093\u306b\u3061\u306f {0}\u3001\u79c1\u305f\u3061\u306f\u65e2\u306b {0} \u3053\u3093\u306b\u3061\u306f\u3068\u8a00\u3063\u305f
llama-4-scout      \u3053\u3093\u306b\u3061\u306f {0}\u3001\u3082\u3046 {0} \u306b\u6328\u62f6\u3057\u307e\u3057\u305f\u3088\u306d
mistral-small-3.1  \u3053\u3093\u306b\u3061\u306f {0}\u3001\u3082\u3046\u3053\u3093\u306b\u3061\u306f {0} \u3068\u8a00\u3044\u307e\u3057\u305f\u3002
```

**`message.order`**

```
en                 {0} items shipped to {1} on {2}
m2m100             {0} items shipped to {1} on {2}   <-- UNCHANGED
llama-3.1-8b       {0}\u54c1\u304c{1}\u306b{2}\u306b\u767a\u9001\u3055\u308c\u307e\u3057\u305f\u3002
llama-3.2-3b       {0} \u500b\u306e\u54c1\u7269\u3092 {1} \u306b\u9001\u9054\u3057\u307e\u3057\u305f on {2}
llama-3.3-70b      {0} \u500b\u306e\u5546\u54c1\u304c {1} \u306b {2} \u306b\u51fa\u8377\u3055\u308c\u307e\u3057\u305f
llama-4-scout      {0} \u500b\u306e\u5546\u54c1\u304c {1} \u306b {2} \u306b\u767a\u9001\u3055\u308c\u307e\u3057\u305f
mistral-small-3.1  {0}\u30a2\u30a4\u30c6\u30e0\u304c{1}\u306b{2}\u306b\u767a\u9001\u3055\u308c\u307e\u3057\u305f\u3002
```

**`user.welcome`**

```
en                 Welcome back, ${name}
m2m100             \u3088\u3046\u3053\u305d\u3001${name}
llama-3.1-8b       \u3088\u3046\u3053\u305d\u623b\u308a\u307e\u3057\u305f\u3001${name}
llama-3.2-3b       \u304a\u4f1a\u3044\u3057\u3084\u3059\u3044\u3067\u3059\u3001${name}
llama-3.3-70b      \u3088\u3046\u3053\u305d\u623b\u308a\u307e\u3057\u305f\u3001${name}
llama-4-scout      \u304a\u623b\u308a\u306a\u3055\u3044\u3001${name}
mistral-small-3.1  \u3088\u3046\u3053\u305d\u623b\u3063\u3066\u304d\u307e\u3057\u305f\u3001${name}
```

**`user.profile`**

```
en                 Profile for ${user.name} in ${user.role}
m2m100             \u30d7\u30ed\u30d5\u30a3\u30fc\u30eb for ${user.name} in ${user.role}
llama-3.1-8b       ${user.name}\u306e\u30d7\u30ed\u30d5\u30a1\u30a4\u30eb\uff08${user.role}\uff09
llama-3.2-3b       \u30d7\u30ed\u30d5\u30a1\u30a4\u30eb\u306f${user.name}\u306b${user.role}\u3067\u3059
llama-3.3-70b      ${user.name} \u306e\u30d7\u30ed\u30d5\u30a1\u30a4\u30eb in ${user.role}
llama-4-scout      ${user.name}\u306e\u30d7\u30ed\u30d5\u30a1\u30a4\u30eb\uff08${user.role}\uff09
mistral-small-3.1  ${user.name}\u306e${user.role}\u306e\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb
```

**`stats.total`**

```
en                 Total: %s items
m2m100             \u5408\u8a08\:%s\u9805\u76ee
llama-3.1-8b       \u5408\u8a08\uff1a%s \u30a2\u30a4\u30c6\u30e0
llama-3.2-3b       \u5408\u8a08\:%s\u9805\u76ee
llama-3.3-70b      \u5408\u8a08\: %s \u4ef6
llama-4-scout      \u5408\u8a08\: %s \u500b
mistral-small-3.1  \u5408\u8a08\: %s \u4ef6
```

**`stats.indexed`**

```
en                 %1$s scored %2$d points
m2m100             %1$s \u5f97\u70b9 %2$d \u30dd\u30a4\u30f3\u30c8
llama-3.1-8b       %1$s\u306f%2$d\u70b9\u3092\u7372\u5f97\u3057\u307e\u3057\u305f\u3002
llama-3.2-3b       %1$s \u304c %2$d \u30dd\u30a4\u30f3\u30c8
llama-3.3-70b      %1$s \u306f %2$d \u70b9\u3092\u7372\u5f97\u3057\u307e\u3057\u305f
llama-4-scout      %1$s\u304c%2$d\u70b9\u3092\u7372\u5f97\u3057\u307e\u3057\u305f
mistral-small-3.1  %1$s\u306f%2$d\u70b9\u3092\u7372\u5f97\u3057\u307e\u3057\u305f
```

**`alert.warning`**

```
en                 Warning, {0}!
m2m100             \u8b66\u544a {0}\!
llama-3.1-8b       \u6ce8\u610f\u3001{0}\uff01
llama-3.2-3b       \u6ce8\u610f\u3001{0}\u3067\u3059\u3002
llama-3.3-70b      \u8b66\u544a\u3001{0}\uff01
llama-4-scout      \u8b66\u544a\u3001{0}\uff01
mistral-small-3.1  \u8b66\u544a\u3001{0}\uff01
```

**`alert.question`**

```
en                 Are you sure you want to delete {0}?
m2m100             {0} \u3092\u524a\u9664\u3057\u305f\u3044\u3068\u601d\u3044\u307e\u3059\u304b?
llama-3.1-8b       {0} \u306f\u524a\u9664\u3057\u307e\u3059\u304b\uff1f
llama-3.2-3b       {0}
llama-3.3-70b      {0}\u3092\u524a\u9664\u3057\u3066\u3088\u3044\u3067\u3059\u304b\uff1f
llama-4-scout      \u672c\u5f53\u306b{0}\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f
mistral-small-3.1  {0}\u3092\u524a\u9664\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f
```

**`alert.parens`**

```
en                 Order ({0}) has shipped
m2m100             \u6ce8\u6587({0})\u304c\u767a\u9001\u3055\u308c\u307e\u3057\u305f\u3002
llama-3.1-8b       \u6ce8\u6587\uff08{0})\u306f\u767a\u9001\u3055\u308c\u307e\u3057\u305f
llama-3.2-3b       Order ({0})\u306f\u767a\u9001\u6e08\u307f\u3067\u3059
llama-3.3-70b      \u6ce8\u6587 ({0}) \u306f\u51fa\u8377\u3055\u308c\u307e\u3057\u305f
llama-4-scout      \u6ce8\u6587\uff08{0}\uff09\u304c\u51fa\u8377\u3055\u308c\u307e\u3057\u305f
mistral-small-3.1  \u6ce8\u6587 ({0}) \u306f\u51fa\u8377\u3055\u308c\u307e\u3057\u305f
```

**`help.multiline`**

```
en                 First line\nSecond line
m2m100             \u7b2c1\u7dda\n\u7b2c2\u7dda
llama-3.1-8b       First line\n\n\nSecond line
llama-3.2-3b       Hajimari \nNijuu sen
llama-3.3-70b      \u5148\u884c\n\u6b21\u884c
llama-4-scout      \u6700\u521d\u306e\u884c\n\uff12\u884c\u76ee
mistral-small-3.1  \u6700\u521d\u306e\u884c\n\u4e8c\u884c\u76ee
```

**`help.tabbed`**

```
en                 Column one\tColumn two
m2m100             \u30b3\u30e9\u30e0 one\t\u30b3\u30e9\u30e0 two
llama-3.1-8b       \u4e00\u5217\t\u4e8c\u5217
llama-3.2-3b       \u30ab\u30e9\u30e01\t\u30ab\u30e9\u30e02
llama-3.3-70b      \u5217\u4e00\t\u5217\u4e8c
llama-4-scout      \u52171\t\u52172
mistral-small-3.1  \u52171\t\u52172
```

**`help.unicode`**

```
en                 Café près de l’hôtel
m2m100             \u30db\u30c6\u30eb\u306e\u8fd1\u304f\u306e\u30ab\u30d5\u30a7
llama-3.1-8b       \u30ab\u30d5\u30a7\u30fc\u3000\u30db\u30c6\u30eb\u306e\u8fd1\u304f
llama-3.2-3b       \u30ab\u30d5\u30a7\u8fd1\u304f\u30db\u30c6\u30eb
llama-3.3-70b      \u30db\u30c6\u30eb\u306e\u8fd1\u304f\u306b\u30ab\u30d5\u30a7
llama-4-scout      \u30db\u30c6\u30eb\u8fd1\u304f\u306e\u30ab\u30d5\u30a7
mistral-small-3.1  \u30db\u30c6\u30eb\u306e\u8fd1\u304f\u306e\u30ab\u30d5\u30a7
```

**`terms.long`**

```
en                 By continuing you agree to the terms {0} and the privacy policy {1} effective today
m2m100             \u7d99\u7d9a\u3059\u308b\u3053\u3068\u306b\u3088\u308a\u3001\u3042\u306a\u305f\u306f\u672c\u65e5\u6709\u52b9\u306a\u300c{0} \u300d\u3068\u300c{1} \u300d\u306e\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc\u306b\u540c\u610f\u3057\u307e\u3059\u3002
llama-3.1-8b       {0} {1} \u4eca\u65e5\u304b\u3089\u6709\u52b9\u306a\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc
llama-3.2-3b       By jiritsu o tsukau toki ni, o genzai ni teiketsu shite imasu {0} to, mimi to iru kiseki {1} e no k\u014deki teiketsu shite imasu
llama-3.3-70b      \u7d99\u7d9a\u3059\u308b\u3053\u3068\u3067\u3001{0} \u304a\u3088\u3073\u3001{1} \u4eca\u65e5\u3088\u308a\u52b9\u529b\u3092\u767a\u3059\u308b\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc\u306b\u540c\u610f\u3059\u308b\u3053\u3068\u306b\u306a\u308a\u307e\u3059
llama-4-scout      \u7d9a\u884c\u3059\u308b\u3068\u3001\u3042\u306a\u305f\u306f\u898f\u7d04 {0} \u304a\u3088\u3073\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc {1} \u306b\u540c\u610f\u3057\u305f\u3053\u3068\u306b\u306a\u308a\u307e\u3059\uff08\u672c\u65e5\u3088\u308a\u6709\u52b9\uff09
mistral-small-3.1  \u7d9a\u884c\u3059\u308b\u3053\u3068\u3067\u3001\u5229\u7528\u898f\u7d04 {0} \u304a\u3088\u3073\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc {1} \u4eca\u65e5\u6709\u52b9\u3068\u306a\u308b\u3053\u3068\u306b\u540c\u610f\u3059\u308b
```

**`footer.copyright`**

```
en                 All rights reserved  # do not translate the year
m2m100             All Rights Reserved \u3059\u3079\u3066\u306e\u6a29\u5229  # do not translate the year
llama-3.1-8b       \u5168\u6a29\u4fdd\u6709  # do not translate the year
llama-3.2-3b       All rights reserved  # do not translate the year   <-- UNCHANGED
llama-3.3-70b      \u8457\u4f5c\u6a29\u6240\u6709  # do not translate the year
llama-4-scout      \u3059\u3079\u3066\u306e\u6a29\u5229\u3092\u4fdd\u6709  # do not translate the year
mistral-small-3.1  \u8457\u4f5c\u6a29\u6240\u6709  # do not translate the year
```

**`error.permission`**

```
en                 You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.
m2m100             \u3042\u306a\u305f\u306f\u3053\u306e\u30a2\u30af\u30b7\u30e7\u30f3\u3092\u5b9f\u884c\u3059\u308b\u6a29\u9650\u304c\u3042\u308a\u307e\u305b\u3093. \u3042\u306a\u305f\u304c\u3053\u306e\u30a8\u30e9\u30fc\u3060\u3068\u4fe1\u3058\u308b\u5834\u5408\u306f\u3001\u7ba1\u7406\u8005\u306b\u9023\u7d61\u3057\u3066\u304f\u3060\u3055\u3044\u3002
llama-3.1-8b       \u3042\u306a\u305f\u306f\u3053\u306e\u30a2\u30af\u30b7\u30e7\u30f3\u3092\u5b9f\u884c\u3059\u308b\u6a29\u9650\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u7ba1\u7406\u8005\u306b\u9023\u7d61\u3057\u3066\u304f\u3060\u3055\u3044\u3002
llama-3.2-3b       You do not have permission to perform this action. Contact your administrator if you believe this is a mistake.   <-- UNCHANGED
llama-3.3-70b      \u3053\u306e\u64cd\u4f5c\u3092\u5b9f\u884c\u3059\u308b\u6a29\u9650\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u9593\u9055\u3044\u3067\u3042\u308b\u3068\u601d\u308f\u308c\u308b\u5834\u5408\u306f\u3001\u7ba1\u7406\u8005\u306b\u9023\u7d61\u3057\u3066\u304f\u3060\u3055\u3044\u3002
llama-4-scout      \u3053\u306e\u64cd\u4f5c\u3092\u884c\u3046\u6a29\u9650\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u8aa4\u308a\u3067\u3042\u308b\u3068\u601d\u308f\u308c\u308b\u5834\u5408\u306f\u3001\u7ba1\u7406\u8005\u306b\u9023\u7d61\u3057\u3066\u304f\u3060\u3055\u3044\u3002
mistral-small-3.1  \u3053\u306e\u64cd\u4f5c\u3092\u5b9f\u884c\u3059\u308b\u6a29\u9650\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u3053\u306e\u64cd\u4f5c\u304c\u8aa4\u308a\u3067\u3042\u308b\u3068\u8003\u3048\u308b\u5834\u5408\u306f\u3001\u7ba1\u7406\u8005\u306b\u9023\u7d61\u3057\u3066\u304f\u3060\u3055\u3044\u3002
```

**`onboarding.step`**

```
en                 Choose a workspace name. You can change it later in settings.
m2m100             \u30ef\u30fc\u30af\u30b9\u30da\u30fc\u30b9\u540d\u3092\u9078\u629e\u3057\u307e\u3059. \u5f8c\u3067\u8a2d\u5b9a\u3067\u5909\u66f4\u3067\u304d\u307e\u3059\u3002
llama-3.1-8b       \u4f5c\u696d\u30b9\u30da\u30fc\u30b9\u540d\u3092\u9078\u629e\u3057\u307e\u3059\u3002\u5f8c\u3067\u8a2d\u5b9a\u3067\u5909\u66f4\u3067\u304d\u307e\u3059\u3002
llama-3.2-3b       Choose a workspace name. You can change it later in settings.   <-- UNCHANGED
llama-3.3-70b      \u30ef\u30fc\u30af\u30b9\u30da\u30fc\u30b9\u540d\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u5f8c\u3067\u8a2d\u5b9a\u304b\u3089\u5909\u66f4\u3067\u304d\u307e\u3059\u3002
llama-4-scout      \u30ef\u30fc\u30af\u30b9\u30da\u30fc\u30b9\u540d\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u5f8c\u3067\u8a2d\u5b9a\u3067\u5909\u66f4\u3067\u304d\u307e\u3059\u3002
mistral-small-3.1  \u30ef\u30fc\u30af\u30b9\u30da\u30fc\u30b9\u306e\u540d\u524d\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u8a2d\u5b9a\u3067\u5f8c\u304b\u3089\u5909\u66f4\u3067\u304d\u307e\u3059\u3002
```
