const getAuthTypeFromHeader = (authorization) => {
	const parts = authorization.split(' ');

	return parts[0].toLowerCase();
};

const generatePolicy = (result, effect, resource) => {
	if (effect && resource) {
		return {
			principalId: result.accessKeyId,
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
			usageIdentifierKey: result.accessKeyId,
		};
	}

	return {
		principalId: result.accessKeyId,
		// No policy
	};
};

const getAccessKeysFromHeader = (authorization) => {
	const parts = authorization.split(' ');

	if (parts && parts.length && parts.length > 1) {
		const buf = Buffer.from(parts[1], 'base64');
		const plainAuth = buf.toString();

		return plainAuth.split(':');
	}

	throw new Error('Malformed authorization header');
};

/**
 * We need to pass X-Clarityhub-Organization as the bearer password when working on localhost
 *
 * @param {*} event
 */
module.exports.default = async function handler(event) {
	const authorization = event.headers.Authorization;

	try {
		if (!authorization) {
			return {
				statusCode: 402,
				message: 'Unauthenticated',
			};
		}

		const authType = getAuthTypeFromHeader(authorization);

		// Get organization id from user:pass
		const [accessKeyId, organizationId] = getAccessKeysFromHeader(authorization);

		switch (authType) {
		case 'basic':
			// AWS Cognito
			return generatePolicy({
				organizationId,
				accessKeyId,
			}, 'Allow', event.methodArn);
		case 'bearer':
		default:
			// Unknown auth type
			console.error('Malformed authorization header', authorization);
			throw new Error('Malformed authorization header');
		}
	} catch (err) {
		console.error(err);
		throw new Error('Something bad happened');
	}
};
