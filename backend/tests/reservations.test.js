const request = require("supertest");
const app = require("../index");
const pool = require("../src/config/db");

let adminToken;
let userToken;
let unavailableBookId; // available_quantity = 0 → réservation possible
let availableBookId;   // available_quantity > 0 → réservation bloquée
let reservationId;

const userEmail = `restest_${Date.now()}@test.com`;
const userPassword = "TestPassword123!";

beforeAll(async () => {
  // Connexion admin
  const adminRes = await request(app).post("/api/auth/login").send({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  adminToken = adminRes.body.token;

  // Création + connexion d'un user test
  await request(app).post("/api/auth/register").send({
    email: userEmail,
    password: userPassword,
  });
  const userRes = await request(app).post("/api/auth/login").send({
    email: userEmail,
    password: userPassword,
  });
  userToken = userRes.body.token;

  // Livre 1 : stock = 0 (total_quantity = 0 → available_quantity = 0)
  const unavailableRes = await request(app)
    .post("/api/books")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: "Unavailable Book",
      author: "Test Author",
      total_quantity: 0,
    });
  unavailableBookId = unavailableRes.body.id;

  // Livre 2 : stock > 0
  const availableRes = await request(app)
    .post("/api/books")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: "Available Book",
      author: "Test Author",
      total_quantity: 2,
    });
  availableBookId = availableRes.body.id;
});

afterAll(async () => {
  // La suppression des livres cascade les réservations (ON DELETE CASCADE)
  if (unavailableBookId) {
    await pool.query("DELETE FROM books WHERE id = ?", [unavailableBookId]);
  }
  if (availableBookId) {
    await pool.query("DELETE FROM books WHERE id = ?", [availableBookId]);
  }
  await pool.query("DELETE FROM users WHERE email = ?", [userEmail]);
});

// ─────────────────────────────────────────
// POST /api/reservations
// ─────────────────────────────────────────
describe("POST /api/reservations", () => {
  it("should return 401 without token", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .send({ book_id: unavailableBookId });

    expect(res.statusCode).toBe(401);
  });

  it("should return 404 for a non-existent book", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: 99999 });

    expect(res.statusCode).toBe(404);
  });

  it("should return 400 if book is available (borrow instead)", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: availableBookId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Book is available, you can borrow it directly");
  });

  it("should create a reservation when book is unavailable", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: unavailableBookId });

    expect(res.statusCode).toBe(201);
    expect(res.body.reservation_id).toBeDefined();

    reservationId = res.body.reservation_id;
  });

  it("should return 400 on duplicate active reservation", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ book_id: unavailableBookId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("You already have an active reservation for this book");
  });
});

// ─────────────────────────────────────────
// GET /api/reservations/me
// ─────────────────────────────────────────
describe("GET /api/reservations/me", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/reservations/me");

    expect(res.statusCode).toBe(401);
  });

  it("should return 200 and an array of reservations", async () => {
    const res = await request(app)
      .get("/api/reservations/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────
// GET /api/reservations (admin)
// ─────────────────────────────────────────
describe("GET /api/reservations", () => {
  it("should return 403 with a user token", async () => {
    const res = await request(app)
      .get("/api/reservations")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  it("should return 200 and all reservations with admin token", async () => {
    const res = await request(app)
      .get("/api/reservations")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────
// DELETE /api/reservations/:id
// ─────────────────────────────────────────
describe("DELETE /api/reservations/:id", () => {
  it("should return 401 without token", async () => {
    const res = await request(app).delete(`/api/reservations/${reservationId}`);

    expect(res.statusCode).toBe(401);
  });

  it("should return 404 for a non-existent reservation", async () => {
    const res = await request(app)
      .delete("/api/reservations/99999")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
  });

  it("should cancel an active reservation", async () => {
    const res = await request(app)
      .delete(`/api/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Reservation cancelled successfully");
  });

  it("should return 400 when cancelling an already cancelled reservation", async () => {
    const res = await request(app)
      .delete(`/api/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Only active reservations can be cancelled");
  });
});
