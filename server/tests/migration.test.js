const request = require('supertest');
const app = require('../app');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.close);
beforeEach(h.clear);

const obs = (extra = {}) => ({ species: 'Bar-headed Goose', location: 'Pong Dam Lake', observationDate: '2026-01-15', count: 40, direction: 'S', ...extra });

describe('Migration observations', () => {
  test('creates an observation and exposes it publicly', async () => {
    const { token } = await h.makeUser();
    const res = await request(app).post('/api/migrations').set(h.bearer(token)).send(obs());
    expect(res.status).toBe(201);
    const list = await request(app).get('/api/migrations');
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
  });

  test('validates input and requires auth to submit', async () => {
    const { token } = await h.makeUser();
    expect((await request(app).post('/api/migrations').send(obs())).status).toBe(401);
    expect((await request(app).post('/api/migrations').set(h.bearer(token)).send(obs({ observationDate: 'yesterday-ish' }))).status).toBe(400);
    expect((await request(app).post('/api/migrations').set(h.bearer(token)).send(obs({ latitude: 200 }))).status).toBe(400);
  });

  test('analytics aggregates species and months', async () => {
    const { token } = await h.makeUser();
    await request(app).post('/api/migrations').set(h.bearer(token)).send(obs());
    await request(app).post('/api/migrations').set(h.bearer(token)).send(obs({ observationDate: '2026-02-03', count: 10 }));
    const res = await request(app).get('/api/migrations/analytics');
    expect(res.body.data.totalObservations).toBe(2);
    expect(res.body.data.totalBirds).toBe(50);
    expect(res.body.data.topSpecies[0]._id).toBe('Bar-headed Goose');
    expect(res.body.data.byMonth).toHaveLength(2);
  });

  test('only the owner or an admin can delete', async () => {
    const owner = await h.makeUser();
    const other = await h.makeUser();
    const id = (await request(app).post('/api/migrations').set(h.bearer(owner.token)).send(obs())).body.data.observation._id;
    expect((await request(app).delete(`/api/migrations/${id}`).set(h.bearer(other.token))).status).toBe(403);
    expect((await request(app).delete(`/api/migrations/${id}`).set(h.bearer(owner.token))).status).toBe(200);
  });
});
