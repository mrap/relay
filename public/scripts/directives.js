'use strict';

var directives = angular.module('relay.directives', []);

directives.directive('postsBrowser', ['postService', function(postService){
  function link(scope, element, attrs){
    scope.currentPost = 0;

    // Display the first post when results are received
    scope.$watch('posts', function(){
      scope.post = scope.posts[scope.currentPost];
    }, true);

    if (attrs.publicFeed) {
      if(attrs.publicFeed === 'popular'){
        scope.posts = postService.getPopularPosts();
      }
    }
  }
  return { link: link }
}]);
