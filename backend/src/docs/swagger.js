const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Library Management API",
    version: "1.0.0",
    description:
      "API REST pour la gestion d'une bibliothèque en ligne. Permet aux utilisateurs d'emprunter et réserver des livres, et aux administrateurs de gérer le catalogue.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Serveur local",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Entrez votre token JWT : Bearer <token>",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentification et gestion des comptes" },
    { name: "Books", description: "Catalogue de livres" },
    { name: "Loans", description: "Emprunts de livres" },
    { name: "Reservations", description: "Réservations de livres" },
    { name: "Users", description: "Gestion des utilisateurs (admin)" },
    { name: "Notifications", description: "Notifications admin" },
  ],
  paths: {
    // ─────────────────────────────────────────
    // AUTH
    // ─────────────────────────────────────────
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Créer un compte utilisateur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "user@example.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Compte créé avec succès",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Email déjà utilisé ou champs manquants" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Se connecter",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "user@example.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Connexion réussie",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          401: { description: "Identifiants invalides" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Voir son profil (utilisateur connecté)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profil de l'utilisateur connecté",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        email: { type: "string" },
                        role: { type: "string", enum: ["USER", "ADMIN"] },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Token manquant ou invalide" },
        },
      },
    },

    // ─────────────────────────────────────────
    // BOOKS
    // ─────────────────────────────────────────
    "/api/books": {
      get: {
        tags: ["Books"],
        summary: "Lister tous les livres (public)",
        responses: {
          200: {
            description: "Liste des livres",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      title: { type: "string" },
                      author: { type: "string" },
                      category: { type: "string" },
                      description: { type: "string" },
                      total_quantity: { type: "integer" },
                      available_quantity: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Books"],
        summary: "Ajouter un livre (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "author"],
                properties: {
                  title: { type: "string", example: "Clean Code" },
                  author: { type: "string", example: "Robert C. Martin" },
                  category: { type: "string", example: "Informatique" },
                  description: { type: "string" },
                  total_quantity: { type: "integer", example: 3 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Livre créé" },
          400: { description: "Champs requis manquants" },
          403: { description: "Accès réservé aux admins" },
        },
      },
    },
    "/api/books/{id}": {
      get: {
        tags: ["Books"],
        summary: "Voir un livre par son ID (public)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Détails du livre" },
          404: { description: "Livre introuvable" },
        },
      },
      put: {
        tags: ["Books"],
        summary: "Modifier un livre (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  total_quantity: { type: "integer" },
                  available_quantity: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Livre mis à jour" },
          404: { description: "Livre introuvable" },
          403: { description: "Accès réservé aux admins" },
        },
      },
      delete: {
        tags: ["Books"],
        summary: "Supprimer un livre (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Livre supprimé" },
          404: { description: "Livre introuvable" },
          403: { description: "Accès réservé aux admins" },
        },
      },
    },

    // ─────────────────────────────────────────
    // LOANS
    // ─────────────────────────────────────────
    "/api/loans": {
      post: {
        tags: ["Loans"],
        summary: "Emprunter un livre",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["book_id"],
                properties: {
                  book_id: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Livre emprunté avec succès" },
          400: { description: "Livre non disponible" },
          404: { description: "Livre introuvable" },
        },
      },
      get: {
        tags: ["Loans"],
        summary: "Voir tous les emprunts (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Liste de tous les emprunts" },
          403: { description: "Accès réservé aux admins" },
        },
      },
    },
    "/api/loans/me": {
      get: {
        tags: ["Loans"],
        summary: "Voir mes emprunts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Liste des emprunts de l'utilisateur connecté" },
        },
      },
    },
    "/api/loans/{id}/return": {
      put: {
        tags: ["Loans"],
        summary: "Retourner un livre",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de l'emprunt",
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Livre retourné. Points mis à jour automatiquement (+10 à temps, -5×jours en retard).",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Book returned on time! You earned +10 points." },
                    points: { type: "integer", example: 110 },
                    pointsChange: { type: "integer", example: 10 },
                    blocked: { type: "boolean", example: false },
                    blockedUntil: { type: "string", format: "date-time", nullable: true },
                  },
                },
              },
            },
          },
          400: { description: "Livre déjà retourné" },
          404: { description: "Emprunt introuvable" },
        },
      },
    },

    // ─────────────────────────────────────────
    // RESERVATIONS
    // ─────────────────────────────────────────
    "/api/reservations": {
      post: {
        tags: ["Reservations"],
        summary: "Réserver un livre (seulement si indisponible)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["book_id"],
                properties: {
                  book_id: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Réservation créée" },
          400: {
            description:
              "Livre disponible (emprunter directement) ou réservation déjà active",
          },
          404: { description: "Livre introuvable" },
        },
      },
      get: {
        tags: ["Reservations"],
        summary: "Voir toutes les réservations (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Liste de toutes les réservations" },
          403: { description: "Accès réservé aux admins" },
        },
      },
    },
    "/api/reservations/me": {
      get: {
        tags: ["Reservations"],
        summary: "Voir mes réservations",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Liste des réservations de l'utilisateur connecté",
          },
        },
      },
    },
    "/api/reservations/{id}": {
      delete: {
        tags: ["Reservations"],
        summary: "Annuler une réservation",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID de la réservation",
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Réservation annulée" },
          400: { description: "Réservation déjà annulée ou complétée" },
          404: { description: "Réservation introuvable" },
        },
      },
    },

    // ─────────────────────────────────────────
    // USERS (ADMIN)
    // ─────────────────────────────────────────
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Voir tous les utilisateurs (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Liste de tous les utilisateurs avec points" },
          403: { description: "Accès réservé aux admins" },
        },
      },
    },
    "/api/users/{id}/validate": {
      put: {
        tags: ["Users"],
        summary: "Valider un compte utilisateur (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Compte validé" },
          404: { description: "Utilisateur introuvable" },
        },
      },
    },
    "/api/users/{id}/points": {
      put: {
        tags: ["Users"],
        summary: "Ajuster les points d'un utilisateur (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  points: { type: "integer", example: 50, minimum: 0, maximum: 200 },
                  reason: { type: "string", example: "Admin adjustment" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Points mis à jour. Suspension levée si points > 0." },
          404: { description: "Utilisateur introuvable" },
        },
      },
    },
    "/api/users/{id}/points-log": {
      get: {
        tags: ["Users"],
        summary: "Historique des points d'un utilisateur (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Liste des changements de points avec raisons" },
          404: { description: "Utilisateur introuvable" },
        },
      },
    },

    // ─────────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────────
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Voir toutes les notifications (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Liste des notifications (retards et retours tardifs)" },
          403: { description: "Accès réservé aux admins" },
        },
      },
    },
    "/api/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Marquer une notification comme lue (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Notification marquée comme lue" },
        },
      },
    },
    "/api/notifications/read-all": {
      put: {
        tags: ["Notifications"],
        summary: "Marquer toutes les notifications comme lues (admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Toutes les notifications marquées comme lues" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
