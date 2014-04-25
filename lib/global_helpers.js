
// Add another array's items to an array (Fastest implementation)
// Source: http://stackoverflow.com/questions/4156101/javascript-push-array-values-into-another-array
Array.prototype.pushArray = function() {
  var toPush = this.concat.apply([], arguments);
  for (var i = 0, len = toPush.length; i < len; ++i) {
    this.push(toPush[i]);
  }
};

