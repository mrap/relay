var factories = angular.module('relay.factories', []);

factories.factory('PostFactory', function(){
  var Post = function(data){
    angular.extend(this, data);
  };
  return Post;
});
