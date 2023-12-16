/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
const Helper = require('hubot-test-helper');
const chai = require('chai');
const nock = require('nock');
const moment = require('moment');

const { expect } = chai;
const helper = new Helper('../src/event-tracker.js');
// hide deprecation warning with invalid date
moment.suppressDeprecationWarnings = true;

// Alter time as test runs
const originalDateNow = Date.now;

describe('event-tracker', function () {
  beforeEach(function () {
    nock.disableNetConnect();
    this.room = helper.createRoom();
    this.room.robot.brain.data.days_since = {};
    this.room.robot.brain.data.days_since['another thing'] = '2021-10-01';
  });

  afterEach(function () {
    this.room.robot.brain.data.days_since = {};
    Date.now = originalDateNow;
    nock.cleanAll();
    this.room.destroy();
  });

  it('lists known events', function () {
    this.room.user.say('alice', '@hubot events list').then(() => {
      expect(this.room.messages).to.eql([
        ['alice', '@hubot events list'],
        ['hubot', 'I know about:'],
        ['hubot', '- [10/1/2021] another thing'],
      ]);
    });
  });

  it('lists known events with filter', async function () {
    this.room.robot.brain.data.days_since = {
      'another thing': '2021-10-01',
      'the big event': '2025-01-15',
      'some other thing': '2021-09-26',
      'some other event': '2021-09-27',
    };
    await this.room.user.say('alice', '@hubot events list | big event').then(() => {
      expect(this.room.messages).to.eql([
        ['alice', '@hubot events list | big event'],
        ['hubot', 'I know about:'],
        ['hubot', '- [1/15/2025] the big event'],
      ]);
    });
  });

  it('lists known events with filter with no matches', async function () {
    this.room.robot.brain.data.days_since = {
      'another thing': '2021-10-01',
    };
    await this.room.user.say('alice', '@hubot events list | foobar').then(() => {
      expect(this.room.messages).to.eql([
        ['alice', '@hubot events list | foobar'],
        ['hubot', 'I don\'t remember any events matching: "foobar"'],
      ]);
    });
  });

  it('sets the date of an event', function () {
    this.room.user.say('alice', '@hubot the big event is on 2025-01-15').then(() => {
      expect(this.room.messages).to.eql([
        ['alice', '@hubot the big event is on 2025-01-15'],
        ['hubot', 'Okay, the big event on 1/15/2025.'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
        'the big event': '2025-01-15',
      });
    });
  });

  it('sets the date of an event using relative days in the past', function () {
    Date.now = () => Date.parse('Fri, 1 Oct 2021 12:00:00 UTC');
    const selfRoom = this.room;
    selfRoom.user.say('alice', '@hubot it\'s been 5 days since some other thing').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot it\'s been 5 days since some other thing'],
        ['hubot', 'Okay, it\'s been 5 days since some other thing.'],
      ]);
      expect(selfRoom.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
        'some other thing': '2021-09-26',
      });
    });
  });

  it('sets the date of an event using relative days in the future', async function () {
    Date.now = () => Date.parse('Fri, 1 Oct 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot it is 5 days until some other thing').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot it is 5 days until some other thing'],
        ['hubot', 'Okay, it\'s 5 days until some other thing (10/6/2021).'],
      ]);
      expect(selfRoom.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
        'some other thing': '2021-10-06',
      });
    });
  });

  it('un-sets the date of an event', async function () {
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot another thing is on never').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot another thing is on never'],
        ['hubot', 'Okay, another thing never happened (was 10/1/2021).'],
      ]);
      expect(selfRoom.robot.brain.data.days_since).to.eql({});
    });
  });

  it('responds to days since unknown event', async function () {
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days since a thing').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days since a thing'],
        ['hubot', 'I don\'t recall when a thing happened.'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds to days since a known event in the future', async function () {
    Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days since another thing').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days since another thing'],
        ['hubot', '45 days until another thing'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds to days since a known event (case insensitive) in the future', async function () {
    Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days since aNotheR tHinG').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days since aNotheR tHinG'],
        ['hubot', '45 days until aNotheR tHinG'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds if it cannot locate an event in the past', async function () {
    Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days since foobar').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days since foobar'],
        ['hubot', 'I don\'t recall when foobar happened.'],
      ]);
    });
  });

  it('responds if it cannot locate an event in the future', async function () {
    Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days until foobar').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days until foobar'],
        ['hubot', 'I don\'t recall when foobar happened.'],
      ]);
    });
  });

  it('responds to days until a known event in the past', async function () {
    Date.now = () => Date.parse('Sat, 5 Mar 22 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days since another thing').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days since another thing'],
        ['hubot', 'It\'s been 155 days since another thing.'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds to a known event on the day of', async function () {
    Date.now = () => Date.parse('Fri, 1 Oct 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days since another thing').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days since another thing'],
        ['hubot', 'another thing is today!'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds to a known event in the past with the date', async function () {
    Date.now = () => Date.parse('Fri, 8 Oct 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot when was another thing?').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot when was another thing?'],
        ['hubot', 'another thing was 10/1/2021'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds to a known event in the future with the date', async function () {
    Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot when is another thing?').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot when is another thing?'],
        ['hubot', 'another thing is 10/1/2021'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });

  it('responds to a generic date with days until', async function () {
    Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
    const selfRoom = this.room;
    await selfRoom.user.say('alice', '@hubot days until 5/17/2022').then(() => {
      expect(selfRoom.messages).to.eql([
        ['alice', '@hubot days until 5/17/2022'],
        ['hubot', '273 days until 5/17/2022'],
      ]);
      expect(this.room.robot.brain.data.days_since).to.eql({
        'another thing': '2021-10-01',
      });
    });
  });
});
