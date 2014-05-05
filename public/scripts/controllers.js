'use strict';

var controllers = angular.module('relay.controllers', []);

controllers.controller('AppController', ['$scope', 'userManager', function($scope, userManager){
  userManager.setCurrentUser();
}]);

controllers.controller('FeedController', ['$scope', function(scope){
}]);
