const request = require('supertest');
const app = require('../app');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.close);
beforeEach(h.clear);

describe('Admin & stats', () => {
  test('dashboard returns totals and charts for admins', async () => {
    const { token: userToken } = await h.makeUser();
    const { token: adminToken } = await h.makeUser('admin');
    await request(app).post('/api/rescues').set(h.bearer(userToken)).send(h.rescuePayload({ birdSpecies: 'Indian Peafowl' }));
    const res = await request(app).get('/api/admin/dashboard').set(h.bearer(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.totals.activeRescues).toBe(1);
    expect(res.body.data.totals.speciesIdentified).toBe(1);
    expect(res.body.data.charts.statusDistribution[0]._id).toBe('Pending');
  });

  test('public stats work without auth', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.rescueRequests).toBe(0);
  });

  test('admin cannot delete users who have rescue records', async () => {
    const { user, token } = await h.makeUser();
    const { token: adminToken } = await h.makeUser('admin');
    await request(app).post('/api/rescues').set(h.bearer(token)).send(h.rescuePayload());
    expect((await request(app).delete(`/api/admin/users/${user._id}`).set(h.bearer(adminToken))).status).toBe(409);
  });
});
