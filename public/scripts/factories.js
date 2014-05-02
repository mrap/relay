var factories = angular.module('relay.factories', [
  'restangular'
]);

factories.factory('postManager', ['Restangular', function(Restangular){
  return {
    getPopularPosts: function(){
      return Restangular.one('posts').customGETLIST('popular').$object;
    }
  };
}]);
