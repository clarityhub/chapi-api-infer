/* eslint-disable import/prefer-default-export */

module.exports.UnauthorizedError = class UnauthorizedError extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, UnauthorizedError);
		this.statusCode = 401;
	}
};

module.exports.ValidationError = class ValidationError extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, ValidationError);
		this.statusCode = 422;
	}
};

module.exports.InvalidRequestError = class InvalidRequestError extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, InvalidRequestError);
		this.statusCode = 400;
	}
};

module.exports.NotFoundError = class NotFoundError extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, NotFoundError);
		this.statusCode = 404;
	}
};


module.exports.InternalServerError = class InternalServerError extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, InternalServerError);
		this.statusCode = 500;
	}
};
