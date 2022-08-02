import { Controller } from '@clarityhub/harmony-server';

import { toChunk } from '../utilities/fileChunks';
import { cleanUtterances } from '../utilities/utterances';

const CHUNK_SIZE = 20;

/**
 * Map-reducing embedding jobs is annoying. This controller
 * helps make it easier.
 */
export default class EmbedController extends Controller {
	async embed({ utterances, authorization }) {
		// Clean
		const cleanChunks = toChunk(cleanUtterances(utterances), CHUNK_SIZE);

		// Map: Parallel call chunks
		const chunkedEmbeddings = await Promise.all(cleanChunks.map(async (chunk) => {
			const embeddings = await this.ioc.NLP.embed({
				utterances: chunk.map(c => c.utterance),
			}, { authorization });

			// Merge the embeddings with the chunks
			return embeddings.items.map((item, i) => {
				return {
					...chunk[i],
					embedding: item.embedding,
				};
			});
		}));

		// Reduce
		let allUtterances = [];
		chunkedEmbeddings.forEach((u) => {
			allUtterances = allUtterances.concat(u);
		});

		return allUtterances;
	}
}
