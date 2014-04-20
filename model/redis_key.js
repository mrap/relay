
var redisKey = {
  keyID: function(model, id) {
    return model + ":" + id;
  },
  keyIDAttribute: function(model, id, attr) {
    return this.keyID(model, id) + ":" + attr
  }
};

module.exports = redisKey;
