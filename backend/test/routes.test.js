const request = require('supertest');
const app = require('../index');

describe('GET /latest', () => {
  it('returns 200 and object', async () => {
    const res = await request(app).get('/latest');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body).toBe('object');
  });
});
