var factories = angular.module('relay.factories', [
  'restangular'
]);

factories.factory('feedManager', ['Restangular', function(Restangular){
  return {
    getPopularPosts: function(){
      return Restangular.one('posts').customGETLIST('popular').$object;
    }
  };
}]);

factories.factory('userManager', ['Restangular', function(Restangular){

  return {
    getCurrentUser: function(){
      return Restangular.one('loggedIn').get().$object;
    }
  };
}]);
