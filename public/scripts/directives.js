'use strict';

var directives = angular.module('relay.directives', []);

directives
  .directive('newPostForm',
             ['Restangular', '$window', '$document', 'Post', 'urlValidator', 'urlImageExtractor',
             function(Restangular, $window, $document, Post, urlValidator, urlImageExtractor){
    return function(scope, element, attr) {
      /* Simply scrolls to the top for now */
      var scrollToNewPost = function(duration){
        var DEFAULT_DURATION = 1000;
        duration = duration || DEFAULT_DURATION;
        $document.scrollTop(0, duration);
      };

      var setFirstPost = function(newPost){
        if (!_.isEmpty(newPost)) scope.posts[0] = newPost;
      };

      scope.newPostEntry = "";

      /* Submit new post */
      scope.submitNewPost = function(){
        if (!scope.newPostEntry) return;
        var entry = scope.newPostEntry;
        scope.newPostEntry = ""; // clears form

        Restangular
          .all('posts')
          .post(scope.posts[0])
          .then(setFirstPost);
      };

      var isWindowAtTop = function(){
        return $window.pageYOffset < 1;
      };

      var newPendingPost = function(){
        var post = new Post({});
        post.relayed = true;
        return post;
      };

      var updatePendingPost = function(entry){
        scope.posts[0].headline  = entry;
        if (urlValidator.isUrl(entry)) {
          scope.posts[0].post_type = 'link_post';
          scope.posts[0].link      = entry;
          urlImageExtractor.fetchImageUrlFromUrl(scope.posts[0].link, function(imageUrl){
            scope.posts[0].preview_photo_url = imageUrl;
          });
        }
      };

      scope.$watch('newPostEntry', function(newVal, oldVal){
        // When first char entered, prepend a pending post
        if      (oldVal === "" && newVal !== "") scope.posts.unshift(newPendingPost());
        // When all chars deleted, remove the pending post
        else if (oldVal !== "" && newVal === "") scope.posts.shift();
        if (newVal === "") return;
        // Update UI as the user enters text
        if (!isWindowAtTop()) scrollToNewPost(300);
        updatePendingPost(newVal);
      }, true);
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
