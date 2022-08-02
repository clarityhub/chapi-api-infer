/* eslint-disable import/no-extraneous-dependencies, security/detect-non-literal-fs-filename */
const fs = require('fs');
const path = require('path');
const YamlParser = require('serverless/lib/classes/YamlParser');
const parse = require('serverless/lib/utils/fs/parse');
const yaml = require('js-yaml');
const OpenAPISchemaValidator = require('openapi-schema-validator').default;

const BLACKLIST_KEYS = [
	'$schema',
	'definitions',
];

const validator = new OpenAPISchemaValidator({
	version: 3,
});

const parser = new YamlParser({
	utils: {
		readFileSync: (filePath) => {
			const contents = fs.readFileSync(filePath);

			return parse(filePath, contents);
		},
	},
});

/**
 * Swagger is opinionated and a PoS, so we need to mutate JSON Schema to
 * swagger schemas, because swagger schemas are a ExTeNdEd SuPeRsEt.
 *
 * @param {} schema
 */
const mutateSchema = (schema) => {
	// Traverse the tree and fix any detected anomalies
	Object.keys(schema).forEach((k) => {
		if (k === 'type' && Array.isArray(schema[k])) {
			schema.oneOf = schema[k].map((type) => {
				return { type };
			});
			delete schema[k];
		} else if (typeof schema[k] === 'object') {
			mutateSchema(schema[k]);
		}
	});
};

/**
 * Warning: mutates apiDocs param
 *
 * @param {*} apiDocs
 */
function filterSchema(apiDocs) {
	Object.keys(apiDocs.components.schemas).forEach((key) => {
		const schema = apiDocs.components.schemas[key];

		Object.keys(schema).forEach((k) => {
			if (BLACKLIST_KEYS.includes(k)) {
				delete apiDocs.components.schemas[key][k];
			}
		});

		mutateSchema(schema);
	});

	return apiDocs;
}

parser.parse(path.resolve(__dirname, 'api.yml')).then((result) => {
	const filtered = filterSchema(result);

	const validation = validator.validate(filtered);

	if (validation.errors && validation.errors.length > 0) {
		console.error('[!] OpenAPI 3.0 schema failed to validate');
		console.error(validation.errors);
		process.exit();
	}

	const doc = yaml.safeDump(filtered);

	fs.writeFileSync(path.resolve(__dirname, 'swagger.yml'), doc, { encoding: 'utf8' });
}).catch(err => console.error(err));
