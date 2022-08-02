const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

/* eslint-disable-next-line security/detect-non-literal-fs-filename */
const readFileAsync = promisify(fs.readFile);

const SCHEMA_PATH = path.join(process.cwd(), 'docs', 'swagger.yml');

module.exports.default = async function handler() {
	try {
		const schemaContents = await readFileAsync(SCHEMA_PATH, { encoding: 'utf8' });

		return {
			statusCode: 200,
			headers: {
				'content-type': 'text/yaml',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Credentials': true,
			},
			body: schemaContents,
		};
	} catch (err) {
		console.error(SCHEMA_PATH);
		return {
			statusCode: 404,
			headers: {
				'content-type': 'text/yaml',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Credentials': true,
			},
			body: 'message:\n  Could not read swagger.yml',
		};
	}
};
