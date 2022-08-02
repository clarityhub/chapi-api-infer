import { Controller } from '@clarityhub/harmony-server';
import shortid from 'shortid';
import uuid from 'uuid';

import InferModelsController from './InferModelsController';
import EmbedController from './EmbedController';
import TopicsController from './TopicsController';
import optics from '../utilities/optics';
import { fromChunks } from '../utilities/fileChunks';
import { NotFoundError } from '../utilities/errors';

export default class TrainModelsController extends Controller {
	async train({
		organizationId, modelId, utterances, authorization,
	}) {
		// XXX Turn this check into middleware that we can add onto all endpoints
		// check that the model exists
		const params = {
			TableName: process.env.inferModelsTableName,
			ConsistentRead: true,
			Key: {
				organizationId,
				modelId,
			},
		};

		const data = await this.ioc.DynamoDB.get(params).promise();

		if (!data.Item) {
			throw new NotFoundError('Model not found');
		}

		const embedController = new EmbedController(this.ioc);
		const allUtterances = await embedController.embed({ utterances, authorization });

		// Save to S3
		const now = Date.now();
		const timestamp = new Date();
		const filename = `${organizationId}/${modelId}/${timestamp.toISOString()}.json`;
		await this.ioc.S3.putObject({
			Bucket: process.env.inferModelBucketName,
			Key: filename,
			Body: Buffer.from(JSON.stringify(allUtterances)),
		}).promise();

		// Save the file shard to the model
		await this.ioc.DynamoDB.update({
			TableName: process.env.inferModelsTableName,
			Key: {
				organizationId,
				modelId,
			},
			ReturnValues: 'ALL_NEW',
			UpdateExpression: 'set #latestVersion = :latestVersion, #fileShards = list_append(if_not_exists(#fileShards, :empty_list), :fileShard)',
			ExpressionAttributeNames: {
				'#latestVersion': 'latestVersion',
				'#fileShards': 'fileShards',
			},
			ExpressionAttributeValues: {
				':latestVersion': now,
				':fileShard': [{
					filename,
					createdAt: now,
				}],
				':empty_list': [],
			},
		}).promise();

		// Add all utterances to dynamo
		// utterance, filename it belongs to
		await Promise.all(allUtterances.map(async (utterance) => {
			const utteranceParams = {
				TableName: process.env.inferModelUtternacesTableName,
				Item: {
					organizationId,
					modelId,
					utteranceId: shortid.generate(),
					utterance: utterance.utterance,
					meta: utterance.meta || {},
					filename,
					createdAt: now,
				},
			};

			await this.ioc.DynamoDB.put(utteranceParams).promise();
		}));

		const items = await this.rebuild({
			organizationId, modelId, now, authorization,
		});

		return items;
	}

	async rebuild({
		organizationId, modelId, now, authorization,
	}) {
		// Read from DynamoDB
		const controller = new InferModelsController(this.ioc);
		const item = await controller.get({ organizationId, modelId }, true);

		if (!item) {
			this.ioc.Logger.error(`
                Something strange happened.

                We triggered a rebuild of:
                    {
                        "organizationId": "${organizationId}",
                        "modelId": "${modelId}"
                    }
                But no model was found.
            `);
			return;
		}

		// Load shard from S3
		if (!(item.fileShards instanceof Array)) {
			this.ioc.Logger.error(`
                Something strange happened.

                We triggered a rebuild of:
                    {
                        "organizationId": "${organizationId}",
                        "modelId": "${modelId}"
                    }
                But no fileShards in that model were found.
            `);
			return;
		}

		let fileContents = await Promise.all(item.fileShards.map(async (fileShard) => {
			const data = await this.ioc.S3.getObject({
				Bucket: process.env.inferModelBucketName,
				Key: fileShard.filename,
			}).promise();

			const s = data.Body.toString();

			return JSON.parse(s);
		}));
		const utterances = fromChunks(fileContents);
		// Free up some memory
		fileContents = null;

		// Cluster
		// create vector
		const vector = utterances.map(u => u.embedding);
		const clusters = await optics(vector);

		// Infer labels
		const labelClusters = await Promise.all(clusters.map(async (cluster) => {
			const clusterUtterances = [];

			cluster.forEach((index) => {
				clusterUtterances.push(utterances[index]);
			});

			const possibleUtterance = clusterUtterances.find(u => u.label);
			let label = 'unknown';
			let userLabel = null;

			if (possibleUtterance && possibleUtterance.label) {
				userLabel = possibleUtterance.label;
			}

			const topicController = new TopicsController(this.ioc);
			const joined = [clusterUtterances.map(u => u.utterance).join(' ')];
			const results = await topicController.topics({ utterances: joined, authorization });

			([label] = results[0].topics);

			// If we still don't have a label, just label it unknown
			if (!label) {
				label = 'unknown';
			}

			return {
				label,
				userLabel,
				indices: cluster,
				utterances: clusterUtterances,
			};
		}));

		// Save labels
		// Store a few examplar utterances
		// Add utterances ids to each label
		const items = await Promise.all(labelClusters.map(async (cluster) => {
			const label = {
				organizationId,
				modelId,
				labelId: uuid.v4(),
				// XXX pick a better examplar
				exemplarUtterance: cluster.utterances[0],
				numberOfUtterances: cluster.utterances.length,
				label: cluster.label,
				userLabel: cluster.userLabel,
				createdAt: now,
				version: now,
			};

			const params = {
				TableName: process.env.inferModelLabelsTableName,
				Item: label,
			};

			await this.ioc.DynamoDB.put(params).promise();

			const { embedding, ...rest } = label.exemplarUtterance;

			return {
				...label,
				exemplarUtterance: rest,
			};
		}));


		// return labels
		return items;
	}
}
