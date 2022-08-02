import uuid from 'uuid';
import { Controller } from '@clarityhub/harmony-server';
import omit from 'lodash.omit';

/**
 * CRUD operations for Infer Models
 */
export default class InferModelsController extends Controller {
	async getAll({ organizationId }) {
		const params = {
			TableName: process.env.inferModelsTableName,
			KeyConditionExpression: 'organizationId = :organizationId',
			ExpressionAttributeValues: {
				':organizationId': organizationId,
			},
		};

		const data = await this.ioc.DynamoDB.query(params).promise();

		return data.Items.maps((item) => {
			return omit(item, ['fileShards']);
		});
	}

	/**
	 * Consistent read.
	 * @param {*} param0
	 */
	async get({ organizationId, modelId }, isInternal) {
		const params = {
			TableName: process.env.inferModelsTableName,
			ConsistentRead: true,
			Key: {
				organizationId,
				modelId,
			},
		};

		const data = await this.ioc.DynamoDB.get(params).promise();

		if (isInternal) {
			return data.Item;
		}

		return omit(data.Item, ['fileShards']);
	}

	async create({
		organizationId, userId, name, description,
	}) {
		const createdAt = Date.now();
		const modifiedAt = Date.now();
		const modelId = uuid.v4();

		const params = {
			TableName: process.env.inferModelsTableName,
			Item: {
				organizationId,
				modelId,
				name,
				description: description || null, // Allow empty strings
				creatorUserId: userId,
				createdAt,
				modifiedAt,
			},
		};

		await this.ioc.DynamoDB.put(params).promise();

		return {
			organizationId,
			modelId,
			name,
			description,
			creatorUserId: userId,
			createdAt,
			modifiedAt,
		};
	}

	async edit({
		organizationId, modelId, name, description,
	}) {
		const params = {
			TableName: process.env.inferModelsTableName,
			Key: {
				organizationId,
				modelId,
			},
			ConditionExpression: 'organizationId = :organizationId and modelId = :modelId',
			UpdateExpression: 'set #name = :name, description = :description, modifiedAt = :modifiedAt',
			ExpressionAttributeNames: {
				'#name': 'name',
			},
			ExpressionAttributeValues: {
				':organizationId': organizationId,
				':modelId': modelId,
				':name': name,
				':description': description || null, // Allow empty strings
				':modifiedAt': Date.now(),
			},
			ReturnValues: 'ALL_NEW',
		};

		const data = await this.ioc.DynamoDB.update(params).promise();

		return omit(data.Attributes, ['fileShards']);
	}

	async delete({ organizationId, modelId }) {
		this.ioc.Logger.info(`Deleting model modelId:${modelId}, organizationId:${organizationId}`);

		const params = {
			TableName: process.env.inferModelsTableName,
			Key: {
				organizationId,
				modelId,
			},
			ReturnValues: 'ALL_OLD',
		};

		const item = await this.ioc.DynamoDB.delete(params).promise();

		if (!item.Attributes) {
			return item.Attributes;
		}

		this.ioc.Logger.info('Deleting model', item.Attributes);

		if (item.Attributes.fileShards) {
			this.ioc.Logger.info(`Deleting file shards for modelId:${modelId}`);

			await Promise.all(item.Attributes.fileShards.map(async (fileShard) => {
				const data = await this.ioc.S3.deleteObject({
					Bucket: process.env.inferModelBucketName,
					Key: fileShard.filename,
				}).promise();

				return data;
			}));
		}

		// Delete labels
		// Get labels and then delete each one
		const paramsLabels = {
			TableName: process.env.inferModelLabelsTableName,
			KeyConditionExpression: 'modelId = :modelId',
			FilterExpression: 'organizationId = :organizationId',
			ExpressionAttributeValues: {
				':modelId': modelId,
				':organizationId': organizationId,
			},
		};

		const labels = await this.ioc.DynamoDB.query(paramsLabels).promise();

		if (labels.Items && labels.Items.length > 0) {
			this.ioc.Logger.info(`Deleting labels for modelId:${modelId}`);

			await Promise.all(labels.Items.map(async (label) => {
				const paramLabel = {
					TableName: process.env.inferModelLabelsTableName,
					Key: {
						modelId: label.modelId,
						labelId: label.labelId,
					},
				};

				await this.ioc.DynamoDB.delete(paramLabel).promise();
			}));
		}

		return omit(item.Attributes, ['fileShards']);
	}
}
