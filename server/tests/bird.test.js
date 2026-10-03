jest.mock('../services/cvService');
const request = require('supertest');
const app = require('../app');
const cvService = require('../services/cvService');
const Bird = require('../models/Bird');
const h = require('./helpers');

beforeAll(h.connect);
afterAll(h.close);
beforeEach(h.clear);

const attach = (req) => req.attach('image', Buffer.from('fake-image-bytes'), { filename: 'bird.jpg', contentType: 'image/jpeg' });

describe('Bird identification', () => {
  test('returns species, confidence and matching bird record on success', async () => {
    await Bird.create({ commonName: 'Indian Peafowl', conservationStatus: 'Least Concern' });
    cvService.identifyBird.mockResolvedValue({ species: 'Indian Peafowl', confidence: 0.94, status: 'success' });
    const { token } = await h.makeUser();
    const res = await attach(request(app).post('/api/birds/identify').set(h.bearer(token)));
    expect(res.status).toBe(200);
    expect(res.body.data.species).toBe('Indian Peafowl');
    expect(res.body.data.bird.commonName).toBe('Indian Peafowl');
  });

  test('never claims a species on low confidence', async () => {
    cvService.identifyBird.mockResolvedValue({ species: 'Indian Peafowl', confidence: 0.21, status: 'low_confidence' });
    const { token } = await h.makeUser();
    const res = await attach(request(app).post('/api/birds/identify').set(h.bearer(token)));
    expect(res.body.data.species).toBeNull();
    expect(res.body.data.status).toBe('low_confidence');
  });

  test('requires auth and an image', async () => {
    expect((await request(app).post('/api/birds/identify')).status).toBe(401);
    const { token } = await h.makeUser();
    expect((await request(app).post('/api/birds/identify').set(h.bearer(token))).status).toBe(400);
  });

  test('rejects non-image uploads', async () => {
    const { token } = await h.makeUser();
    const res = await request(app).post('/api/birds/identify').set(h.bearer(token))
      .attach('image', Buffer.from('hello'), { filename: 'x.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});
