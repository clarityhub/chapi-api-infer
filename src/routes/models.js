import middy from 'middy';
import {
	cors,
	httpHeaderNormalizer,
} from 'middy/middlewares';

import InferModelsController from '../controllers/InferModelsController';

import { NotFoundError } from '../utilities/errors';

import wrapBottle from '../middleware/wrapBottle';
import httpSuccessHandler from '../middleware/httpSuccessHandler';
import httpErrorHandler from '../middleware/httpErrorHandler';
import bodyValidator from '../middleware/bodyValidator';
import bodyParser from '../middleware/bodyParser';
import getUsername from '../middleware/getUsername';

import modelCreateRequestSchema from '../../schemas/modelCreateRequest.json';
import modelCreateResponseSchema from '../../schemas/modelCreateResponse.json';
import modelsGetResponseSchema from '../../schemas/modelsGetResponse.json';
import modelGetResponseSchema from '../../schemas/modelGetResponse.json';
import modelPutRequestSchema from '../../schemas/modelPutRequest.json';
import modelPutResponseSchema from '../../schemas/modelPutResponse.json';

/**
 * Get Models
 * GET /models
 */
export const getAll = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;

	const controller = new InferModelsController(context.bottle.container);

	const models = await controller.getAll({
		organizationId,
	});

	return {
		items: models,
	};
})
	.use(cors())
	.use(wrapBottle())
	.use(bodyValidator({
		outputSchema: modelsGetResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

/**
 * Get Model
 * GET /models/{modelId}
 */
export const get = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { modelId } = event.pathParameters;

	const controller = new InferModelsController(context.bottle.container);

	const model = await controller.get({
		organizationId,
		modelId,
	});

	if (!model) {
		throw new NotFoundError('Model not found');
	}

	return {
		item: model,
	};
})
	.use(cors())
	.use(bodyParser())
	.use(wrapBottle())
	.use(bodyValidator({
		outputSchema: modelGetResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

/**
 * Create an Infer Model
 * POST /models
 * Header: X-Clarityhub-Organization: orgId
 */
export const create = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { name, description } = event.body;

	const controller = new InferModelsController(context.bottle.container);

	const model = await controller.create({
		organizationId,
		userId: context.username || 'Access Key',
		name,
		description,
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
		inputSchema: modelCreateRequestSchema,
		outputSchema: modelCreateResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

/**
 * Update Infer Model
 * PUT /models/{modelId}
 * Header: X-Clarityhub-Organization: orgId
 */
export const edit = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { name, description } = event.body;
	const { modelId } = event.pathParameters;

	const controller = new InferModelsController(context.bottle.container);

	const model = await controller.edit({
		organizationId,
		modelId,
		name,
		description,
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
		inputSchema: modelPutRequestSchema,
		outputSchema: modelPutResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

/**
 * Delete Access key
 * DELETE /accounts/access-keys/:accessKeyId
 * Header: X-Clarityhub-Organization: orgId
 */
export const del = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { modelId } = event.pathParameters;

	const controller = new InferModelsController(context.bottle.container);

	const item = await controller.delete({
		organizationId,
		modelId,
	});

	if (!item) {
		throw new NotFoundError('Model not found');
	}

	return {
		item,
	};
})
	.use(cors())
	.use(bodyParser())
	.use(wrapBottle())
	.use(bodyValidator({
		outputSchema: modelGetResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());
