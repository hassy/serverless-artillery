'use strict';

const os = require('os');

const impl = {
  buildScript(config, phases, scenarios) {
    let lines = impl.buildMain(config);
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
    let lines = [];

    lines.push('  phases:');

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
    let lines = [];

    lines.push('scenarios:');

    scenarios.forEach((scenario) => {
      lines = lines.concat(impl.buildScenario(scenario));
    });

    return lines;
  },
  buildScenario(scenario) {
    let lines = [];

    lines.push('  -');

    scenario.flows.forEach((flow) => {
      lines.push('    flow:');

      lines = lines.concat(impl.buildFlow(flow));
    });

    return lines;
  },
  buildFlow(flow) {
    const lines = [];

    flow.requests.forEach((request) => {
      const payloadSamples = {
        json: '{ "name": "value", "rank": 1 }',
        body: 'name=value&rank=1',
      };

      const flowTemplate = [
        '      -',
        `        ${request.verb}:`,
        `          url: "${request.path}"`,
        `          ${request.payloadType}: ${payloadSamples[request.payloadType]}`,
      ];

      lines.push(flowTemplate[0]);
      lines.push(flowTemplate[1]);
      lines.push(flowTemplate[2]);

      if (request.verb === 'post' || request.verb === 'put') {
        lines.push(flowTemplate[3]);
      }
    });

    return lines;
  },
};

module.exports = impl;
