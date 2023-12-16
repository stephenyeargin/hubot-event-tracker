# Hubot Date Tracker


[![npm version](https://badge.fury.io/js/hubot-event-tracker.svg)](https://badge.fury.io/js/hubot-event-tracker) [![Node CI](https://github.com/stephenyeargin/hubot-event-tracker/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hubot-event-tracker/actions/workflows/nodejs.yml)

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
user1>> hubot it has been 20 days since the last accident
hubot>> Okay, it has been 20 days since the last accident.
```

```
user1>> hubot it is 20 days until Christmas 2025.
hubot>> Okay, it is 20 days until Christmas 2025 (12/25/2025).
```

```
user1>> hubot the big event is on 2025-01-15
hubot>> Okay, the big event is on 1/15/2025.
```

### Recalling an Event

```
user1>> hubot days since the last accident
hubot>> It has been 20 days since the last accident.
```

### Listing All Events

```
user>> hubot events list
hubot>> I know about:
hubot>> - [10/1/2021] another thing
hubot>> - [12/1/2022] foo fighters
```

```
user>> hubot events list | foo
hubot>> I know about:
hubot>> - [12/1/2022] foo fighters
```

## Credit

A lot of the features are based on a script found at https://gist.github.com/ajacksified/1636635

## NPM Module

https://www.npmjs.com/package/hubot-event-tracker
