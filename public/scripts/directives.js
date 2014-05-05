'use strict';

var directives = angular.module('relay.directives', []);

directives.directive('feed', ['$rootScope', 'feedManager', function($rootScope, feedManager){
  function link(scope, element, attrs){

    scope.$watch('posts', function(){
      // Do stuff when 'posts' data is updated
    }, true);

    if (attrs.publicFeed) {
      if(attrs.publicFeed === 'popular'){
        scope.posts = feedManager.getPopularPosts();
      }
    }

    scope.toggleRelayPost = function(post) {
      if (post.relayed) $rootScope.currentUser.unrelayPost(post);
      else              $rootScope.currentUser.relayPost(post);
    };
  }
  return { link: link }
}]);
