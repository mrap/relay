'use strict';

var app = angular.module('relay', [
  'relay.controllers',
  'relay.factories',
  'relay.services',
  'relay.directives',
  'ui.bootstrap'
]);

app.config(['RestangularProvider', function(RestangularProvider){
  RestangularProvider.setBaseUrl('http://localhost:3000');
  RestangularProvider.setRestangularFields({
    id: "_id"
  });
}]);

app.run(['Restangular', 'Post', 'User', function(Restangular, Post, User){
  Restangular.extendModel('posts', function(model){
    angular.extend(model, Post);
    return model;
  });

  Restangular.extendModel('users', function(model){
    angular.extend(model, User);
    return model;
  });
}]);

