'use strict';

var app = angular.module('relay', [
  'relay.controllers',
  'relay.factories',
  'relay.services',
  'relay.directives'
]);

app.config(['RestangularProvider', function(RestangularProvider){
  RestangularProvider.setBaseUrl('http://localhost:3000');
}]);

