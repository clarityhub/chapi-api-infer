module.exports = function DynamoDB(AWS, RawDynamoDB) {
	return new AWS.DynamoDB.DocumentClient({
		service: RawDynamoDB,
	});
};
