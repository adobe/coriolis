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
const webpackConfig = require(path.join(__dirname, 'webpack.config.js'))[1];

module.exports = function (config) {
  config.set({
    webpack: Object.assign(webpackConfig, {
      devtool: 'inline-source-map',
      mode: 'development',
      resolve: Object.assign(webpackConfig.resolve, {
        fallback: {
          //     util: require.resolve('util/'),
          util: false,
        },
      }),
    }),
    basePath: './',
    files: [
      'test/index.ts',
      {
        pattern: './test/fixture/*',
        watched: false,
        served: true,
        included: false,
      },
      {pattern: './dist/umd/*', watched: true, served: true, included: false},
    ],
    preprocessors: {
      'test/index.ts': ['webpack', 'sourcemap'],
      'src/**/*.*': ['coverage'],
    },
    proxies: {
      '/fixture/': '/base/test/fixture/',
      '/dist/': '/base/dist/umd/',
    },
    coverageReporter: {
      // specify a common output directory
      dir: 'reporting/coverage',
      reporters: [
        // reporters not supporting the `file` property
        {type: 'html', subdir: 'report-html'},
        {type: 'lcov', subdir: 'report-lcov'},
        // reporters supporting the `file` property, use `subdir` to directly
        // output them in the `dir` directory
        {type: 'cobertura', subdir: '.', file: 'cobertura.txt'},
        {type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt'},
        {type: 'teamcity', subdir: '.', file: 'teamcity.txt'},
        {type: 'text', subdir: '.', file: 'text.txt'},
        {type: 'text-summary', subdir: '.', file: 'text-summary.txt'},
        {type: 'text'},
      ],
    },
    singleRun: true,
    autoWatch: false,
    reporters: ['mocha', 'coverage', 'junit'],
    frameworks: ['mocha', 'sinon'],
    browsers:
      process.argv.indexOf('--headless') !== -1
        ? ['ChromeHeadless']
        : ['Chrome'],
    junitReporter: {
      outputDir: 'reporting/test',
      outputFile: 'test-results.xml',
      useBrowserName: false,
    },
    plugins: [
      'karma-sourcemap-loader',
      'karma-coverage',
      'karma-junit-reporter',
      'karma-chrome-launcher',
      'karma-mocha-reporter',
      'karma-mocha',
      'karma-sinon',
      'karma-webpack',
    ],
    webpackMiddleware: {
      stats: 'errors-only',
    },
  });
};
