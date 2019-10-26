const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|dist)/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    alias: {
      'react-dom': path.resolve(__dirname, 'node_modules/@hot-loader/react-dom'),
      'react-plumb': path.resolve(__dirname, '../src'),
      react: path.resolve(__dirname, 'node_modules/react')
    }
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 3000
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })]
};
