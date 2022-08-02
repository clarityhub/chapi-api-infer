const toxicity = require('../../src/routes/infer').default;

describe('POST /infer/models', () => {
	test('Create Model', async () => {
		const MOCK_EVENT = {
			path: '/infer/models',
			body: '{"utterances": ["You smell"]}',
			requestContext: {
				httpMethod: 'POST',
			},
		};

		const response = await new Promise((resolve, reject) => {
			toxicity(MOCK_EVENT, {}, (err, res) => {
				if (err) {
					reject(err);
				}
				resolve(res);
			});
		});

		console.log(response);

		expect(response.statusCode).toEqual(200);
		expect(typeof response.body).toBe('string');
	});
});
