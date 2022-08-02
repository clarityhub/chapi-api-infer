const slsw = require('serverless-webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
	entry: slsw.lib.entries,
	target: 'node',
	// Generate sourcemaps for proper error messages
	devtool: 'source-map',
	// Since 'aws-sdk' is not compatible with webpack,
	// we exclude all node dependencies
	// externals: [nodeExternals()],
	mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
	optimization: {
		// We do not want to minimize our code.
		minimize: false,
	},
	performance: {
		// Turn off size warnings for entry points
		hints: false,
	},
	// Run babel on all .js files and skip those in node_modules
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				options: {
					presets: ['@babel/preset-env'],
				},
				include: [
					__dirname,
					/node_modules\/\@clarityhub\/harmony-server/,
				],
				// exclude: /node_modules/
			},
		],
	},

	plugins: [
		new CopyWebpackPlugin([
			'docs/**',
			'schemas/**',
		]),
	],
};
