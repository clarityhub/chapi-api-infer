import { Controller } from '@clarityhub/harmony-server';
import omit from 'lodash.omit';
import { NotFoundError } from '../utilities/errors';

/**
 * Labels controller
 */
export default class LabelsController extends Controller {
	async getAll({ organizationId, modelId, version }) {
		const params = {
			TableName: process.env.inferModelLabelsTableName,
			KeyConditionExpression: 'modelId = :modelId',
			FilterExpression: `organizationId = :organizationId ${version ? 'and version = :version' : ''}`,
			ExpressionAttributeValues: {
				':modelId': modelId,
				':organizationId': organizationId,
				...(version ? {
					':version': parseInt(version, 10),
				} : {}),
			},
		};

		const data = await this.ioc.DynamoDB.query(params).promise();

		// Don't send the embeddings
		return data.Items.map((item) => {
			return {
				...item,
				exemplarUtterance: {
					...omit(item.exemplarUtterance, ['embedding']),
				},
			};
		});
	}

	async get({ organizationId, modelId, labelId }) {
		const params = {
			TableName: process.env.inferModelLabelsTableName,
			Key: {
				labelId,
				modelId,
			},
			FilterConditionExpression: 'organizationId = :organizationId',
			ExpressionAttributeValues: {
				':organizationId': organizationId,
			},
		};

		const data = await this.ioc.DynamoDB.get(params).promise();

		if (!data.Item) {
			return data.Item;
		}

		// Don't send the embeddings
		return {
			...data.Item,
			exemplarUtterance: {
				...omit(data.Item.exemplarUtterance, ['embedding']),
			},
		};
	}

	async update({
		organizationId, modelId, labelId, userLabel,
	}) {
		const params = {
			TableName: process.env.inferModelLabelsTableName,
			Key: {
				labelId,
				modelId,
			},
			FilterConditionExpression: 'organizationId = :organizationId',
			ExpressionAttributeValues: {
				':organizationId': organizationId,
			},
		};

		const data = await this.ioc.DynamoDB.get(params).promise();

		if (!data.Item) {
			throw new NotFoundError('Label not found');
		}

		const updateParams = {
			TableName: process.env.inferModelLabelsTableName,
			Key: {
				labelId,
				modelId,
			},
			ConditionExpression: 'organizationId = :organizationId',
			UpdateExpression: 'set userLabel = :userLabel, modifiedAt = :modifiedAt',
			ExpressionAttributeValues: {
				':organizationId': organizationId,
				':userLabel': userLabel,
				':modifiedAt': Date.now(),
			},
			ReturnValues: 'ALL_NEW',
		};

		const updated = await this.ioc.DynamoDB.update(updateParams).promise();

		// Don't send the embeddings
		return {
			...updated.Attributes,
			exemplarUtterance: {
				...omit(updated.Attributes.exemplarUtterance, ['embedding']),
			},
		};
	}
}
