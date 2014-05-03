'use strict';

var controllers = angular.module('relay.controllers', []);

controllers.controller('AppController', ['$scope', 'userManager', function($scope, userManager){
  $scope.isUserLoggedIn = false;
  $scope.$watch('currentUser', function(){
    $scope.isUserLoggedIn = !_.isEmpty($scope.currentUser);
  }, true);
  $scope.currentUser = userManager.getCurrentUser();
}]);

controllers.controller('PostsController', ['$scope', function(scope){
}]);
