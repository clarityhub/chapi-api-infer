import middy from 'middy';
import {
	cors,
	httpHeaderNormalizer,
} from 'middy/middlewares';

import LabelsController from '../controllers/LabelsController';

import { NotFoundError } from '../utilities/errors';

import wrapBottle from '../middleware/wrapBottle';
import httpSuccessHandler from '../middleware/httpSuccessHandler';
import httpErrorHandler from '../middleware/httpErrorHandler';
import bodyValidator from '../middleware/bodyValidator';
import bodyParser from '../middleware/bodyParser';
import getUsername from '../middleware/getUsername';

import labelsGetResponseSchema from '../../schemas/labelsGetResponse.json';
import labelGetResponseSchema from '../../schemas/labelGetResponse.json';
import labelPutRequestSchema from '../../schemas/labelPutRequest.json';

/**
 * Get Labels
 */
export const getAll = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { modelId } = event.pathParameters;
	const { version } = event.queryStringParameters || {};

	const controller = new LabelsController(context.bottle.container);

	const labels = await controller.getAll({
		organizationId,
		modelId,
		version: version || undefined,
	});

	return {
		items: labels,
	};
})
	.use(cors())
	.use(wrapBottle())
	.use(bodyValidator({
		outputSchema: labelsGetResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

/**
 * Get Label
 */
export const get = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { modelId, labelId } = event.pathParameters;

	const controller = new LabelsController(context.bottle.container);

	const label = await controller.get({
		organizationId,
		modelId,
		labelId,
	});

	if (!label) {
		throw new NotFoundError('Label not found');
	}

	return {
		item: label,
	};
})
	.use(cors())
	.use(bodyParser())
	.use(wrapBottle())
	.use(bodyValidator({
		outputSchema: labelGetResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

/**
 * Update Label
 */
export const edit = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { userLabel } = event.body;
	const { modelId, labelId } = event.pathParameters;

	const controller = new LabelsController(context.bottle.container);

	const model = await controller.update({
		organizationId,
		modelId,
		labelId,
		userLabel,
	});

	return {
		item: model,
	};
})
	.use(cors())
	.use(bodyParser())
	.use(httpHeaderNormalizer())
	.use(wrapBottle())
	.use(getUsername())
	.use(bodyValidator({
		inputSchema: labelPutRequestSchema,
		outputSchema: labelGetResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());
