Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper('../src/event-tracker.coffee')

# Alter time as test runs
originalDateNow = Date.now

describe 'event-tracker', ->
  beforeEach ->
    nock.disableNetConnect()
    @room = helper.createRoom()
    @room.robot.brain.data.days_since = {}
    @room.robot.brain.data.days_since['another thing'] = '2021-10-01';

  afterEach ->
    @room.robot.brain.data.days_since = {}
    Date.now = originalDateNow
    nock.cleanAll()
    @room.destroy()

  it 'lists known events', ->
    @room.user.say('alice', '@hubot events list').then =>
      expect(@room.messages).to.eql [
        ['alice', '@hubot events list']
        ['hubot', 'I know about:']
        ['hubot', '- [10/1/2021] another thing']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01'
      }

  it 'sets the date of an event', ->
    @room.user.say('alice', '@hubot the big event is on 2025-01-15').then =>
      expect(@room.messages).to.eql [
        ['alice', '@hubot the big event is on 2025-01-15']
        ['hubot', 'Okay, the big event on 1/15/2025.']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01',
        'the big event': '2025-01-15'
      }

  it 'sets the date of an event using relative days', ->
    Date.now = () ->
      return Date.parse('2021-10-01')
    selfRoom = @room
    selfRoom.user.say('alice', '@hubot it\'s been 5 days since some other thing').then =>
      expect(selfRoom.messages).to.eql [
        ['alice', '@hubot it\'s been 5 days since some other thing']
        ['hubot', 'Okay, it\'s been 5 days since some other thing.']
      ]
      expect(selfRoom.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01',
        'some other thing': '2021-09-25'
      }

  it 'unsets the date of an event', ->
    @room.user.say('alice', '@hubot another thing is on never').then =>
      expect(@room.messages).to.eql [
        ['alice', '@hubot another thing is on never']
        ['hubot', 'Okay, another thing never happened (was 10/1/2021).']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {}

  it 'responds to days since unknown event', ->
    selfRoom = @room
    selfRoom.user.say('alice', '@hubot days since a thing').then =>
      expect(selfRoom.messages).to.eql [
        ['alice', '@hubot days since a thing']
        ['hubot', 'I don\'t recall when a thing happened.']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01'
      }

  it 'responds to days since a known event in the future', ->
    Date.now = () ->
      return Date.parse('2021-08-16')
    selfRoom = @room
    selfRoom.user.say('alice', '@hubot days since another thing').then =>
      expect(selfRoom.messages).to.eql [
        ['alice', '@hubot days since another thing']
        ['hubot', '46 days until another thing']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01'
      }

  it 'responds to days until a known event in the past', ->
    Date.now = () ->
      return Date.parse('2022-03-05')
    selfRoom = @room
    selfRoom.user.say('alice', '@hubot days since another thing').then =>
      expect(selfRoom.messages).to.eql [
        ['alice', '@hubot days since another thing']
        ['hubot', 'It\'s been 154 days since another thing.']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01'
      }

  it 'responds to a known event on the day of', ->
    Date.now = () ->
      return Date.parse('2021-10-01')
    selfRoom = @room
    selfRoom.user.say('alice', '@hubot days since another thing').then =>
      expect(selfRoom.messages).to.eql [
        ['alice', '@hubot days since another thing']
        ['hubot', 'another thing is today!']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01'
      }

  it 'responds to a known event with the date', ->
    Date.now = () ->
      return Date.parse('2021-10-01')
    selfRoom = @room
    selfRoom.user.say('alice', '@hubot when was another thing?').then =>
      expect(selfRoom.messages).to.eql [
        ['alice', '@hubot when was another thing?']
        ['hubot', 'another thing was 10/1/2021']
      ]
      expect(@room.robot.brain.data.days_since).to.eql {
        'another thing': '2021-10-01'
      }
