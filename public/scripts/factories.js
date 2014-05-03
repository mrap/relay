'use strict'

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

factories.factory('userManager', ['$rootScope', 'Restangular', 'GuestUser', function($rootScope, Restangular, GuestUser){

  return {
    setCurrentUser: function(){
      $rootScope.isUserLoggedIn = false;
      $rootScope.currentUser = new GuestUser();
      Restangular.one('loggedIn').get().then(function(user){
        $rootScope.currentUser    = user;
        $rootScope.isUserLoggedIn = true;
      });
    }
  };

}]);

factories.factory('User', function(){

  function User(data){
    angular.extend(this, {
      // Instance defaults
    });
    angular.extend(this, data);
  }

  return User;
});

factories.factory('GuestUser', ['User', function(User){

  function GuestUser(data) {
    angular.extend(this, {
      deferredRelays:      {},
      deferRelay:          function(post) { this.deferredRelays[post.id] = post },
      removeDeferredRelay: function(post) { delete this.deferredRelays[post.id] }
    });

    // Inherit from User
    angular.extend(this, User);
  }

  return GuestUser;
}]);
