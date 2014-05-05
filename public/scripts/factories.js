'use strict'

var factories = angular.module('relay.factories', [
  'restangular'
]);

factories.factory('feedManager', ['Restangular', function(Restangular){

  return {
    getPopularPosts: function(){
      return Restangular.all('posts').customGETLIST('popular').$object;
    }
  };

}]);

factories.factory('userManager', ['$rootScope', 'Restangular', 'GuestUser', 'User',
                  function($rootScope, Restangular, GuestUser, User){

  return {
    setCurrentUser: function(){
      $rootScope.isUserLoggedIn = false;
      $rootScope.currentUser = new GuestUser();
      Restangular.one('loggedIn').get().then(function(user){
        $rootScope.currentUser    = new User(user);
        $rootScope.isUserLoggedIn = true;
      });
    }
  };

}]);

factories.factory('postManager', ['$rootScope', 'Restangular', function($rootScope, Restangular){

  return {
    userRelayPost: function(user, post){
      Restangular.one('posts', post._id)
        .post('relay', {relayer: user._id} )
        .then(function(){
          console.log("userRelayPost successful");
        }, function(){
          console.error("Error: userRelayPost unsuccessful");
        });
    },

    userUnrelayPost: function(user, post){
      Restangular.one('posts', post._id)
        .post('unrelay', {relayer: user._id} )
        .then(function(){
          console.log("userUnrelayPost successful");
        }, function(){
          console.error("Error: userRelayPost unsuccessful");
        });
    }
  };

}]);

factories.factory('Post', function(){

  function Post(data){
    angular.extend(this, data);
    this.feedItem = data.feedItem || {};
    this.relayed  = data.feedItem.relayed || false;
  }

  return Post;
});

factories.factory('User', ['postManager', function(postManager){

  function User(data){
    angular.extend(this, {
      relayPost: function(post){
        postManager.userRelayPost(this, post);
      },

      unrelayPost: function(post){
        postManager.userUnrelayPost(this, post);
      }
    });

    angular.extend(this, data);
  }

  return User;
}]);

factories.factory('GuestUser', ['User', function(User){

  function GuestUser(data) {
    angular.extend(this, {
      deferredRelays:      {},
      deferRelay:          function(post) { this.deferredRelays[post.id] = post },
      removeDeferredRelay: function(post) { delete this.deferredRelays[post.id] }
    });

    // Inherit from User
    angular.extend(this, User);
    // Override User relayPost function
    this.relayPost = this.deferRelay;
    this.unrelayPost = this.deferRelay;
  }

  return GuestUser;
}]);
