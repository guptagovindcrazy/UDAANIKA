const request = require('supertest');
const app = require('../app');
const Volunteer = require('../models/Volunteer');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.close);
beforeEach(h.clear);

const create = (token, extra) => request(app).post('/api/rescues').set(h.bearer(token)).send(h.rescuePayload(extra));
const setStatus = (id, token, status, note) => request(app).patch(`/api/rescues/${id}/status`).set(h.bearer(token)).send({ status, note });

describe('Rescue creation', () => {
  test('user creates a Pending rescue with a request id and history', async () => {
    const { token } = await h.makeUser();
    const res = await create(token);
    expect(res.status).toBe(201);
    expect(res.body.data.rescue.status).toBe('Pending');
    expect(res.body.data.rescue.requestId).toMatch(/^UDN-/);
    expect(res.body.data.rescue.statusHistory).toHaveLength(1);
  });

  test('validates required fields and requires auth', async () => {
    const { token } = await h.makeUser();
    expect((await request(app).post('/api/rescues').set(h.bearer(token)).send({})).status).toBe(400);
    expect((await request(app).post('/api/rescues').send(h.rescuePayload())).status).toBe(401);
  });

  test('volunteers cannot create reports', async () => {
    const { token } = await h.makeVolunteer();
    expect((await create(token)).status).toBe(403);
  });
});

describe('Rescue workflow', () => {
  test('volunteer accepts and completes a rescue end to end', async () => {
    const { token: userToken } = await h.makeUser();
    const vol = await h.makeVolunteer();
    const id = (await create(userToken)).body.data.rescue._id;

    const assign = await request(app).patch(`/api/rescues/${id}/assign`).set(h.bearer(vol.token));
    expect(assign.status).toBe(200);
    expect(assign.body.data.rescue.status).toBe('Assigned');

    for (const status of ['In Progress', 'Rescued', 'Completed']) {
      const res = await setStatus(id, vol.token, status, `now ${status}`);
      expect(res.status).toBe(200);
    }
    const detail = await request(app).get(`/api/rescues/${id}`).set(h.bearer(userToken));
    expect(detail.body.data.rescue.status).toBe('Completed');
    expect(detail.body.data.rescue.completedAt).toBeTruthy();
    expect(detail.body.data.rescue.statusHistory.length).toBe(5);
    expect((await Volunteer.findById(vol.profile._id)).rescuesCompleted).toBe(1);
  });

  test('blocks invalid transitions and role violations', async () => {
    const { token: userToken } = await h.makeUser();
    const { token: adminToken } = await h.makeUser('admin');
    const id = (await create(userToken)).body.data.rescue._id;

    expect((await setStatus(id, adminToken, 'Completed')).status).toBe(400); // Pending -> Completed
    expect((await setStatus(id, userToken, 'Rescued')).status).toBe(403); // users may only cancel
  });

  test('an unassigned volunteer cannot update someone else\'s rescue', async () => {
    const { token: userToken } = await h.makeUser();
    const owner = await h.makeVolunteer();
    const other = await h.makeVolunteer();
    const id = (await create(userToken)).body.data.rescue._id;
    await request(app).patch(`/api/rescues/${id}/assign`).set(h.bearer(owner.token));
    expect((await setStatus(id, other.token, 'In Progress')).status).toBe(403);
  });

  test('admin can assign a specific volunteer; cannot assign twice', async () => {
    const { token: userToken } = await h.makeUser();
    const { token: adminToken } = await h.makeUser('admin');
    const vol = await h.makeVolunteer();
    const id = (await create(userToken)).body.data.rescue._id;

    const res = await request(app).patch(`/api/rescues/${id}/assign`).set(h.bearer(adminToken)).send({ volunteerId: vol.profile._id });
    expect(res.status).toBe(200);
    const again = await request(app).patch(`/api/rescues/${id}/assign`).set(h.bearer(adminToken)).send({ volunteerId: vol.profile._id });
    expect(again.status).toBe(400);
  });

  test('users cannot read other users\' rescues; lists are role-scoped', async () => {
    const a = await h.makeUser();
    const b = await h.makeUser();
    const id = (await create(a.token)).body.data.rescue._id;
    expect((await request(app).get(`/api/rescues/${id}`).set(h.bearer(b.token))).status).toBe(403);
    const list = await request(app).get('/api/rescues').set(h.bearer(b.token));
    expect(list.body.data.total).toBe(0);
    expect((await request(app).get('/api/rescues/not-an-id').set(h.bearer(a.token))).status).toBe(400);
  });
});

describe('Release and filters', () => {
  test('a volunteer can release an assigned rescue back to the pool', async () => {
    const { token: userToken } = await h.makeUser();
    const first = await h.makeVolunteer();
    const second = await h.makeVolunteer();
    const id = (await create(userToken)).body.data.rescue._id;
    await request(app).patch(`/api/rescues/${id}/assign`).set(h.bearer(first.token));

    const released = await setStatus(id, first.token, 'Pending', 'Cannot reach in time');
    expect(released.status).toBe(200);
    expect(released.body.data.rescue.assignedVolunteer).toBeUndefined();
    expect((await setStatus(id, first.token, 'In Progress')).status).toBe(403); // no longer theirs
    expect((await request(app).patch(`/api/rescues/${id}/assign`).set(h.bearer(second.token))).status).toBe(200);
  });

  test('status filter accepts a comma separated list', async () => {
    const { token: userToken } = await h.makeUser();
    const { token: adminToken } = await h.makeUser('admin');
    const vol = await h.makeVolunteer();
    await create(userToken);
    const second = (await create(userToken)).body.data.rescue._id;
    await request(app).patch(`/api/rescues/${second}/assign`).set(h.bearer(vol.token));

    const total = async (q) => (await request(app).get(`/api/rescues?status=${q}`).set(h.bearer(adminToken))).body.data.total;
    expect(await total('Pending,Assigned')).toBe(2);
    expect(await total('Assigned')).toBe(1);
    expect(await total('Completed')).toBe(0);
  });
});
