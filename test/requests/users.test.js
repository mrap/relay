'use strict'

var request = require('supertest');

describe("User Requests", function(){
  var agent  = null
    , cookie = null
    , body   = null;
  beforeEach(function(){
    agent = request.agent(server);
  });

  describe("GET #:id/feed", function(){
      var connectionsCount = 3
      , connectionDist     = 10
      , attrs              = { password: "pass" }
      , user               = null
      , post               = null;
    beforeEach(function(done){
      ScenarioFixture.UserWithConnectionsAndFeed(attrs, connectionsCount, function(err, u, extra){
        if (err) return done(err);
        user = u;
        post = extra.posts[0];
        done();
      });
    });

    describe("with authenticated user", function(){
      beforeEach(function(done){
        // Authenticate User
        agent
          .post('/login')
          .set('Accept', 'application/x-www-form-urlencoded')
          .send( {username: user.username, password: attrs.password} )
          .end(function (err,res){
            if (err) return done(err);
            cookie = res.headers['set-cookie'];

            // Submit relay request
            agent
              .get('/users/'+user.id+'/feed')
              .set('cookie', cookie)
              .expect(200, function(err, res){
                if (err) return done(err);
                body = res.body;
                done();
              });
          });
      });

      it("should include each post's feedItem", function(done){
        var firstPost = body[0];
        expect(firstPost.feedItem).to.exist;
        FeedManager.getUserFeedItem(user, firstPost._id, function(err, feedItem){
          if (err) return done(err);
          eqObjectIDs(firstPost.feedItem.postID, feedItem.postID).should.be.true;
          done();
        });
      });

      it("should return posts sorted by score (smallest to greatest)", function(){
        for(var i = 1; i < body.length; i++) {
          expect(body[i].feedItem.score).to.be.at.least(body[i-1].feedItem.score);
        }
      });
    });
  });

  describe("Create new user", function(){
    var userAttrs = {
      email     : "mike@mrap.me",
      username  : "mrap",
      password  : "pass"
    };

    beforeEach(function(done){
      agent
      .post('/users')
      .send(userAttrs)
      .expect(200, function(err, res){
        if (err) return done(err);
        body = res.body;
        done();
      });
    });

    it("should create the user", function(done){
      User.findOne({username: userAttrs.username}, function(err, res){
        expect(res).to.exist;
        done();
      });
    });

    it("should return the user", function(){
      expect(body.username).to.eq(userAttrs.username);
      expect(body.email).to.eq(userAttrs.email);
    });
  });
});
