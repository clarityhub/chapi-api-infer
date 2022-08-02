import middy from 'middy';
import {
	cors,
	httpHeaderNormalizer,
} from 'middy/middlewares';

import TrainModelController from '../controllers/TrainModelController';
import PredictModelController from '../controllers/PredictModelController';

import wrapBottle from '../middleware/wrapBottle';
import httpSuccessHandler from '../middleware/httpSuccessHandler';
import httpErrorHandler from '../middleware/httpErrorHandler';
import bodyValidator from '../middleware/bodyValidator';
import bodyParser from '../middleware/bodyParser';
import reportUsage from '../middleware/reportUsage';

import trainModelRequestSchema from '../../schemas/trainModelPostRequest.json';
import trainModelResponseSchema from '../../schemas/trainModelPostResponse.json';
import predictLabelRequestSchema from '../../schemas/predictLabelPostRequest.json';
import predictLabelResponseSchema from '../../schemas/predictLabelPostResponse.json';
import predictSimilarRequestSchema from '../../schemas/predictSimilarPostRequest.json';
import predictSimilarResponseSchema from '../../schemas/predictSimilarPostResponse.json';

/**
 * Update Infer Model
 * PUT /models/{modelId}
 * Header: X-Clarityhub-Organization: orgId
 */
export const train = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { Authorization: authorization } = event.headers;
	const { utterances } = event.body;
	const { modelId } = event.pathParameters;

	const controller = new TrainModelController(context.bottle.container);

	const items = await controller.train({
		organizationId,
		modelId,
		utterances,
		authorization,
	});


	return {
		items,
	};
})
	.use(cors())
	.use(reportUsage())
	.use(bodyParser())
	.use(httpHeaderNormalizer())
	.use(wrapBottle())
	.use(bodyValidator({
		inputSchema: trainModelRequestSchema,
		outputSchema: trainModelResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());

export const predictLabels = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { Authorization: authorization } = event.headers;
	const { utterances } = event.body;
	const { modelId } = event.pathParameters;
	const { threshold, version } = event.queryStringParameters || {};

	const controller = new PredictModelController(context.bottle.container);

	const items = await controller.predictLabels({
		organizationId,
		modelId,
		utterances,
		threshold: threshold ? parseFloat(threshold) : undefined,
		version: version || undefined,
		authorization,
	});

	return {
		items,
	};
})
	.use(cors())
	.use(reportUsage())
	.use(bodyParser())
	.use(httpHeaderNormalizer())
	.use(wrapBottle())
	.use(bodyValidator({
		inputSchema: predictLabelRequestSchema,
		outputSchema: predictLabelResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());


export const predictSimilar = middy(async (event, context) => {
	const { organizationId } = event.requestContext.authorizer;
	const { Authorization: authorization } = event.headers;
	const { utterances } = event.body;
	const { modelId } = event.pathParameters;
	const { threshold } = event.queryStringParameters || {};

	const controller = new PredictModelController(context.bottle.container);

	const items = await controller.predictSimilar({
		organizationId,
		modelId,
		utterances,
		threshold: threshold ? parseFloat(threshold) : undefined,
		authorization,
	});

	return {
		items,
	};
})
	.use(cors())
	.use(reportUsage())
	.use(bodyParser())
	.use(httpHeaderNormalizer())
	.use(wrapBottle())
	.use(bodyValidator({
		inputSchema: predictSimilarRequestSchema,
		outputSchema: predictSimilarResponseSchema,
		ajvOptions: {
			allErrors: true,
		},
	}))
	.use(httpErrorHandler())
	.use(httpSuccessHandler());
