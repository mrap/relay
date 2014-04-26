var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId;

// Add another array's items to an array (Fastest implementation)
// Source: http://stackoverflow.com/questions/4156101/javascript-push-array-values-into-another-array
Array.prototype.pushArray = function() {
  var toPush = this.concat.apply([], arguments);
  for (var i = 0, len = toPush.length; i < len; ++i) {
    this.push(toPush[i]);
  }
};

var helper = {
  getObjectID: function(obj){
    if      (obj === null || typeof obj === 'undefined')         return null;
    else if (typeof obj === 'string')                            return new ObjectId(obj);
    else if (obj.constructor.name === 'ObjectID')                return obj;
    else if (obj._id && obj._id.constructor.name === 'ObjectID') return obj._id;
    else                                                         return null;
  }
};

module.exports = helper;

