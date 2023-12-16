// Description:
//   Track days since or until an event
//
// Commands:
//   hubot events list - List all the events the bot knows about
//   hubot events delete <event> - Delete an event
//   hubot it's been <number> days since <event> - Set the day when the event happened
//   hubot it's <number> days until <event> - Set the day when the event will happen
//   hubot <event> on <date> - Set the date the event happened (yyyy-mm-dd)
//   hubot how long since <event>? - Display the number of days since the event
//   hubot when was/is/did <event>? - Give the date an event happened/will happen
//

const moment = require('moment');

module.exports = (robot) => {
  if (!robot.brain.data.days_since) { robot.brain.data.days_since = {}; }

  const storeEvent = (event, date) => {
    if (typeof date === 'string') {
      // eslint-disable-next-line no-param-reassign
      date = moment(date);
    }
    robot.brain.data.days_since[event] = date.format('YYYY-MM-DD');
  };

  /**
   *
   * @param {string} search event to search
   * @returns {string} date
   */
  const findEventDate = (search) => {
    // Exact match
    if (search in robot.brain.data.days_since) {
      return robot.brain.data.days_since[search];
    }
    // Case insensitive match
    const match = Object.keys(robot.brain.data.days_since).find((event) => {
      if (event.toLowerCase().trim() === search.toLowerCase().trim()) {
        return robot.brain.data.days_since[event];
      }
      return false;
    });
    if (typeof match === 'string') {
      return robot.brain.data.days_since[match];
    }
    return false;
  };

  const deleteEvent = (event) => {
    delete robot.brain.data.days_since[event];
    return true;
  };

  robot.respond(/(?:event|day)s? list\s?(.*)?$/, (msg) => {
    const filter = msg.match[1]?.replace('|', '').trim();
    msg.send('I know about:');
    return (() => {
      const result = [];
      Object.keys(robot.brain.data.days_since).forEach((event) => {
        if (filter && RegExp(filter, 'i').test(event) === false) {
          return;
        }
        const date = robot.brain.data.days_since[event];
        result.push(msg.send(`- [${moment(date).format('l')}] ${event}`));
      });
      return result;
    })();
  });

  robot.respond(/(.*?) (?:is|is on|on) ((19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]))$/, (msg) => {
    const event = msg.match[1].trim();
    const date = moment(msg.match[2]);
    storeEvent(event, date);
    msg.send(`Okay, ${event} on ${date.format('l')}.`);
  });

  robot.respond(/(.*?) (?:is|is on|on) (unknown|never)$/, (msg) => {
    const event = msg.match[1].trim();
    let date = findEventDate(event);
    if (date === false) {
      msg.send(`I don't recall when ${event} happened.`);
      return;
    }
    if (typeof date === 'string') {
      date = moment(date);
    }
    deleteEvent(event);
    msg.send(`Okay, ${event} never happened (was ${date.format('l')}).`);
  });

  robot.respond(/(?:it's|it has) been (\d+) days? since\s+(.*?)[.?!]?$/i, (msg) => {
    const event = msg.match[2].trim();
    const days = msg.match[1];
    const date = moment();
    date.subtract(days, 'days');
    storeEvent(event, date);
    msg.send(`Okay, it's been ${days} ${days === 1 ? 'day' : 'days'} since ${event}.`);
  });

  robot.respond(/(?:it's|it is) (\d+) days? until\s+(.*?)[.?!]?$/i, (msg) => {
    const event = msg.match[2].trim();
    const days = msg.match[1];
    const date = moment();
    date.add(days, 'days');
    storeEvent(event, date);
    msg.send(`Okay, it's ${days} ${days === 1 ? 'day' : 'days'} until ${event} (${date.format('l')}).`);
  });

  robot.respond(/(?:how long|how many days|days) (since|until)\s+(.*?)\??$/i, (msg) => {
    let daysSince;
    const event = msg.match[2].trim();
    let date = findEventDate(event);
    if (date) {
      if (typeof date === 'string') {
        date = moment(date);
      }
      daysSince = moment().diff(date, 'days');

      if (daysSince > 0) {
        msg.send(`It's been ${daysSince} days since ${event}.`);
        return;
      } if (daysSince === 0) {
        msg.send(`${event} is today!`);
        return;
      }
      msg.send(`${(daysSince * -1)} days until ${event}`);
      return;
    }
    // Special case: if the event parses to a date
    if (moment(event).isValid()) {
      const dateEvent = moment(event);
      daysSince = moment().diff(dateEvent, 'days');
      if (daysSince > 0) {
        msg.send(`It's been ${daysSince} days since ${dateEvent.format('l')}.`);
        return;
      } if (daysSince === 0) {
        msg.send(`${dateEvent.format('l')} is today!`);
        return;
      }
      msg.send(`${(daysSince * -1)} days until ${dateEvent.format('l')}`);
      return;
    }
    msg.send(`I don't recall when ${event} happened.`);
  });

  robot.respond(/when (was|is|did)?\s+(.*?)\??$/i, (msg) => {
    const event = msg.match[2].trim();
    let date = findEventDate(event);
    if (date) {
      if (typeof date === 'string') {
        date = moment(date);
      }
      if (moment().isSameOrBefore(date)) {
        return msg.send(`${event} is ${date.format('l')}`);
      }
      return msg.send(`${event} was ${date.format('l')}`);
    }
    return msg.send(`I don't recall when ${event} happened.`);
  });
};
