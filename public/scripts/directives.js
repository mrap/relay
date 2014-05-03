'use strict';

var directives = angular.module('relay.directives', []);

directives.directive('feed', ['feedManager', function(feedManager){
  function link(scope, element, attrs){

    scope.$watch('posts', function(){
      // Do stuff when 'posts' data is updated
    }, true);

    if (attrs.publicFeed) {
      if(attrs.publicFeed === 'popular'){
        scope.posts = feedManager.getPopularPosts();
      }
    }
  }
  return { link: link }
}]);
