
var FeedItem = function FeedItem(attrs){
  this.score          = attrs.score;
  this.postID         = attrs.postID;
  this.senderID       = attrs.senderID;
  this.prevSenderID   = attrs.prevSenderID;
  this.originDistance = attrs.originDistance || 0;
  return this;
};

module.exports = FeedItem;
