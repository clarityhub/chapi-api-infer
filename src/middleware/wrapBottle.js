const { createBottle, bootstrapBottle } = require('../services');

module.exports = function wrapBottle() {
	return {
		async before({ context }) {
			const bottle = createBottle();

			await bootstrapBottle(bottle);

			context.bottle = bottle;
		},
	};
};
