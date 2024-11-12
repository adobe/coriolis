/*
 * Copyright 2018 Adobe. All rights reserved.
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
const config = Object.assign(
  {},
  require(path.join(__dirname, '../webpack.config.js'))[1],
  {mode: 'development'},
);
const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const compiler = webpack(config);
const express = require('express');
const app = express();

app.use(
  middleware(compiler, {
    // webpack-dev-middleware options
  }),
);

if (config.devServer.contentBase && config.devServer.contentBase) {
  for (const c of config.devServer.contentBase) {
    app.use(express.static(c));
  }
}

app.listen(8080, () =>
  console.log('Example app listening on port http://localhost:8080/'),
);
app.listen(8081, () =>
  console.log('Iframe app listening on port http://localhost:8081/'),
);
