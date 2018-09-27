/**
 * Author : @nadir93
 * Date 2017.9.6
 */

const getLatestLogFileName = require('./lib/getLatestLogFileName');
const download = require('./lib/download');
const makeDocs = require('./lib/makeDocs');
const sendToES = require('./lib/sendToES');
const sendSNS = require('./lib/sendSNS');
const log = require('./lib/log');

log.info('env', JSON.stringify(process.env));
const databases = process.env.DATABASE.split(',');

let callback = null;

function success() {
  callback(null, 'success');
}

function fail(e) {
  callback(e);
}

const execute = (event, context, cb) => {
  callback = cb;
  log.debug('received event:', JSON.stringify(event, null, 2));

  function loop(index) {
    if (index >= databases.length) {
      return success();
    }

    getLatestLogFileName(index)
      .then(download)
      .then(makeDocs)
      .then(sendToES)
      .then(sendSNS)
      .then(() => {
        const nextIndex = index + 1;
        loop(nextIndex);
      })
      .catch(fail);

    return undefined;
  }
  loop(0);
};

process.on('unhandledRejection', (reason, p) => {
  log.debug('reason: ', reason);
  log.debug('p: ', p);
  throw reason;
});

process.on('uncaughtException', (e) => {
  log.debug('uncaughtException: ', e);
  log.error(e);
});

exports.handler = execute;
