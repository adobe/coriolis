/*
 * Copyright 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const path = require('path');
const webpack = require('webpack');
const babelrc = {
  presets: ['@babel/preset-env', '@babel/preset-typescript'],
  env: {
    test: {
      plugins: ['istanbul'],
    },
  },
};
// eslint-disable-next-line
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const baseConfig = {
  entry: {
    polyfill: ['babel-polyfill'],
    coriolis: [path.resolve(__dirname, './src/Coriolis.ts')],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: babelrc,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: babelrc,
          },
          {
            loader: 'ts-loader',
            options: {
              configFile:
                process.env.NODE_ENV === 'test'
                  ? 'tsconfig.test.json'
                  : 'tsconfig.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    // Only contentBase will be take into account with default watcher (see watch.js)
    contentBase: [
      path.resolve(__dirname, './dist'),
      path.resolve(__dirname, './demo'),
    ],
    disableHostCheck: true,
    host: '0.0.0.0',
  },
  stats: {
    colors: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      __CORIOLIS_VERSION__: JSON.stringify(
        require(path.resolve(__dirname, './package.json')).version
      ),
    }),
    // new BundleAnalyzerPlugin(),
  ],
  devtool: 'source-map',
};

// cjs
const cjs = Object.assign({}, baseConfig, {
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist/cjs'),
    clean: process.env.NODE_ENV === 'prod',
  },
});

// umd
const umd = Object.assign({}, baseConfig, {
  output: {
    filename: '[name].js',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist/umd'),
    clean: process.env.NODE_ENV === 'prod',
  },
});

module.exports = [cjs, umd];
