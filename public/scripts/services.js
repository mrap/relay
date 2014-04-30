'use strict';

var services = angular.module('relay.services', [
  'restangular'
]);

services.factory('postService', ['Restangular', function(Restangular){
  return {
    getPopularPosts: function(){
      return Restangular.one('posts').customGETLIST('popular').$object;
    }
  };
}]);
