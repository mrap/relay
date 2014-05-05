'use strict';

var controllers = angular.module('relay.controllers', []);

controllers.controller('AppController', ['$scope', 'userManager', function($scope, userManager){
  userManager.setCurrentUser();
}]);

controllers.controller('HomeFeedController', ['$rootScope', '$scope', 'feedManager', function($rootScope, $scope, feedManager){

    $rootScope.$watch('isUserLoggedIn', function(){
      if (!$rootScope.isUserLoggedIn) $scope.posts = feedManager.getPopularPosts();
      else                            $scope.posts = $rootScope.currentUser.getFeed();
    }, true);

    $scope.toggleRelayPost = function(post) {
      if (post.relayed) $rootScope.currentUser.unrelayPost(post);
      else              $rootScope.currentUser.relayPost(post);
    };

}]);
