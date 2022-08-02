import { Controller } from '@clarityhub/harmony-server';

export default class TopicsController extends Controller {
	async topics({ utterances, authorization }) {
		const data = await this.ioc.NLP.topics({
			utterances,
		}, { authorization });

		return data.items;
	}
}
