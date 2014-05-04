var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId;


var helper = {
  getObjectID: function(obj){
    if      (obj === null || typeof obj === 'undefined')         return null;
    else if (obj.constructor.name === 'ObjectID')                return obj;
    else if (typeof obj === 'string')                            return new ObjectId(obj);
    else if (obj._id && obj._id.constructor.name === 'ObjectID') return obj._id;
    else                                                         return null;
  },

  eqObjectIDs: function(user1, user2){
    return helper.getObjectID(user1).toString() === helper.getObjectID(user2).toString();
  },

  containsObject: function(arr, user){
    if (!arr || arr.length === 0) return false;
    for (var i = arr.length-1; i >= 0; i--)
      if (helper.eqObjectIDs(arr[i], user)) return true;
    return false;
  }

};

module.exports = helper;

