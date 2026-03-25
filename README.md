# LibraryConnect

Plateforme web de gestion de bibliothèque en ligne permettant aux bibliothécaires de gérer leur catalogue et aux utilisateurs d'emprunter et réserver des livres.

---

## Table des matières

1. [Aperçu](#aperçu)
2. [Fonctionnalités](#fonctionnalités)
3. [Technologies](#technologies)
4. [DevOps](#devops)
5. [Installation](#installation)
6. [Utilisation](#utilisation)
7. [Auth Credentials](#auth-credentials)
8. [API Documentation](#api-documentation)
9. [Tests](#tests)
10. [Structure du projet](#structure-du-projet)
11. [Auteurs](#auteurs)
12. [Contexte académique](#contexte-académique)
13. [Licence](#licence)

---

## Aperçu

LibraryConnect est une application full-stack de gestion de bibliothèque en ligne. Elle permet :
- Aux **visiteurs** de consulter et rechercher des livres sans compte
- Aux **utilisateurs** d'emprunter, réserver des livres et suivre leurs points
- Aux **administrateurs** de gérer le catalogue, valider les inscriptions et suivre les retards

---

## Fonctionnalités

### Visiteur
- Parcourir le catalogue de livres
- Rechercher par titre, auteur ou catégorie
- Consulter le détail d'un livre

### Utilisateur inscrit
- Créer un compte (email / mot de passe)
- Emprunter un livre disponible (14 jours)
- Réserver un livre indisponible → notifié quand disponible
- Ajouter des livres à la wishlist
- Voir l'historique des emprunts
- Système de points :
  - Retour à temps : **+10 points**
  - Retour en retard : **-5 points par jour**
  - À 0 points : **suspension 15 jours**

### Administrateur
- Ajouter, modifier, supprimer des livres
- Valider les inscriptions des utilisateurs
- Voir tous les emprunts en cours
- Notifications pour les emprunts en retard et retours tardifs
- Ajuster manuellement les points d'un utilisateur
- Consulter l'historique des points de chaque utilisateur

---

## Technologies

### Frontend
| Technologie | Version |
|------------|---------|
| React | 19 |
| Vite | 7 |
| Tailwind CSS | 4 |
| Axios | - |
| React Router | v7 |

### Backend
| Technologie | Version |
|------------|---------|
| Node.js | 20 |
| Express.js | 5 |
| MySQL2 | 3 |
| JWT (jsonwebtoken) | 9 |
| bcryptjs | 3 |
| Nodemailer | 8 |
| Swagger UI | 5 |

### Base de données
| Technologie | Version |
|------------|---------|
| MySQL | 8.0 |

---

## DevOps

L'application est entièrement containerisée avec Docker Compose :

| Container | Image | Port |
|-----------|-------|------|
| library-frontend | node:20-alpine | 5173 |
| library-backend | node:20-alpine | 3000 |
| library-mysql | mysql:8.0 | 3307 |
| library-phpmyadmin | phpmyadmin | 8081 |

La base de données est initialisée automatiquement au premier lancement via les scripts SQL dans `db/init/`.

---

## Installation

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Étapes

**1. Cloner le projet**
```bash
git clone https://github.com/AichaLheimeur/library-management.git
cd library-management
```

**2. Lancer l'application**
```bash
docker-compose up --build
```

**3. Ouvrir dans le navigateur**
```
http://localhost:5173
```

> La base de données, les livres et le compte admin sont créés automatiquement.

**Arrêter l'application**
```bash
docker-compose down
```

---

## Utilisation

### Démarrage rapide

1. Ouvrir `http://localhost:5173`
2. Se connecter en tant qu'admin (voir credentials ci-dessous)
3. Ou créer un compte utilisateur via "Register"
4. L'admin doit valider le compte depuis le panel Admin → Users

### Flux principal utilisateur
1. Register → attendre validation admin
2. Login → Dashboard
3. Catalog → Borrow (livre disponible) ou Reserve (livre indisponible)
4. Dashboard → Return (retour du livre)
5. Points mis à jour automatiquement

---

## Auth Credentials

### Administrateur
| Email | Mot de passe |
|-------|-------------|
| test@test.com | 123456 |

### phpMyAdmin
| URL | Utilisateur | Mot de passe |
|-----|------------|-------------|
| http://localhost:8081 | root | root |

---

## API Documentation

La documentation Swagger est disponible après lancement à :
```
http://localhost:3000/api-docs
```

### Endpoints principaux

#### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Créer un compte |
| POST | /api/auth/login | Se connecter |

#### Books
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/books | Liste des livres |
| GET | /api/books/:id | Détail d'un livre |
| POST | /api/books | Ajouter un livre (admin) |
| PUT | /api/books/:id | Modifier un livre (admin) |
| DELETE | /api/books/:id | Supprimer un livre (admin) |

#### Loans
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/loans | Emprunter un livre |
| GET | /api/loans/me | Mes emprunts |
| PUT | /api/loans/:id/return | Retourner un livre |

#### Reservations
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/reservations | Réserver un livre |
| GET | /api/reservations/me | Mes réservations |
| DELETE | /api/reservations/:id | Annuler une réservation |

#### Users (Admin)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/users | Liste des utilisateurs |
| PUT | /api/users/:id/validate | Valider un utilisateur |
| PUT | /api/users/:id/points | Ajuster les points (0-200) |
| GET | /api/users/:id/points-log | Historique des points |

#### Notifications (Admin)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /api/notifications | Liste des notifications |
| PUT | /api/notifications/:id/read | Marquer une notification comme lue |
| PUT | /api/notifications/read-all | Marquer toutes comme lues |

---

## Tests

Les tests unitaires et d'intégration sont écrits avec **Jest** et **Supertest**.

```bash
cd backend
npm test
```

### Résultats
```
Test Suites: 5 passed, 5 total
Tests:       51 passed, 51 total
```

### Fichiers de test
```
backend/tests/
├── auth.test.js         # Tests d'authentification (register, login, me)
├── books.test.js        # Tests gestion des livres (CRUD, admin)
├── loans.test.js        # Tests emprunts (borrow, return, points)
├── reservations.test.js # Tests réservations (ACTIVE, READY, cancel)
└── points.test.js       # Tests système de points et suspension
```

### Ce qui est testé
- Inscription, connexion, profil utilisateur
- CRUD livres (admin uniquement)
- Emprunt, retour à temps (+10 pts), retour en retard (-5×jours pts)
- Réservation, annulation (ACTIVE et READY)
- Ajustement manuel des points (admin)
- Historique des points
- Suspension à 0 points (bloquer l'emprunt)

---

## Structure du projet

```
library-management/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration DB
│   │   ├── controllers/     # Logique métier
│   │   ├── middlewares/     # Auth JWT, isAdmin
│   │   ├── routes/          # Routes API
│   │   └── docs/            # Swagger
│   ├── tests/               # Tests Jest
│   ├── Dockerfile
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── api/             # Instance Axios
│   │   ├── components/      # Composants réutilisables
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Pages React
│   │   └── routes/          # Routes protégées
│   ├── public/
│   │   └── favicon.png
│   └── Dockerfile
├── db/
│   └── init/
│       ├── 001_schema.sql   # Schéma de la base de données
│       ├── 002_books_seed.sql # Données initiales
│       └── 003_update_descriptions.sql
├── postman/                 # Collection Postman
├── docker-compose.yml
└── README.md
```

---

## Auteurs

- **Aicha Lheimeur** — Développement full-stack

---

## Contexte académique

Ce projet a été développé dans le cadre d'un cours de développement web full-stack. Il répond aux spécifications du cahier des charges suivant :

- Backend : Node.js
- Frontend : React
- Base de données : MySQL
- Gestion des emprunts, réservations et pénalités (système de points)
- Déploiement via Docker

---

## Licence

Projet académique - INSSET 2026
