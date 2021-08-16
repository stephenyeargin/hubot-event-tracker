# Hubot Date Tracker


[![npm version](https://badge.fury.io/js/hubot-brightwheel.svg)](https://badge.fury.io/js/hubot-event-tracker) [![Node CI](https://github.com/stephenyeargin/hubot-event-tracker/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hubot-event-tracker/actions/workflows/nodejs.yml)

Track days since or days until an event.

See [`src/event-tracker.coffee`](src/event-tracker.coffee) for full documentation.

## Installation

In hubot project repo, run:

`npm install hubot-event-tracker --save`

Then add **hubot-event-tracker** to your `external-scripts.json`:

```json
[
  "hubot-event-tracker"
]
```

## Sample Interaction

### Setting an Event

```
user1>> hubot days since the last accident
hubot>> It has been 20 days since the last accident.
```

### Recalling an Event

```
user1>> hubot days since the last accident
hubot>> It has been 20 days since the last accident.
```

## Credit

A lot of the features are based on a script found at https://gist.github.com/ajacksified/1636635

## NPM Module

https://www.npmjs.com/package/hubot-event-tracker
