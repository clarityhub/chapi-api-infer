import { Controller } from '@clarityhub/harmony-server';
import omit from 'lodash.omit';

import InferModelsController from './InferModelsController';
import EmbedController from './EmbedController';
import { fromChunks } from '../utilities/fileChunks';
import similarity from '../utilities/similarity';

const findLargestIndexes = (arr, n) => {
	const outp = [];
	for (let i = 0; i < arr.length; i++) {
		outp.push(i);
	}

	outp.sort((a, b) => {
		if (arr[b] - arr[a] < 0) {
			return -1;
		}
		return 1;
	});

	return outp.slice(0, n);
};

export default class PredictModelController extends Controller {
	async predictLabels({
		organizationId, modelId, utterances, threshold, version, authorization,
	}) {
		const embedController = new EmbedController(this.ioc);
		const allUtterances = await embedController.embed({ utterances, authorization });

		let labelVersion = version;

		// if a is NOT specified, load in the model to find the latest version
		if (!labelVersion) {
			const controller = new InferModelsController(this.ioc);
			const item = await controller.get({ organizationId, modelId });

			labelVersion = item.latestVersion;
		}

		// Load in that version of labels
		const params = {
			TableName: process.env.inferModelLabelsTableName,
			KeyConditionExpression: 'modelId = :modelId',
			FilterExpression: 'organizationId = :organizationId and version = :version',
			ExpressionAttributeValues: {
				':modelId': modelId,
				':version': labelVersion,
				':organizationId': organizationId,
			},
			ConsistentRead: true,
		};

		const result = await this.ioc.DynamoDB.query(params).promise();

		const labels = result.Items;

		// create vector
		const vector = labels.map(u => u.exemplarUtterance.embedding);

		const similarityMatrix = await similarity(
			allUtterances.map(u => u.embedding),
			vector
		);

		return similarityMatrix.map((similarityVector, utteranceIndex) => {
			const utterance = allUtterances[utteranceIndex];
			const topThreeIndexes = findLargestIndexes(similarityVector, 3);

			return {
				utterance: utterance.utterance,
				similar: topThreeIndexes.filter((similarityIndex) => {
					const utteranceSimilarity = similarityVector[similarityIndex];

					if (utteranceSimilarity < threshold) {
						return false;
					}
					return true;
				}).map((similarityIndex) => {
					const utteranceSimilarity = similarityVector[similarityIndex];
					const similarityLabel = labels[similarityIndex];

					return {
						similarity: utteranceSimilarity,
						label: similarityLabel.label,
						userLabel: similarityLabel.userLabel,
					};
				}),
			};
		});
	}

	async predictSimilar({
		organizationId, modelId, utterances, threshold = 0.6, authorization,
	}) {
		const embedController = new EmbedController(this.ioc);
		const allUtterances = await embedController.embed({ utterances, authorization });

		// Read from DynamoDB
		const controller = new InferModelsController(this.ioc);
		const item = await controller.get({ organizationId, modelId }, true);

		let fileContents = await Promise.all(item.fileShards.map(async (fileShard) => {
			const data = await this.ioc.S3.getObject({
				Bucket: process.env.inferModelBucketName,
				Key: fileShard.filename,
			}).promise();

			const s = data.Body.toString();

			return JSON.parse(s);
		}));

		// create vector
		const data = fromChunks(fileContents);
		const vector = data.map(u => u.embedding);
		// Free up some memory
		fileContents = null;

		const similarityMatrix = await similarity(
			allUtterances.map(u => u.embedding),
			vector
		);

		return similarityMatrix.map((similarityVector, utteranceIndex) => {
			const utterance = allUtterances[utteranceIndex];
			const topThreeIndexes = findLargestIndexes(similarityVector, 3);

			return {
				utterance: utterance.utterance,
				similar: topThreeIndexes.filter((similarityIndex) => {
					const utteranceSimilarity = similarityVector[similarityIndex];

					if (utteranceSimilarity < threshold) {
						return false;
					}
					return true;
				}).map((similarityIndex) => {
					const utteranceSimilarity = similarityVector[similarityIndex];
					const similarityUtterance = data[similarityIndex];

					return {
						...omit(similarityUtterance, 'embedding'),
						similarity: utteranceSimilarity,
					};
				}),
			};
		});
	}
}
