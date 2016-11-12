'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const URL = require('url-parse');
const handler = require('./lambda/handler');
const BbPromise = require('bluebird');
const scriptBuilder = require('./script-builder');

const handlerSettings = handler.impl.getSettings({});

const impl = {
  phaseQuestions: [
    {
      type: 'input',
      name: 'duration',
      message() { return `Length of the test phase #${impl.wizardScript.phases.length + 1} (in seconds)`; },
      default: 30,
      validate(value) {
        return value > 0 && value <= handlerSettings.maxScriptDurationInSeconds ? true :
          `Enter a valid phase length less than ${handlerSettings.maxScriptDurationInSeconds} seconds.`;
      },
    },
    {
      type: 'input',
      name: 'rate',
      message() { return 'Starting load (in requests per second)'; },
      default: 10,
      validate(value) {
        return value > 0 ? true : 'Enter a positive value for starting load.';
      },
    },
    {
      type: 'input',
      name: 'rampTo',
      message() { return 'Optional "Ramp To" load (in requests per second)'; },
      default: null,
      validate(value) {
        return value === null || value >= 0 ?
          true : 'Enter a positive value for ramp to load.';
      },
    },
    {
      type: 'confirm',
      name: 'addAnother',
      message: 'Add another phase?',
      default: false,
    },
  ],
  askPhase(done) {
    console.log();
    return inquirer.prompt(impl.phaseQuestions)
      .then((phaseAnswers) => {
        impl.wizardScript.phases.push(phaseAnswers);

        if (phaseAnswers.addAnother) {
          impl.askPhase(done);
        } else {
          done();
        }
      });
  },
  phaseWizard() {
    return impl.wizardLoop(impl.askPhase);
  },
  requestQuestions: [
    {
      type: 'list',
      name: 'verb',
      message() { return `HTTP verb for request #${impl.wizardScript.requests.length + 1}`; },
      choices: [
        'GET',
        'POST',
        new inquirer.Separator(),
        'PUT',
        'DELETE',
      ],
      filter(value) { return value.toLowerCase(); },
    },
    {
      type: 'input',
      name: 'path',
      default: '/',
      message() { return `Url path (may include query) from ${impl.wizardScript.endpoint}`; },
    },
    {
      type: 'list',
      name: 'payloadType',
      message: 'Example payload type',
      choices: [
        'JSON',
        'BODY',
      ],
      when(answers) { return answers.verb === 'post' || answers.verb === 'put'; },
    },
    {
      type: 'confirm',
      name: 'addAnother',
      message: 'Add another scenario?',
      default: false,
    },
  ],
  askRequest(done) {
    console.log();
    return inquirer.prompt(impl.requestQuestions)
      .then((requestAnswers) => {
        impl.wizardScript.requests.push(requestAnswers);

        if (requestAnswers.addAnother) {
          impl.askRequest(done);
        } else {
          done();
        }
      });
  },
  requestWizard() {
    return impl.wizardLoop(impl.askRequest);
  },
  wizardLoop(ask) {
    return new BbPromise((resolve, reject) => {
      try {
        ask(resolve);
      } catch (ex) {
        reject(ex);
      }
    });
  },
  wizardScript: {
    phases: [],
    requests: [],
  },
  wizardQuestions: [
    {
      type: 'input',
      name: 'filename',
      message: 'Name of script file to create',
      default: 'script.yml',
      validate(value) {
        try {
          if (fs.lstatSync(value).isFile()) {
            return `File ${value} already exists. Choose another name.`;
          }
        } catch (ex) {
          return true;
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'endpoint',
      message: 'Base URL to http:// or https:// endpoint',
      default: 'http://aws.amazon.com',
      validate(value) {
        try {
          const url = new URL(value);

          const validProtocol = url.protocol === 'http:' || url.protocol === 'https:';
          const validPath = url.pathname === '/' || url.pathname === '';

          if (validProtocol && validPath) {
            return true;
          }
        } catch (ex) {
          console.debug(ex);
        }

        return 'Please enter a valid base URL.\n' +
          'Include http:// or https:// protocol, hostname, with optional user and port.\n' +
          'Do not include path or query string.';
      },
    },
  ],
  scriptWizard(resolve, reject) {
    inquirer.prompt(impl.wizardQuestions)
      .then((result) => {
        impl.wizardScript.endpoint = result.endpoint;
        impl.wizardScript.filename = result.filename;
        return impl.phaseWizard();
      })
      .then(
        () => impl.requestWizard()
      )
      .then(() => {
        fs.writeFileSync(
          impl.wizardScript.filename,
          scriptBuilder.buildScript({
            target: impl.wizardScript.endpoint,
          },
          impl.wizardScript.phases,
            [{
              flows: [{
                requests: impl.wizardScript.requests,
              }],
            }])
        );

        console.log();
        console.log(`Test script written to '${impl.wizardScript.filename}'.`);

        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  },
};

module.exports = impl;
