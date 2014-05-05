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

  RestangularProvider.addElementTransformer('posts', function(post){
    post.feedItem = post.feedItem || {};
    post.relayed  = post.feedItem.relayed || false;
    return post;
  });

}]);

