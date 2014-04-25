
var FeedItem = function FeedItem(attrs){
  this.postID         = attrs.postID         || null;
  this.senderID       = attrs.senderID       || null;
  this.prevSenderID   = attrs.prevSenderID   || null;
  this.score          = attrs.score          || 0;
  this.originDistance = attrs.originDistance || 1;

  // Convert to numbers
  this.score          = Number(this.score);
  this.originDistance = Number(this.originDistance);
  return this;
};

module.exports = FeedItem;
