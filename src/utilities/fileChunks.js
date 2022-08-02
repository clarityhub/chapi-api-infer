/**
 * Take an array and return an array of arrays with max size of each being
 * the chunk size
 *
 * @param {Array} arr
 * @param {Integer} chunkSize
 * @returns {Array<Array>}
 */
export const toChunk = (arr, chunkSize) => {
	const chunked = [];

	for (let i = 0; i < arr.length; i += chunkSize) {
		chunked.push(arr.slice(i, i + chunkSize));
	}

	return chunked;
};

/**
 * Given an aray of arrays, return one array
 *
 * @param {Array<Array>} chunks
 * @returns {Array}
 */
export const fromChunks = (chunks) => {
	const acc = [];

	chunks.forEach((chunk) => {
		chunk.forEach((item) => {
			acc.push(item);
		});
	});

	return acc;
};
