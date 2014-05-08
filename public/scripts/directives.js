'use strict';

var directives = angular.module('relay.directives', []);

directives.directive('newPostForm', ['Restangular', function(Restangular){
  return function(scope, element, attr) {
    var linkExp = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    var isLink = function(str){
      return linkExp.test(str);
    };

    scope.newPostEntry = "";
    var basePostsRoute = Restangular.all('posts');
    scope.submitNewPost = function(){
      if (!scope.newPostEntry) return;
      var entry = scope.newPostEntry;
      scope.newPostEntry = ""; // clears form

      if (isLink(entry)) {
          basePostsRoute.post( {post_type: 'link_post', link: entry, headline: entry} );
      } else {
        basePostsRoute.post( {headline: entry} );
      }
    };
  };
}]);
