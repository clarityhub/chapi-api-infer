/* eslint-disable-next-line import/no-extraneous-dependencies */
import AWS from 'aws-sdk';

const tryGetEmail = (user) => {
	if (user) {
		if (user.UserAttributes) {
			const entry = user.UserAttributes.find(attr => attr.Name === 'email');

			if (entry) {
				return entry.Value;
			}
		}
	}

	return null;
};

export default function getUsername() {
	return {
		async before({ event, context }) {
			if (!event.requestContext.identity) {
				// No username is available
				return;
			}

			if (process.env.STAGE === 'local') {
				context.email = 'fake@email.com';
				context.username = 'offline_username';
				return;
			}

			if (!event.requestContext.identity.cognitoAuthenticationProvider) {
				// No username is available
				return;
			}

			const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
			const userSub = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1];

			const params = {
				Username: userSub,
				UserPoolId: process.env.USER_POOL_ID,
			};

			const user = await new Promise((resolve, reject) => {
				cognitoidentityserviceprovider.adminGetUser(params, (err, data) => {
					if (err) {
						reject(err);
					}

					resolve(data);
				});
			});

			context.email = tryGetEmail(user);
			context.username = user.Username;
		},
	};
}
