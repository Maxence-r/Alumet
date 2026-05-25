const assert = require('assert');
const request = require('supertest');

process.env.TOKEN = process.env.TOKEN || 'test-token-secret';

const app = require('../app');

const csrfHeader = async agent => {
    const response = await agent.get('/api/csrf-token').expect(200);
    assert.ok(response.body.csrfToken);
    return { 'x-csrf-token': response.body.csrfToken };
};

(async () => {
    const agent = request.agent(app);

    await request(app).get('/login').expect(200);
    await request(app).get('/api/does-not-exist').expect(404).expect(response => {
        assert.strictEqual(response.body.code, 'NOT_FOUND');
    });

    await agent.post('/api/accounts').send({}).expect(403).expect(response => {
        assert.strictEqual(response.body.code, 'INVALID_CSRF_TOKEN');
    });

    const headers = await csrfHeader(agent);
    await agent.patch('/api/invitations/not-an-id').set(headers).send({ status: 'accepted' }).expect(422).expect(response => {
        assert.strictEqual(response.body.code, 'VALIDATION_ERROR');
    });

    await agent.get('/api/openapi.json').expect(200).expect(response => {
        assert.strictEqual(response.body.openapi, '3.0.0');
    });

    process.exit(0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
