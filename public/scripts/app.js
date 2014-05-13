'use strict';

var app = angular.module('relay', [
  'relay.controllers',
  'relay.factories',
  'relay.services',
  'relay.directives',
  'ui.bootstrap',
  'duScroll',
  'ngAnimate',
  'fx.animations'
]);

app.config(['RestangularProvider', function(RestangularProvider){
  RestangularProvider.setBaseUrl('http://localhost:3000');
  RestangularProvider.setRestangularFields({
    id: "_id"
  });
}]);

app.run(['Restangular', 'Post', 'User', function(Restangular, Post, User){
  Restangular.extendModel('posts', function(model){
    var post = new Post(model);
    return post;
  });
  Restangular.extendModel('feed', function(model){
    var post = new Post(model);
    return post;
  });
}]);

