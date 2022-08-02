/* eslint-disable import/prefer-default-export */

/**
 * Normalize utterances into a standard format.
 * Throw out any empty utterance
 *
 * @param {Array<String|Object>} arr Array of strings or objects
 */
export const cleanUtterances = (arr) => {
	return arr.map((entry) => {
		if (typeof entry === 'string') {
			return {
				utterance: entry,
			};
		}

		return entry;
	}).filter((entry) => {
		return entry.utterance;
	});
};
