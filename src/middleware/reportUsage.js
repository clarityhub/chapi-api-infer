module.exports = function reportUsage() {
	return {
		async before({ context }) {
			// mark the time
			context.__start = Date.now();
		},
		async after({ event, context }) {
			const { organizationId } = event.requestContext.authorizer;
			const after = Date.now();

			const milliseconds = after - context.__start;

			const payload = {
				key: 'dogsdayafternoon',
				organizationId,
				method: context.functionName,
				memory: context.memoryLimitInMB,
				milliseconds,
			};

			try {
				await context.bottle.container.Report.send(payload);
			} catch (e) {
				// Don't worry about it
				context.bottle.container.Logger.error(e);
			}
		},
	};
};
