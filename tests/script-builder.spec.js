'use strict';

const expect = require('chai').expect;
const scriptBuilder = require('../lib/script-builder.js');
const os = require('os');

describe('When building a script', () => {
  describe('a flow is made of requests', () => {
    it('can use a GET request', () => {
      expect(scriptBuilder.buildFlow({
        requests: [{
          verb: 'get',
          path: '/',
        }],
      })).to.eql([
        '      -',
        '        get:',
        '          url: "/"',
      ]);
    });

    it('can use a POST request with a JSON payload example', () => {
      expect(scriptBuilder.buildFlow({
        requests: [{
          verb: 'post',
          path: '/',
          payloadType: 'json',
        }],
      })).to.eql([
        '      -',
        '        post:',
        '          url: "/"',
        '          json: { "name": "value", "rank": 1 }',
      ]);
    });

    it('can use a PUT request with a BODY payload example', () => {
      expect(scriptBuilder.buildFlow({
        requests: [{
          verb: 'put',
          path: '/',
          payloadType: 'body',
        }],
      })).to.eql([
        '      -',
        '        put:',
        '          url: "/"',
        '          body: name=value&rank=1',
      ]);
    });

    it('can use a DELETE request on a non-root path', () => {
      expect(scriptBuilder.buildFlow({
        requests: [{
          verb: 'delete',
          path: '/bug/12345/',
        }],
      })).to.eql([
        '      -',
        '        delete:',
        '          url: "/bug/12345/"',
      ]);
    });

    it('can combine multiple requests into a flow', () => {
      expect(scriptBuilder.buildFlow({
        requests: [{
          verb: 'get',
          path: '/',
        }, {
          verb: 'post',
          path: '/item/',
          payloadType: 'body',
        }, {
          verb: 'delete',
          path: '/item/1234/',
        }, {
          verb: 'put',
          path: '/action/1234/',
          payloadType: 'json',
        }],
      })).to.eql([
        '      -',
        '        get:',
        '          url: "/"',
        '      -',
        '        post:',
        '          url: "/item/"',
        '          body: name=value&rank=1',
        '      -',
        '        delete:',
        '          url: "/item/1234/"',
        '      -',
        '        put:',
        '          url: "/action/1234/"',
        '          json: { "name": "value", "rank": 1 }',
      ]);
    });
  });

  describe('a scenario is made of flows', () => {
    it('can contain a single flow', () => {
      expect(scriptBuilder.buildScenario({
        flows: [{
          requests: [{
            verb: 'get',
            path: '/',
          }],
        }],
      })).to.eql([
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
      ]);
    });

    it('can contain a flow with multiple requests', () => {
      expect(scriptBuilder.buildScenario({
        flows: [{
          requests: [{
            verb: 'get',
            path: '/',
          }, {
            verb: 'put',
            path: '/',
            payloadType: 'body',
          }],
        }],
      })).to.eql([
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
        '      -',
        '        put:',
        '          url: "/"',
        '          body: name=value&rank=1',
      ]);
    });

    it('can contain multiple flows with multiple requests', () => {
      expect(scriptBuilder.buildScenario({
        flows: [{
          requests: [{
            verb: 'get',
            path: '/',
          }, {
            verb: 'put',
            path: '/',
            payloadType: 'body',
          }],
        }, {
          requests: [{
            verb: 'post',
            path: '/customers/',
            payloadType: 'body',
          }, {
            verb: 'get',
            path: '/customer/12345/',
          }],
        }],
      })).to.eql([
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
        '      -',
        '        put:',
        '          url: "/"',
        '          body: name=value&rank=1',
        '    flow:',
        '      -',
        '        post:',
        '          url: "/customers/"',
        '          body: name=value&rank=1',
        '      -',
        '        get:',
        '          url: "/customer/12345/"',
      ]);
    });
  });

  describe('test scripts contain scenarios', () => {
    it('can contain a single scenario', () => {
      expect(scriptBuilder.buildScenarios([{
        flows: [{
          requests: [{
            verb: 'get',
            path: '/',
          }],
        }],
      }])).to.eql([
        'scenarios:',
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
      ]);
    });

    it('can contain multiple scenarios', () => {
      expect(scriptBuilder.buildScenarios([
        {
          flows: [{
            requests: [{
              verb: 'get',
              path: '/',
            }],
          }],
        }, {
          flows: [{
            requests: [{
              verb: 'get',
              path: '/',
            }, {
              verb: 'put',
              path: '/',
              payloadType: 'body',
            }],
          }, {
            requests: [{
              verb: 'post',
              path: '/customers/',
              payloadType: 'body',
            }, {
              verb: 'get',
              path: '/customer/12345/',
            }],
          }],
        },
      ])).to.eql([
        'scenarios:',
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
        '      -',
        '        put:',
        '          url: "/"',
        '          body: name=value&rank=1',
        '    flow:',
        '      -',
        '        post:',
        '          url: "/customers/"',
        '          body: name=value&rank=1',
        '      -',
        '        get:',
        '          url: "/customer/12345/"',
      ]);
    });
  });

  describe('a test phase', () => {
    it('contains a duration and an arrival rate', () => {
      expect(scriptBuilder.buildPhase({
        duration: 100,
        rate: 5,
      })).to.eql([
        '    -',
        '      duration: 100',
        '      arrivalRate: 5',
      ]);
    });

    it('may include an optional rampTo', () => {
      expect(scriptBuilder.buildPhase({
        duration: 100,
        rate: 5,
        rampTo: 66,
      })).to.eql([
        '    -',
        '      duration: 100',
        '      arrivalRate: 5',
        '      rampTo: 66',
      ]);
    });
  });

  describe('multiple test phases', () => {
    it('more than one phase is allowed', () => {
      expect(scriptBuilder.buildPhases([
        {
          duration: 100,
          rate: 5,
        }, {
          duration: 100,
          rate: 5,
          rampTo: 66,
        },
      ])).to.eql([
        '  phases:',
        '    -',
        '      duration: 100',
        '      arrivalRate: 5',
        '    -',
        '      duration: 100',
        '      arrivalRate: 5',
        '      rampTo: 66',
      ]);
    });
  });

  describe('main script header and config', () => {
    it('contains the target endpoint', () => {
      expect(scriptBuilder.buildMain({
        target: 'http://www.google.com',
      })).to.eql([
        '# Thank you for trying serverless-artillery!',
        '# This default script is intended to get you started quickly.',
        '# There is a lot more that Artillery can do.',
        '# You can find great documentation of the possibilities at:',
        '# https://artillery.io/docs/',
        '',
        'config:',
        '  # this hostname will be used as a prefix for each URI in the flow unless a complete URI is specified',
        '  target: http://www.google.com',
      ]);
    });
  });

  describe('complete build script', () => {
    it('uses a config, phases and scenarios', () => {
      expect(scriptBuilder.buildScript({
        target: 'http://www.google.com',
      }, [
        {
          duration: 100,
          rate: 5,
        }, {
          duration: 100,
          rate: 5,
          rampTo: 66,
        },
      ], [
        {
          flows: [{
            requests: [{
              verb: 'get',
              path: '/',
            }],
          }],
        }, {
          flows: [{
            requests: [{
              verb: 'get',
              path: '/',
            }, {
              verb: 'put',
              path: '/',
              payloadType: 'body',
            }],
          }, {
            requests: [{
              verb: 'post',
              path: '/customers/',
              payloadType: 'body',
            }, {
              verb: 'get',
              path: '/customer/12345/',
            }],
          }],
        },
      ])).to.equal([
        '# Thank you for trying serverless-artillery!',
        '# This default script is intended to get you started quickly.',
        '# There is a lot more that Artillery can do.',
        '# You can find great documentation of the possibilities at:',
        '# https://artillery.io/docs/',
        '',
        'config:',
        '  # this hostname will be used as a prefix for each URI in the flow unless a complete URI is specified',
        '  target: http://www.google.com',
        '  phases:',
        '    -',
        '      duration: 100',
        '      arrivalRate: 5',
        '    -',
        '      duration: 100',
        '      arrivalRate: 5',
        '      rampTo: 66',
        'scenarios:',
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
        '  -',
        '    flow:',
        '      -',
        '        get:',
        '          url: "/"',
        '      -',
        '        put:',
        '          url: "/"',
        '          body: name=value&rank=1',
        '    flow:',
        '      -',
        '        post:',
        '          url: "/customers/"',
        '          body: name=value&rank=1',
        '      -',
        '        get:',
        '          url: "/customer/12345/"',
        '',
      ].join(os.EOL));
    });
  });
});
