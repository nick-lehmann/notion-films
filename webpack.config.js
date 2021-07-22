import path from 'path'
const distPath = path.resolve('.', 'dist')

export default {
  entry: './src/handler.ts',
  output: {
    filename: 'worker.js',
    path: distPath,
  },
  target: 'node',
  devtool: 'cheap-module-source-map',
  mode: 'development',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  experiments: {
    topLevelAwait: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          // transpileOnly is useful to skip typescript checks occasionally:
          // transpileOnly: true,
        },
      },
    ],
  },
}
