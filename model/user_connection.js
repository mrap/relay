var mongoose    = require('mongoose')
  , getObjectID = require('../lib/global_helpers.js').getObjectID;

var UserConnection = function UserConnection(origin, target, distance){
  this.origin = getObjectID(origin);
  this.target = getObjectID(target);
  this.distance = distance;
};

UserConnection.targetIdsOnly = function(connections) {
  // Extract an array of the connected user's ids
  var ids  = new Array();
  for(var i = 0; i < connections.length; i++)
  if (connections[i].target.constructor.name == 'ObjectID') ids.push(connections[i].target);
  return ids;
};

module.exports = UserConnection;
