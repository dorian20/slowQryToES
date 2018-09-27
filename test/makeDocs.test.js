/**
 * Author @nadir93
 * Date 2017.11.29
 */

process.env.queryFilterKeywords =
  'performance_schema,information_schema,mysql,rdsadmin';
process.env.SNSTopicLists =
  'icms,display,campaign,members,order,pzero,payment,claim';
// console.log('env: ', process.env.FILTER_KEYWORDS);
process.env.hostFilterKeywords =
  'rdsadmin,pocuser,pruser,b2_dms';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
// const assert = chai.assert;
// const should = chai.should();
const {
  expect,
} = chai;
// const sinon = require('sinon');
const makeDocs = require('../lib/makeDocs');
const moment = require('moment');

const input1 = {
  LogFileData: `# User@Host: user@www.host.com
  \nSET timestamp=${new Date().getTime() / 1000}
  \nSELECT /*+ [delivery-api].OrderDeliveryDAO
  .selectOrderDeliveryList */ from\n input1;`,
};

const input2 = {
  LogFileData: `# User@Host: user@www.host.com
  \nSET timestamp=${new Date().getTime() / 1000}
  \nselect /*+ this is test */ *  from input2;`,
};

const input3 = {
  LogFileData: `# User@Host: user@www.host.com
  \nSET timestamp=${new Date().getTime() / 1000}
  \nselect /*+ [order-api] this is test */ * from input3;`,
};

const input4 = {
  LogFileData: `# User@Host: user@www.host.com
  \nSET timestamp=${new Date().getTime() / 1000}
  \nselect /*+ SQL */ * from input4;`,
};

const input5 = {
  LogFileData: `# User@Host: user@www.host.com
  \nSET timestamp=${moment().subtract(3, 'minutes').valueOf() / 1000}
  \nselect /*+ */ *from input5;`,
};

const input6 = {
  LogFileData: `# User@Host: user@www.host.com
  \nSET timestamp=${new Date().getTime() / 1000}
  \nselect /*+ this is test */ * information_schema from input6;`,
};

const input7 = {
  LogFileData: `# User@Host: rdsadmin@www.host.com
  \nSET timestamp=' + ${new Date().getTime() / 1000}
  \nselect /*+ [order-api] this is test */ * from input7;`,
};

const input8 = {
  LogFileData: `SET timestamp=${new Date().getTime() / 1000}
  \nselect /*+ [order-api] this is test */ * from input7;`,
};

before(() => {
  // runs before all tests in this block
});

after(() => {
  // runs after all tests in this block
});

describe('Tests for makeDocs', () => {
  describe('makeDocs', () => {
    it('successful invocation', () => {
      // process.env.DEBUG_LOG = true; //for debug

      // const timestamp = moment.utc();
      // console.log(JSON.stringify(makeDoc(123, '123', '1234567890', timestamp), null, 2));

      // const rx1 = /\[([^\]]+)]/;
      // const rx2 = /\(([^)]+)\)/;
      // const rx3 = /{([^}]+)}/;
      // const regex = /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/g;
      // const comment = rx1.exec('SELECT /*+ [delivery-api].OrderDelivery' +
      // 'DAO.selectOrderDeliveryList */ from\n table;');

      // console.log('api comment:', comment[0]);
      const input = input1;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).be.fulfilled;
    });

    it('코멘트에 모듈명이 없는경우 servive = none', () => {
      // process.env.DEBUG_LOG = true; //for debug
      const input = input2;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs[0].service', 'none');
    });

    it('코멘트에 모듈명이 있는경우 servive = 해당모듈명', () => {
      // process.env.DEBUG_LOG = true; //for debug
      const input = input3;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs.[0].service', 'order');
    });

    it('코멘트에 sql이 있는경우 slowquery 에서 제외된다.', () => {
      // process.env.DEBUG_LOG = true; //for debug
      const input = input4;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs.length', 0);
      // .to.eventually.be.an('array').that.is.empty;

      // makeDocs(input3)
      //   .then(result => console.log('result: ', result))
      //   .catch(console.error);
    });

    it('3분이상 지난 쿼리는 제외된다.', () => {
      // process.env.DEBUG_LOG = true; //for debug
      // console.log('unix:     ' + moment().valueOf());
      // console.log('unix time:' + new Date().getTime() / 1000);
      const input = input5;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs.length', 0);
      // .to.eventually.be.an('array').that.is.empty;

      // expect(makeDocs(input5)).be.fulfilled
      //  .then(result => console.log('result:', result));
    });

    it('queryFilterKeywords가 있는 쿼리는 제외된다.', () => {
      // process.env.DEBUG_LOG = true; //for debug
      // console.log('unix:     ' + moment().valueOf());
      // console.log('unix time:' + new Date().getTime() / 1000);

      const input = input6;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs.length', 0);
      // .to.eventually.be.an('array').that.is.empty;

      // expect(makeDocs(input4)).be.fulfilled
      //   .then(console.log);
    });

    it('hostFilterKeywords가 있는 호스트는 제외된다.', () => {
      // process.env.DEBUG_LOG = true; //for debug
      // console.log('unix:     ' + moment().valueOf());
      // console.log('unix time:' + new Date().getTime() / 1000);

      const input = input7;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs.length', 0);

      // expect(makeDocs(input4)).be.fulfilled
      //   .then(console.log);
    });

    it('host가 없는경우 host filter 적용없이 진행한다.', () => {
      // process.env.DEBUG_LOG = true; //for debug
      // console.log('unix:     ' + moment().valueOf());
      // console.log('unix time:' + new Date().getTime() / 1000);

      const input = input8;
      return expect(makeDocs({
        docs: input,
        index: 0,
      })).to.eventually.have.nested.property('slowQueryDocs.[0].service', 'order');

      // expect(makeDocs(input8)).be.fulfilled
      //  .then(result => console.log('result:', result));
    });
  });
});

// it('successful invocation', done => {

//   //process.env.DEBUG_LOG = true; //for debug

//   const batchWriteItemStub = sinon.stub(dynamoDB, 'batchWriteItem');
//   batchWriteItemStub.returns(Promise.resolve());

//   expect(reception(records)).be.fulfilled
//     .then(done)
//     .catch(done)
//     .then(() => {
//       batchWriteItemStub.restore();
//     })
// });