const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: 'electron-main',
  entry: {
    main: './src/index.tsx',
    vendor: ['lodash','jquery'],
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'build/dist'),
  },
  resolve: {
    // Add '.ts' and '.tsx' as a resolvable extension.
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    alias: {
      '@utils': path.resolve(__dirname, './src/utils'),
      '@components': path.resolve(__dirname, './src/components'),
      '@panel': path.resolve(__dirname, './src/panel'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  // externals: {
  //   react: 'React',
  //   'react-dom': 'ReactDOM',
  // },
  plugins: [
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      moment: 'moment',
      _: 'lodash',
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Billtools',
      filename: 'index.html',
      template: 'template.html',
    }),
    new webpack.ProvidePlugin({
      _: 'lodash',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
        exclude: '/node_modules/',
      },
      { test: /\.tsx?$/, loader: 'ts-loader' },
      // {
      //   test: /\.worker\.js$/,
      //   use: { loader: 'worker-loader' },
      // },
      // {
      //   test: /\.worker\.ts$/,
      //   use: { loader: 'worker-loader' },
      // },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.(csv|tsv)$/,
        use: ['csv-loader'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.xml$/,
        use: ['xml-loader'],
        include: path.resolve(__dirname, 'src'),
      },
    ],
  },
};
