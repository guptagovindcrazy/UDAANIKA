const request = require('supertest');
const app = require('../app');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.close);
beforeEach(h.clear);

describe('Auth', () => {
  const creds = { name: 'Asha', email: 'asha@test.dev', password: 'Password123' };

  test('registers a user, hashes password and never returns it', async () => {
    const res = await request(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.role).toBe('user');
  });

  test('ignores a role sent at registration (no self-made admins)', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...creds, role: 'admin' });
    expect(res.body.data.user.role).toBe('user');
  });

  test('rejects duplicate email and weak password', async () => {
    await request(app).post('/api/auth/register').send(creds);
    expect((await request(app).post('/api/auth/register').send(creds)).status).toBe(409);
    expect((await request(app).post('/api/auth/register').send({ ...creds, email: 'b@test.dev', password: '123' })).status).toBe(400);
  });

  test('logs in with valid credentials and rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send(creds);
    const ok = await request(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
    expect(ok.status).toBe(200);
    const bad = await request(app).post('/api/auth/login').send({ email: creds.email, password: 'wrongpass1' });
    expect(bad.status).toBe(401);
  });

  test('protects /me and admin routes', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer junk')).status).toBe(401);
    const { token } = await h.makeUser('user');
    expect((await request(app).get('/api/auth/me').set(h.bearer(token))).status).toBe(200);
    expect((await request(app).get('/api/admin/dashboard').set(h.bearer(token))).status).toBe(403);
  });
});
