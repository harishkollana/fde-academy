// Python. Plan: docs/roadmap-v2/02-core-craft.md. One lesson per file in ./python/, wired in below.
import setupTypes from './python/python-setup-types.js';
import collections from './python/python-collections.js';
import comprehensionsFlow from './python/python-comprehensions-flow.js';
import functions from './python/python-functions.js';
import modules from './python/python-modules.js';
import iteratorsGenerators from './python/python-iterators-generators.js';
import decoratorsContextManagers from './python/python-decorators-context-managers.js';
import oopDataclasses from './python/python-oop-dataclasses.js';
import typingPydantic from './python/python-typing-pydantic.js';
import errors from './python/python-errors.js';
import files from './python/python-files.js';
import textTimeMoney from './python/python-text-time-money.js';
import concurrency from './python/python-concurrency.js';
import asyncio from './python/python-asyncio.js';
import performance from './python/python-performance.js';
import loggingConfig from './python/python-logging-config.js';
import testingPytest from './python/python-testing-pytest.js';
import qualityDebugging from './python/python-quality-debugging.js';
import environmentsPackaging from './python/python-environments-packaging.js';
import cli from './python/python-cli.js';
import databases from './python/python-databases.js';
import httpApis from './python/python-http-apis.js';
import scheduling from './python/python-scheduling.js';
import securitySecrets from './python/python-security-secrets.js';
import algorithmsDe from './python/python-algorithms-de.js';
import interviewMethod from './python/python-interview-method.js';

export default {
  modules: [
    { id: 'python-mod-core', title: 'Python core', lessons: [setupTypes, collections, comprehensionsFlow, functions, modules] },
    { id: 'python-mod-idioms', title: 'Idioms every engineer uses', lessons: [iteratorsGenerators, decoratorsContextManagers, oopDataclasses, typingPydantic, errors] },
    { id: 'python-mod-files-text', title: 'Files, text and time', lessons: [files, textTimeMoney] },
    { id: 'python-mod-concurrency', title: 'Concurrency and performance', lessons: [concurrency, asyncio, performance] },
    { id: 'python-mod-engineering', title: 'Engineering practice', lessons: [loggingConfig, testingPytest, qualityDebugging, environmentsPackaging, cli] },
    { id: 'python-mod-data-work', title: 'Python for data work (the lab)', lessons: [databases, httpApis, scheduling, securitySecrets] },
    { id: 'python-mod-interview', title: 'Interview', lessons: [algorithmsDe, interviewMethod] },
  ],
};
