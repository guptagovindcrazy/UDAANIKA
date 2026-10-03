const request = require('supertest');
const app = require('../app');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.close);
beforeEach(h.clear);

describe('Volunteers', () => {
  test('a user registers as volunteer and is upgraded to the volunteer role', async () => {
    const { token } = await h.makeUser();
    const res = await request(app).post('/api/volunteers').set(h.bearer(token))
      .send({ serviceArea: 'Delhi NCR', specialization: 'Raptors, Waterbirds' });
    expect(res.status).toBe(201);
    expect(res.body.data.volunteer.specialization).toEqual(['Raptors', 'Waterbirds']);
    expect(res.body.data.volunteer.verificationStatus).toBe('pending');
    const me = await request(app).get('/api/auth/me').set(h.bearer(token));
    expect(me.body.data.user.role).toBe('volunteer');
    expect((await request(app).post('/api/volunteers').set(h.bearer(token)).send({ serviceArea: 'X' })).status).toBe(409);
  });

  test('volunteer updates availability; others cannot', async () => {
    const mine = await h.makeVolunteer();
    const other = await h.makeVolunteer();
    const ok = await request(app).patch(`/api/volunteers/${mine.profile._id}/availability`).set(h.bearer(mine.token)).send({ availability: 'busy' });
    expect(ok.body.data.volunteer.availability).toBe('busy');
    const denied = await request(app).patch(`/api/volunteers/${mine.profile._id}/availability`).set(h.bearer(other.token)).send({ availability: 'offline' });
    expect(denied.status).toBe(403);
  });

  test('only admins can verify volunteers or list them', async () => {
    const vol = await h.makeVolunteer();
    const { token: adminToken } = await h.makeUser('admin');
    const self = await request(app).put(`/api/volunteers/${vol.profile._id}`).set(h.bearer(vol.token)).send({ verificationStatus: 'rejected' });
    expect(self.body.data.volunteer.verificationStatus).toBe('verified'); // ignored for non-admins
    expect((await request(app).get('/api/volunteers').set(h.bearer(vol.token))).status).toBe(403);
    expect((await request(app).get('/api/volunteers').set(h.bearer(adminToken))).body.data.total).toBe(1);
  });
});
