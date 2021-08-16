# Track days since or until an event
#
# Commands:
#   hubot events list - List all the events the bot knows about
#   hubot it's been <number> days since <event> - Set the day when the event happened
#   hubot <event> on <date> - Set the date the event happened (yyyy-mm-dd)
#   hubot how long since <event>? - Display the number of days since the event
#   hubot when was/is/did <event>? - Give the date an event happened/will happen

moment = require 'moment'
AsciiTable = require 'ascii-table'

module.exports = (robot) ->
  robot.respond /(event|day)s? list$/, (msg) ->
    msg.send "I know about:"
    for event, date of robot.brain.data.days_since
      msg.send "- [#{moment(date).format('l')}] #{event}"

  robot.respond /(.*?) (?:is|is on|on) ((19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01]))$/, (msg) ->
    event = msg.match[1].trim()
    date = moment(msg.match[2])
    robot.brain.data.days_since ||= {}
    robot.brain.data.days_since[event] = date.format('YYYY-MM-DD')
    msg.send "Okay, #{event} on #{date.format('l')}."

  robot.respond /(.*?) (?:is|is on|on) (unknown|never)$/, (msg) ->
    event = msg.match[1].trim()
    robot.brain.data.days_since ||= {}
    date = robot.brain.data.days_since[event]
    unless date?
      msg.send "I don't recall when #{event} happened."
      return
    if typeof date is 'string'
      date = moment(date)
    delete robot.brain.data.days_since[event]
    msg.send "Okay, #{event} never happened (was #{date.format('l')})."

  robot.respond /it's been (\d+) days? since\s+(.*?)[.?!]?$/i, (msg) ->
    event = msg.match[2].trim()
    days = msg.match[1]
    date = moment()
    date.subtract(days, 'days')
    robot.brain.data.days_since ||= {}
    robot.brain.data.days_since[event] = date.format('YYYY-MM-DD')
    msg.send "Okay, it's been #{days} #{if parseInt(days, 10) is 1 then 'day' else 'days'} since #{event}."

  robot.respond /(?:how long|how many days|days) (since|until)\s+(.*?)\??$/i, (msg) ->
    event = msg.match[2].trim()
    if robot.brain.data.days_since && robot.brain.data.days_since[event]
      date = robot.brain.data.days_since[event]
      if typeof date is 'string'
        date = moment(date)
      days_since = moment().diff(date, 'days')

      if days_since > 0
        msg.send "It's been " + days_since + " days since #{event}."
      else if days_since == 0
        msg.send "#{event} is today!"
      else
        msg.send "#{(days_since*-1)} days until #{event}"
    else
      msg.send "I don't recall when #{event} happened."

  robot.respond /when (was|is|did)?\s+(.*?)\??$/i, (msg) ->
    event = msg.match[2].trim()
    if robot.brain.data.days_since && robot.brain.data.days_since[event]
      date = robot.brain.data.days_since[event]
      if typeof date is 'string'
        date = moment(date)
      if moment().isSameOrBefore(date)
        msg.send "#{event} was #{date.format('l')}"
      else
        msg.send "#{event} is #{date.format('l')}"
    else
      msg.send "I don't recall when #{event} happened."
