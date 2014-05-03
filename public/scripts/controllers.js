'use strict';

var controllers = angular.module('relay.controllers', []);

controllers.controller('AppController', ['$scope', 'userManager', function($scope, userManager){
  userManager.setCurrentUser();
}]);

controllers.controller('PostsController', ['$scope', function(scope){
}]);
