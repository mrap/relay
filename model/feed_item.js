var getObjectID = require('../lib/global_helpers.js').getObjectID;

// Redis fields
var FIELD = {
  SENDER : "sender",
  PREV_SENDER : "prev_sender",
  ORIGIN_DIST : "origin_dist"
};

var FeedItem = function FeedItem(attrs){
  this.postID =
    getObjectID(attrs.postID)        ||
    null;

  this.senderID =
    getObjectID(attrs.senderID)      ||
    getObjectID(attrs[FIELD.SENDER]) ||
    null;

  // If none, defaults to senderID or null.
  this.prevSenderID =
    getObjectID(attrs.prevSenderID)       ||
    getObjectID(attrs[FIELD.PREV_SENDER]) ||
    this.senderID;

  this.score          = attrs.score || 0;
  this.originDistance = attrs.originDistance || attrs[FIELD.ORIGIN_DIST]              || 1;
  // Convert to numbers
  this.score          = Number(this.score);
  this.originDistance = Number(this.originDistance);
  return this;
};

module.exports = FeedItem;
