var getObjectID = require('../lib/global_helpers.js').getObjectID;

// Redis fields
var FIELD = {
  SENDER      : "sender",
  PREV_SENDER : "prev_sender",
  ORIGIN_DIST : "origin_dist",
  RELAYED     : "relayed"
};


// Prioritizes FIELD properties as attribute values
var FeedItem = function FeedItem(attrs){

  this.postID =
    getObjectID(attrs.postID)        ||
    null;

  this.senderID =
    getObjectID(attrs[FIELD.SENDER]) ||
    getObjectID(attrs.senderID)      ||
    null;

  this.prevSenderID =
    getObjectID(attrs[FIELD.PREV_SENDER]) ||
    getObjectID(attrs.prevSenderID)       ||
    this.senderID;

  this.relayed =
    (!attrs.relayed || attrs.relayed === 'false') ? false : true;

  this.score = attrs.score || 0;

  this.originDistance =
    attrs[FIELD.ORIGIN_DIST] ||
    attrs.originDistance     ||
    1;

  // Convert strings to numbers and bools
  this.score          = Number(this.score);
  this.originDistance = Number(this.originDistance);

  return this;
};

module.exports = FeedItem;
