const cosine = require('compute-cosine-similarity');

// t1: Array<Array<Number[512]>>
// t2: Array<Array<Number[512]>>
export default function similarity(t1, t2) {
	const similarityMatrix = [];

	for (let i = 0; i < t1.length; i++) {
		// Compute the cosine distance
		const n = t1[i];
		const similarities = [];

		for (let j = 0; j < t2.length; j++) {
			const m = t2[j];

			similarities.push(cosine(n, m));
		}

		similarityMatrix.push(similarities);
	}

	return similarityMatrix;
}
