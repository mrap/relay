'use strict';

var directives = angular.module('relay.directives', []);

directives.directive('feed', ['postService', function(postService){
  function link(scope, element, attrs){

    scope.$watch('posts', function(){
      // Do stuff when 'posts' data is updated
    }, true);

    if (attrs.publicFeed) {
      if(attrs.publicFeed === 'popular'){
        scope.posts = postService.getPopularPosts();
      }
    }
  }
  return { link: link }
}]);
