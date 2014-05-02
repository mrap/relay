'use strict';

var directives = angular.module('relay.directives', []);

directives.directive('feed', ['postManager', function(postManager){
  function link(scope, element, attrs){

    scope.$watch('posts', function(){
      // Do stuff when 'posts' data is updated
    }, true);

    if (attrs.publicFeed) {
      if(attrs.publicFeed === 'popular'){
        scope.posts = postManager.getPopularPosts();
      }
    }
  }
  return { link: link }
}]);
