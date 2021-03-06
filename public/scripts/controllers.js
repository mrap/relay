'use strict';

var controllers = angular.module('relay.controllers', []);

controllers.controller('AppController', ['$scope', 'userManager', function($scope, userManager){
  userManager.setCurrentUser();
}]);

controllers.controller('HomeFeedController', ['$rootScope', '$scope', 'feedManager', function($rootScope, $scope, feedManager){

    $rootScope.$watch('isUserLoggedIn', function(){
      if (!$rootScope.isUserLoggedIn) $scope.posts = feedManager.getPopularPosts();
      else                            $scope.posts = feedManager.getUserFeed($rootScope.currentUser);
    }, true);

    $scope.toggleRelayPostAtIndex = function(index) {
      var post = $scope.posts[index];
      $scope.posts[index].relayed = !post.relayed;
      if (post.relayed) $rootScope.currentUser.unrelayPost(post);
      else              $rootScope.currentUser.relayPost(post);
    };

}]);
