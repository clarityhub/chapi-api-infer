module.exports = function httpSuccessHandler() {
	return {
		after(event, next) {
			event.response = {
				statusCode: 200,
				body: JSON.stringify(event.response),
			};

			next();
		},
	};
};
