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
        scope.posts.unshift(basePostsRoute.post( {post_type: 'link_post', link: entry, headline: entry} ).$object );
      } else {
        scope.posts.unshift(basePostsRoute.post( {headline: entry} ).$object );
      }
    };
  };
}]);

directives.directive('feedTop', function(){
  return function(scope, element, attrs) {
    var elem       = element[0]
      , elemHeight = elem.getBoundingClientRect().height;
    scope.feedTop  = elem.getBoundingClientRect().top + elemHeight/2;
  };
});

directives.directive('postHide', ['$window', function($window){
  return function(scope, element, attrs) {

    angular.element($window).bind('scroll', function(){
      var elem = element[0]
        , elemHeight = elem.getBoundingClientRect().height
        , elemHideY = elem.getBoundingClientRect().top + elemHeight/2;
      scope.shouldHide = elemHideY <= scope.feedTop
      scope.$apply();
    });
  };
}]);
