/*
 * Copyright The Cisco Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  ExporterOptions,
  Options,
  _configDefaultOptions,
} from '../src/options';
import * as utils from './utils';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as api from '@opentelemetry/api';

describe('Options tests', () => {
  let logger;

  beforeEach(() => {
    utils.cleanEnvironmentVariables();

    logger = {
      warn: sinon.spy(),
      error: sinon.spy(),
    };

    api.diag.setLogger(logger, api.DiagLogLevel.ALL);
    // Setting logger logs stuff. Cleaning that up.
    logger.warn.resetHistory();
  });

  afterEach(() => {
    api.diag.disable();
  });

  describe('default configuration', () => {
    it('should config all default variables properly (except token)', () => {
      const defaultToken = 'Some Token';
      const options = _configDefaultOptions(<Options>{
        ciscoToken: defaultToken,
      });
      assert.ok(options);
      assert.deepStrictEqual(options, <Options>{
        debug: false,
        ciscoToken: defaultToken,
        serviceName: 'application',
        maxPayloadSize: 1024,
        payloadsEnabled: false,
        exporters: [
          <ExporterOptions>{
            type: 'otlp-grpc',
            collectorEndpoint: 'grpc://localhost:4317',
          },
        ],
      });
      sinon.assert.neverCalledWith(logger.error);
    });

    it('should fail when no token were specified', () => {
      const options = _configDefaultOptions(<Options>{});
      assert.ok(!options);
      sinon.assert.calledOnce(logger.error);
    });
  });

  describe('user Options configuration', () => {
    it('should assign properly the user default configuration and not override', () => {
      const userOptions = <Options>{
        ciscoToken: 'SomeToken',
        serviceName: 'Not the default service name',
        debug: true,
        maxPayloadSize: 10000,
        payloadsEnabled: true,
        exporters: [
          <ExporterOptions>{
            type: 'otlp-http',
            collectorEndpoint: 'Not the default Endpoint',
            customHeaders: { 'some-header': 'some-value' },
          },
        ],
      };
      const options = _configDefaultOptions(userOptions);
      assert.ok(options);
      assert.deepStrictEqual(options, userOptions);
      sinon.assert.neverCalledWith(logger.error);
    });
  });

  describe('user Options Env vars configuration', () => {
    it('should assign properly the user default configuration and not override', () => {
      const userOptions = <Options>{
        ciscoToken: 'SomeToken',
        serviceName: 'Not the default service name',
        debug: true,
        maxPayloadSize: 10000,
        payloadsEnabled: true,
        exporters: [
          <ExporterOptions>{
            type: 'otlp-http',
            collectorEndpoint: 'Not the default Endpoint',
          },
        ],
      };

      process.env.CISCO_TOKEN = userOptions.ciscoToken;
      process.env.OTEL_COLLECTOR_ENDPOINT =
        userOptions.exporters && userOptions.exporters[0].collectorEndpoint;
      process.env.OTEL_SERVICE_NAME = userOptions.serviceName;
      process.env.CISCO_DEBUG = String(userOptions.debug);
      process.env.CISCO_PAYLOADS_ENABLED = String(userOptions.payloadsEnabled);
      process.env.CISCO_MAX_PAYLOAD_SIZE = String(userOptions.maxPayloadSize);
      process.env.OTEL_EXPORTER_TYPE =
        userOptions.exporters && String(userOptions.exporters[0].type);

      const options = _configDefaultOptions(<Options>{});
      assert.ok(options);
      assert.deepStrictEqual(options, userOptions);
      sinon.assert.neverCalledWith(logger.error);
    });
  });
});
