module.exports = function NLP(AWS) {
	const config = {
		region: process.env.REGION,
	};

	if (process.env.IS_OFFLINE) {
		config.endpoint = new AWS.Endpoint(process.env.AWS_INFER_ENDPOINT);
		config.accessKeyId = 'DEFAULT_ACCESS_KEY';
		config.secretAccessKey = '';
	}

	return new AWS.Lambda(config);
};
