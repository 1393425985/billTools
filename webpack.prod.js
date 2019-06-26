const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const common = require('./webpack.common.js');

const extractCSS = new ExtractTextPlugin('stylesheets/[name]-css.css');
const extractLESS = new ExtractTextPlugin('stylesheets/[name]-less.css');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    extractCSS,
    extractLESS,
  ],

  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '/img/[hash:6].[ext]',
            },
          },
        ],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.global\.less$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: extractLESS.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'postcss-loader', 'less-loader'],
          publicPath: '../',
        }),
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /^((?!\.global).)*\.less$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: extractLESS.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
            },
            'postcss-loader',
            'less-loader',
          ],
          publicPath: '../',
        }),
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.global\.css$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: extractCSS.extract({
          use: ['css-loader', 'postcss-loader'],
          fallback: 'style-loader',
          publicPath: '../',
        }),
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /^((?!\.global).)*\.css$/,
        include: [path.resolve(__dirname, 'node_modules')],
        use: extractCSS.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /^((?!\.global).)*\.css$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: extractCSS.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
            },
            'postcss-loader',
          ],
          publicPath: '../',
        }),
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
});
