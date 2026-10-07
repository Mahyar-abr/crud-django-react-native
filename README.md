# Gestion de stock — Application mobile

Application de gestion de stock pour un entrepôt fictif, réalisée avec React Native, Expo et TypeScript. Une API Django REST Framework permet de consulter les produits, de modifier leurs informations et d'enregistrer les entrées et sorties de stock. Les données sont conservées dans une base SQLite côté serveur.

## Fonctionnalités

- Liste des produits : nom, catégorie, quantité, seuil et indicateur de stock.
- Recherche par nom ou référence et filtre par catégorie.
- Détail : référence, description, catégorie, quantité, seuil et dernière mise à jour.
- Création et modification des produits avec validation des champs.
- Entrées et sorties de stock ; refus d'une sortie supérieure au stock disponible.
- Résumé du nombre de produits, des ruptures et des stocks faibles.
- États de chargement, liste vide, erreurs réseau et possibilité de réessayer.

| État | Condition |
|---|---|
| 🔴 Rupture | Quantité = 0 |
| 🟡 Stock faible | 0 < quantité ≤ seuil |
| 🟢 Normal | Quantité > seuil |

Les ruptures ne sont pas comptées une seconde fois dans le nombre de produits en stock faible. Le graphique du tableau de bord et les notifications locales ne sont pas inclus dans cette version.

## Stack et versions

| Élément | Technologie / version |
|---|---|
| Mobile | React Native, Expo et TypeScript ; versions dans `mobile/package.json` |
| Navigation | React Navigation, navigateur Native Stack |
| État de l'interface | `useState` et hooks réutilisables |
| Backend | Python 3.10 ou supérieur compatible avec les dépendances ; Django 5.2.18 observé pendant le développement |
| API REST | Django REST Framework ; version figée dans `backend/requirements.txt` |
| Base de données | SQLite, fichier `backend/db.sqlite3` |

Les versions exactes des dépendances sont conservées dans `mobile/package-lock.json` et `backend/requirements.txt`. Node.js doit être compatible avec la version Expo du projet : le SDK 57 demande Node.js 22.13 ou supérieur ; les SDK 55 et 56 demandent au minimum Node.js 20.19. Voir la [matrice de compatibilité Expo](https://docs.expo.dev/versions/v57.0.0/).

## Organisation

Le dépôt contient deux dossiers au même niveau :

| Chemin | Rôle |
|---|---|
| `README.md` | Installation, lancement et choix techniques |
| `backend/manage.py` | Commandes Django |
| `backend/config/` | Configuration et routes principales |
| `backend/products/` | Modèle, serializers, vues, routes et migrations |
| `backend/requirements.txt` | Dépendances Python |
| `mobile/App.tsx` | Navigation entre les écrans |
| `mobile/src/screens/` | Liste, détail et formulaire |
| `mobile/src/components/` | Composants réutilisables |
| `mobile/src/hooks/` | Chargement et actualisation des données |
| `mobile/src/api.ts` | Appels HTTP à Django |
| `mobile/src/domain.ts` | Indicateurs de stock, filtres et validation |
| `mobile/src/types.ts` | Types TypeScript |
| `mobile/.env.example` | Exemple d'adresse de l'API |

## Prérequis

- Git, Python et Node.js avec npm.
- Expo Go sur un téléphone compatible avec le SDK du projet.
- Pour le mode USB Android : ADB et un câble permettant le transfert de données.

Les commandes suivantes sont prévues pour Linux / Ubuntu. Elles supposent que le terminal est ouvert à la racine du dépôt, sauf indication contraire.

## Installation du backend

Après avoir cloné le dépôt, ouvrir son dossier, puis :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate
```

`migrate` crée la base SQLite et applique les migrations incluses dans le dépôt. Aucun serveur PostgreSQL ou MySQL n'est nécessaire.

### Produits de démonstration

Depuis la racine, avec l'environnement Python actif, exécuter ce bloc :

```bash
python backend/manage.py shell <<'PY'
from products.models import Product

examples = [
    ("CLA-001", "Clavier Logitech", "Informatique", 12, 5),
    ("SOU-001", "Souris USB", "Informatique", 2, 3),
    ("CAB-001", "Câble HDMI", "Accessoires", 0, 4),
]

for reference, name, category, quantity, threshold in examples:
    Product.objects.get_or_create(
        reference=reference,
        defaults={
            "name": name,
            "category": category,
            "quantity": quantity,
            "alert_threshold": threshold,
        },
    )

print("Nombre de produits :", Product.objects.count())
PY
```

La commande peut être relancée sans créer de doublons. Elle ne réinitialise pas les produits déjà présents.

### Lancement

```bash
python backend/manage.py runserver 0.0.0.0:8000
```

Laisser ce terminal ouvert. Sur l'ordinateur, vérifier l'API à l'adresse [http://127.0.0.1:8000/api/products/](http://127.0.0.1:8000/api/products/).

## Installation du mobile

Dans un deuxième terminal, depuis la racine :

```bash
cd mobile
npm ci
cp .env.example .env
```

Si `.env` existe déjà, conserver ce fichier et modifier seulement l'adresse de l'API. La variable doit porter exactement le nom `EXPO_PUBLIC_API_URL`. Les variables `EXPO_PUBLIC_` sont intégrées à l'application : elles ne doivent pas contenir de secrets.

### Option A — Téléphone Android connecté par USB

Cette option permet de développer sans dépendre de la communication entre appareils sur le Wi-Fi.

Sur Ubuntu, installer ADB si nécessaire :

```bash
sudo apt update
sudo apt install adb
```

Activer les options développeur et le débogage USB sur Android, connecter le téléphone à l'ordinateur et accepter l'autorisation affichée sur le téléphone.

Dans un terminal de l'ordinateur :

```bash
adb devices
adb reverse tcp:8000 tcp:8000
adb reverse tcp:8081 tcp:8081
```

`adb devices` doit afficher le téléphone avec le statut `device`. Les redirections donnent accès aux deux services de l'ordinateur depuis les ports correspondants du téléphone.

Dans `mobile/.env` :

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Depuis `mobile/`, lancer Expo :

```bash
npx expo start --localhost --port 8081
```

Ouvrir le projet dans Expo Go avec le QR code. Si nécessaire, depuis un autre terminal :

```bash
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
```

Garder le câble branché. Relancer les commandes `adb reverse` si les redirections disparaissent après une reconnexion ou un redémarrage.

### Option B — Téléphone et ordinateur sur le même Wi-Fi

Identifier l'adresse IPv4 locale de l'ordinateur avec `hostname -I`. Par exemple, pour `192.168.1.31`, définir dans `mobile/.env` :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.31:8000/api
```

Dans `backend/config/settings.py`, ajouter cette adresse à `ALLOWED_HOSTS`, en conservant les adresses locales :

```python
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "192.168.1.31"]
```

Remplacer l'adresse d'exemple par celle de l'ordinateur utilisé. Django doit écouter sur `0.0.0.0:8000`, comme dans la commande de lancement ci-dessus. Depuis `mobile/` :

```bash
npx expo start --lan
```

Scanner le QR code avec Expo Go. Le téléphone doit pouvoir joindre les ports 8000 et 8081 de l'ordinateur ; vérifier le pare-feu et l'isolation des appareils si nécessaire.

### Comprendre les deux ports

| Port | Service |
|---|---|
| 8000 | API Django : produits et mouvements |
| 8081 | Serveur Expo / Metro : chargement de l'application |

Les deux services sont lancés dans des terminaux distincts et restent actifs pendant le développement. Après une modification de `.env`, redémarrer Expo et recharger l'application. Si Expo Go demande une connexion, utiliser le même compte dans Expo Go et dans le terminal avec `npx expo login`.

## API REST

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/api/products/` | Liste des produits |
| GET | `/api/products/{id}/` | Détail d'un produit |
| POST | `/api/products/` | Création |
| PATCH | `/api/products/{id}/` | Modification |
| POST | `/api/products/{id}/movements/` | Entrée ou sortie de stock |

La liste accepte aussi `?search=clavier` et `?category=Informatique`, combinables. La version mobile actuelle filtre la liste téléchargée directement dans l'interface.

Exemple de corps JSON pour une entrée :

```json
{
  "type": "in",
  "quantity": 3
}
```

Pour une sortie, utiliser `"type": "out"`. Une quantité invalide ou une sortie supérieure au stock retourne une erreur HTTP 400. Une référence déjà utilisée est refusée lors de la création ou de la modification.

## Choix techniques

- **Expo** simplifie le lancement et les essais de l'application React Native.
- **TypeScript** décrit les produits et les paramètres de navigation.
- **React Navigation** organise trois écrans : liste, détail et formulaire partagé entre création et modification.
- **Django REST Framework** centralise les validations et les opérations sur les données.
- **SQLite côté serveur** fournit une base SQL persistante dédiée au projet, simple à initialiser pour cet exercice. Les données ne sont pas simulées dans le mobile.
- **`useState`** suffit pour cette taille d'application. Les données sont rechargées quand un écran reprend le focus.
- **Composants réutilisables** pour les boutons, champs, cartes, erreurs et indicateurs ; boutons d'au moins 48 points de hauteur.

En modification, le formulaire mobile conserve la quantité actuelle : ses changements passent par les entrées et sorties. Le backend applique les mouvements directement en base avec une expression `F()`. Pour une sortie, la condition de stock suffisant et la diminution sont effectuées dans la même requête SQL.

## Vérifications

Vérification Django, depuis la racine avec l'environnement Python actif :

```bash
python backend/manage.py check
```

Vérification TypeScript, depuis `mobile/` :

```bash
npx tsc --noEmit
```

Si le dossier `mobile/tests/` fourni avec les sources mobiles est présent, les neuf tests unitaires peuvent être exécutés avec Node.js 22.13 ou supérieur, depuis `mobile/` :

```bash
node --experimental-strip-types --test tests/*.test.mjs
```

Ces tests couvrent les règles de stock, les quantités invalides, les filtres, le contrat HTTP et les erreurs. Les réponses réseau des tests unitaires sont contrôlées ; vérifier également le fonctionnement contre Django sur le téléphone.

Vérifications manuelles : création et modification, persistance après redémarrage du backend, références en double, champs obligatoires, entrée/sortie, sortie excessive, actualisation de la date et affichage d'une erreur quand le serveur est arrêté.

## Dépannage

- **API inaccessible** : vérifier que Django est toujours lancé et que l'adresse définie dans `.env` correspond au mode USB ou Wi-Fi choisi.
- **Erreur `DisallowedHost`** : vérifier `ALLOWED_HOSTS` dans Django.
- **Expo Go ne charge pas le projet** : vérifier le port 8081, le mode de lancement et la compatibilité du SDK avec Expo Go.
- **USB** : vérifier `adb devices` et `adb reverse --list`. Sur le téléphone, tester `http://127.0.0.1:8081/status` ; le résultat attendu est `packager-status:running`.
- **Cache Expo** : arrêter Expo puis relancer la commande du mode choisi en ajoutant `--clear`.

## Captures / démonstration

Les captures de l'application sur téléphone restent à ajouter avant l'envoi du dépôt pour évaluation. Prévoir au minimum une capture de la liste, du détail et du formulaire, ou une courte vidéo montrant un ajout et un mouvement de stock. Les placer dans `docs/captures/` et ajouter leurs liens ici.

## Fichiers à conserver dans le dépôt

Inclure les sources, les migrations Django, `backend/requirements.txt`, `mobile/package.json`, `mobile/package-lock.json`, `mobile/.env.example` et les captures. La base de développement est recréée avec les migrations et les produits de démonstration ci-dessus.

À la racine, prévoir les règles suivantes dans `.gitignore`, en complément des règles déjà présentes :

```gitignore
.venv/
venv/
__pycache__/
*.py[cod]
db.sqlite3
db.sqlite3-*
node_modules/
.expo/
.env
.env.*
!.env.example
dist/
dist-android/
```

Un fichier déjà suivi par Git n'est pas retiré du dépôt par l'ajout d'une règle dans `.gitignore` : vérifier les fichiers suivis avant publication.

## Périmètre

Cette version vise un exercice technique et un fonctionnement local. Elle ne fournit pas d'authentification, de gestion des rôles ni d'historique persistant des mouvements. Le lancement d'Expo et celui du backend sont deux étapes distinctes.
