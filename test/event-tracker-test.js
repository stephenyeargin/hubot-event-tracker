const test = require('node:test');
const assert = require('node:assert/strict');
const { createTestBot } = require('./common/TestBot');

const originalDateNow = Date.now;

test('lists known events', async () => {
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    await ctx.send('@hubot events list');
    assert.equal(ctx.sends[0], 'I know about:');
    assert.equal(ctx.sends[1], '- [10/1/2021] another thing');
  } finally {
    ctx.shutdown();
  }
});

test('lists known events with filter', async () => {
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = {
      'another thing': '2021-10-01',
      'the big event': '2025-01-15',
      'some other thing': '2021-09-26',
      'some other event': '2021-09-27',
    };
    await ctx.send('@hubot events list | big event');
    assert.equal(ctx.sends[0], 'I know about:');
    assert.equal(ctx.sends[1], '- [1/15/2025] the big event');
  } finally {
    ctx.shutdown();
  }
});

test('lists known events with filter with no matches', async () => {
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot events list | foobar');
    assert.equal(response, 'I don\'t remember any events matching: "foobar"');
  } finally {
    ctx.shutdown();
  }
});

test('sets the date of an event', async () => {
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot the big event is on 2025-01-15');
    assert.equal(response, 'Okay, the big event on 1/15/2025.');
    assert.deepEqual(ctx.robot.brain.data.days_since, {
      'another thing': '2021-10-01',
      'the big event': '2025-01-15',
    });
  } finally {
    ctx.shutdown();
  }
});

test('sets the date of an event using relative days in the past', async () => {
  Date.now = () => Date.parse('Fri, 1 Oct 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot it\'s been 5 days since some other thing');
    assert.equal(response, 'Okay, it\'s been 5 days since some other thing.');
    assert.deepEqual(ctx.robot.brain.data.days_since, {
      'another thing': '2021-10-01',
      'some other thing': '2021-09-26',
    });
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('sets the date of an event using relative days in the future', async () => {
  Date.now = () => Date.parse('Fri, 1 Oct 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot it is 5 days until some other thing');
    assert.equal(response, 'Okay, it\'s 5 days until some other thing (10/6/2021).');
    assert.deepEqual(ctx.robot.brain.data.days_since, {
      'another thing': '2021-10-01',
      'some other thing': '2021-10-06',
    });
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('un-sets the date of an event', async () => {
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot another thing is on never');
    assert.equal(response, 'Okay, another thing never happened (was 10/1/2021).');
    assert.deepEqual(ctx.robot.brain.data.days_since, {});
  } finally {
    ctx.shutdown();
  }
});

test('responds to days since unknown event', async () => {
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days since a thing');
    assert.equal(response, 'I don\'t recall when a thing happened.');
  } finally {
    ctx.shutdown();
  }
});

test('responds to days since a known event in the future', async () => {
  Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days since another thing');
    assert.equal(response, '45 days until another thing');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds to days since a known event (case insensitive) in the future', async () => {
  Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days since aNotheR tHinG');
    assert.equal(response, '45 days until aNotheR tHinG');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds if it cannot locate an event in the past', async () => {
  Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days since foobar');
    assert.equal(response, 'I don\'t recall when foobar happened.');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds if it cannot locate an event in the future', async () => {
  Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days until foobar');
    assert.equal(response, 'I don\'t recall when foobar happened.');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds to days until a known event in the past', async () => {
  Date.now = () => Date.parse('Sat, 5 Mar 22 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days since another thing');
    assert.equal(response, 'It\'s been 155 days since another thing.');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds to a known event on the day of', async () => {
  Date.now = () => Date.parse('Fri, 1 Oct 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days since another thing');
    assert.equal(response, 'another thing is today!');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds to a known event in the past with the date', async () => {
  Date.now = () => Date.parse('Fri, 8 Oct 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot when was another thing?');
    assert.equal(response, 'another thing was 10/1/2021');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds to a known event in the future with the date', async () => {
  Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot when is another thing?');
    assert.equal(response, 'another thing is 10/1/2021');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});

test('responds to a generic date with days until', async () => {
  Date.now = () => Date.parse('Mon, 16 Aug 2021 12:00:00 UTC');
  const ctx = await createTestBot();
  try {
    ctx.robot.brain.data.days_since = { 'another thing': '2021-10-01' };
    const response = await ctx.sendAndWaitForResponse('@hubot days until 5/17/2022');
    assert.equal(response, '273 days until 5/17/2022');
  } finally {
    Date.now = originalDateNow;
    ctx.shutdown();
  }
});
