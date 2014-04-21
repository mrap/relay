var mongoose = require('mongoose');

var Connection = function Connection(origin, target, distance){
  if (origin.constructor.name != target.constructor.name)
    throw new Error("connection origin and target must be of the same type");

  this.origin = origin;
  this.target = target;
  this.distance = distance;
};

module.exports = Connection;
