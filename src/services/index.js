/* eslint-disable-next-line import/no-extraneous-dependencies */
const AWS = require('aws-sdk');
const Bottle = require('bottlejs');

const RawDynamoDB = require('./RawDynamoDB');
const DynamoDB = require('./DynamoDB');
const NLPLambda = require('./NLPLambda');
const NLP = require('./NLP');
const S3 = require('./S3');
const Report = require('./Report');
const Logger = require('./Logger');

module.exports.createBottle = function createBottle() {
	const bottle = new Bottle();

	bottle.factory('AWS', () => AWS);
	bottle.service('RawDynamoDB', RawDynamoDB, 'AWS');
	bottle.service('DynamoDB', DynamoDB, 'AWS', 'RawDynamoDB');
	bottle.service('NLPLambda', NLPLambda, 'AWS');
	bottle.service('NLP', NLP, 'NLPLambda');
	bottle.service('S3', S3, 'AWS');
	bottle.service('Report', Report);
	bottle.service('Logger', Logger);

	return bottle;
};

module.exports.bootstrapBottle = async function bootstrapBottle(/* bottle */) {
	// Bootstrap any connections that must exist

};
