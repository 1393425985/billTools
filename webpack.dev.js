const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.common.js');

const typingsForCssModulesLoaderConf = {
  loader: 'typings-for-css-modules-loader',
  options: {
    // exportOnlyLocals: false,
    modules: true,
    nameExport: true,
    camcelCase: true,
    minimize: true,
    localIdentName: '[name]__[local]-[hash:base64:5]',
  },
};

module.exports = merge(common, {
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'build/dist'),
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: '.build/dist',
    compress: true,
    port: 9000,
    host: 'localhost',
    hot: true,
    proxy: {
      '/**': 'http://localhost',
    },
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  mode: 'development',
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],

  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.global\.less$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /^((?!\.global).)*\.less$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: [
          'style-loader',
          typingsForCssModulesLoaderConf,
          'postcss-loader',
          'less-loader',
        ],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.global\.css$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: ['style-loader', 'css-loader', 'postcss-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /^((?!\.global).)*\.css$/,
        include: [path.resolve(__dirname, 'node_modules')],
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /^((?!\.global).)*\.css$/,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: ['style-loader', typingsForCssModulesLoaderConf, 'postcss-loader'],
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
});
