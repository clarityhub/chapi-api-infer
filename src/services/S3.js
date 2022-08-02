module.exports = function S3(AWS) {
	const config = {
		s3ForcePathStyle: true,
	};

	if (process.env.IS_OFFLINE) {
		config.endpoint = new AWS.Endpoint('http://localhost:8100');
		config.region = 'localhost';
		config.accessKeyId = 'S3RVER';
		config.secretAccessKey = 'S3RVER';
	}

	return new AWS.S3(config);
};
