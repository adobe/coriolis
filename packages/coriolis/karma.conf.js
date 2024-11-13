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

module.exports = function (config) {
  config.set({
    basePath: './',
    files: [
      {
        pattern: './test/*.ts',
        watched: false,
        served: true,
        included: false,
      },
      {
        pattern: './src/*.ts',
        watched: false,
        served: false,
        included: false,
      },
      {
        pattern: './test/fixture/*',
        watched: true,
        served: true,
        included: false,
      },
      {
        pattern: './dist/*',
        watched: true,
        served: true,
        included: false,
      },
    ],
    preprocessors: {
      'test/**/*.ts': ['parcel', 'sourcemap'],
      'src/**/*.*': ['parcel', 'coverage'],
    },
    proxies: {
      '/parcel-karma/': 'http://localhost:1234/parcel-karma/',
      '/fixture/': '/base/test/fixture/',
      '/dist/': '/base/dist/',
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
    autoWatch: true,
    reporters: ['mocha', 'coverage'],
    frameworks: ['mocha', 'sinon', 'parcel'],
    browsers:
      process.argv.indexOf('--headless') !== -1
        ? ['ChromeHeadless']
        : ['Chrome'],
    plugins: [
      'karma-sourcemap-loader',
      'karma-coverage',
      'karma-chrome-launcher',
      'karma-mocha-reporter',
      'karma-mocha',
      'karma-sinon',
      'karma-parcel',
    ],
  });
};
