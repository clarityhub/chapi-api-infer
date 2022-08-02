const request = require('request');

module.exports = function NLP(/* NLPLambda */) {
	return {
		embed(data, { authorization }) {
			return new Promise((resolve, reject) => {
				request(`${process.env.AWS_INFER_ENDPOINT}/embed`, {
					method: 'post',
					body: data,
					json: true,
					headers: {
						Authorization: authorization,
					},
				}, (err, res, body) => {
					if (err) {
						reject(err);
					}

					resolve(body);
				});
			});

			// TODO One day, we should invoke the lambda directly instead of
			// going over HTTPS. In order to do that, we need some special Lambdas
			// in the NLP service that trust direct calls since it won't go through
			// authorization again like the HTTPs call.

			// return NLPLambda.invoke({
			// 	FunctionName: 'embed',
			// 	InvocationType: 'RequestResponse',
			// 	Payload: data,
			// }).promise();
		},
		topics(data, { authorization }) {
			return new Promise((resolve, reject) => {
				request(`${process.env.AWS_INFER_ENDPOINT}/topics`, {
					method: 'post',
					body: data,
					json: true,
					headers: {
						Authorization: authorization,
					},
				}, (err, res, body) => {
					if (err) {
						reject(err);
					}

					resolve(body);
				});
			});

			// TODO One day, we should invoke the lambda directly instead of
			// going over HTTPS. In order to do that, we need some special Lambdas
			// in the NLP service that trust direct calls since it won't go through
			// authorization again like the HTTPs call.

			// return NLPLambda.invoke({
			// 	FunctionName: 'embed',
			// 	InvocationType: 'RequestResponse',
			// 	Payload: data,
			// }).promise();
		},
	};
};
