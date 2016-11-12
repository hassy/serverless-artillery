'use strict';

const os = require('os');

const impl = {
  buildScript(config, phases, scenarios) {
    let lines = [];

    lines = lines.concat(impl.buildMain(config));
    lines = lines.concat(impl.buildPhases(phases));
    lines = lines.concat(impl.buildScenarios(scenarios));

    lines.push('');

    return lines.join(os.EOL);
  },
  buildMain(config) {
    return [
      '# Thank you for trying serverless-artillery!',
      '# This default script is intended to get you started quickly.',
      '# There is a lot more that Artillery can do.',
      '# You can find great documentation of the possibilities at:',
      '# https://artillery.io/docs/',
      '',
      'config:',
      '  # this hostname will be used as a prefix for each URI in the flow unless a complete URI is specified',
      `  target: ${config.target}`,
    ];
  },
  buildPhases(phases) {
    let lines = [
      '  phases:',
    ];

    phases.forEach((phase) => {
      lines = lines.concat(impl.buildPhase(phase));
    });

    return lines;
  },
  buildPhase(phase) {
    const lines = [
      '    -',
      `      duration: ${phase.duration}`,
      `      arrivalRate: ${phase.rate}`,
    ];

    if (phase.rampTo) {
      lines.push(`      rampTo: ${phase.rampTo}`);
    }

    return lines;
  },
  buildScenarios(scenarios) {
    let lines = [
      'scenarios:',
    ];

    scenarios.forEach((scenario) => {
      lines = lines.concat(impl.buildScenario(scenario));
    });

    return lines;
  },
  buildScenario(scenario) {
    let lines = [
      '  -',
    ];

    scenario.flows.forEach((flow) => {
      lines.push('    flow:');
      lines = lines.concat(impl.buildFlow(flow));
    });

    return lines;
  },
  buildFlow(flow) {
    let lines = [];

    flow.requests.forEach((request) => {
      lines = lines.concat(impl.buildRequest(request));
    });

    return lines;
  },
  payloadSamples: {
    json: '{ "name": "value", "rank": 1 }',
    body: 'name=value&rank=1',
  },
  buildRequest(request) {
    const lines = [
      '      -',
      `        ${request.verb}:`,
      `          url: "${request.path}"`,
    ];

    if (request.verb === 'post' || request.verb === 'put') {
      lines.push(`          ${request.payloadType}: ${impl.payloadSamples[request.payloadType]}`);
    }

    return lines;
  },
};

module.exports = impl;
