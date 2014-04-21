var mongoose = require('mongoose');

var Connection = function Connection(origin, target, distance){
  if (origin.constructor.name != target.constructor.name)
    throw new Error("connection origin and target must be of the same type");

  this.origin = origin;
  this.target = target;
  this.distance = distance;
};

Connection.targetIdsOnly = function(connections) {
  // Extract an array of the connected user's ids
  var ids  = new Array();
  for(var i = 0; i < connections.length; i++)
  if (connections[i].target.constructor.name == 'ObjectID') ids.push(connections[i].target);
  return ids;
};

module.exports = Connection;
