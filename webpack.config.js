const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './background.js',
    content: './content.js',
    popup: './popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'popup-fixed.html', to: 'popup-fixed.html' },
        { from: 'options.html', to: 'options.html' },
        { from: 'popup.css', to: 'popup.css' },
        { from: 'options.css', to: 'options.css', noErrorOnMissing: true },
        { from: 'popup-fixed.js', to: 'popup-fixed.js', noErrorOnMissing: true },
        { from: 'options.js', to: 'options.js', noErrorOnMissing: true },
        { from: 'utils', to: 'utils' },
        { from: 'icons', to: 'icons' },
        { from: 'assets', to: 'assets', noErrorOnMissing: true }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.json']
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
