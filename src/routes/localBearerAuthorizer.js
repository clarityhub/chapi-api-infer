import middy from 'middy';
import { httpHeaderNormalizer } from 'middy/middlewares';
import { createBottle, bootstrapBottle } from '../services';
import { InvalidRequestError } from '../utilities/errors';

const getAuthTypeFromHeader = (authorization) => {
	const parts = authorization.split(' ');

	return parts[0].toLowerCase();
};

const generatePolicy = (result, effect, resource) => {
	if (effect && resource) {
		return {
			principalId: result.principalId,
			policyDocument: {
				Version: '2012-10-17',
				Statement: [{
					Action: 'execute-api:Invoke',
					Effect: effect,
					Resource: resource,
				}],
			},
			context: {
				organizationId: result.organizationId,
			},
			usageIdentifierKey: result.principalId,
		};
	}

	return {
		principalId: result.principalId,
		// No policy
	};
};

async function cognitoPolicy({
	organizationId, methodArn,
}) {
	if (!organizationId) {
		throw new InvalidRequestError('You must provide an X-ClarityHub-Organization header');
	}

	const userId = 'offline_username';

	return generatePolicy({
		principalId: userId,
		organizationId,
	}, 'Allow', methodArn);
}

export default middy(async (event) => {
	const organizationId = event.headers['X-Clarityhub-Organization'];

	console.log('CALLING ALL JAN MICHEAL VINCIENTS', organizationId);
	const authorization = event.headers.Authorization;
	const { methodArn } = event;

	try {
		const bottle = createBottle();
		await bootstrapBottle(bottle);

		if (!authorization) {
			return {
				statusCode: 402,
				message: 'Unauthenticated',
			};
		}

		const authType = getAuthTypeFromHeader(authorization);

		switch (authType) {
		case 'bearer':
			// AWS Cognito
			return await cognitoPolicy({
				organizationId,
				authorization,
				methodArn,
			}, bottle);
		case 'basic':
		default:
			// Unknown auth type
			console.error('Malformed authorization header', authorization);
			throw new Error('Malformed authorization header');
		}
	} catch (err) {
		console.error(err);
		throw new Error('Something bad happened');
	}
})
	.use(httpHeaderNormalizer());
