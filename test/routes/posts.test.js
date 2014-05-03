'use strict'

var request = require('supertest');

describe("Routes: Posts", function(){
  var agent  = null
    , cookie = null
    , body   = null;
  beforeEach(function(){
    agent = request.agent(server);
  });

  describe("POST #/:id/relay", function(){
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
        agent
          .post('/login')
          .set('Accept', 'application/x-www-form-urlencoded')
          .send( {username: user.username, password: attrs.password} )
          .end(function (err,res){
            if (err) return done(err);
            cookie = res.headers['set-cookie'];
            agent
              .post('/posts/'+post.id+'/relay')
              .set('cookie', cookie)
              .send({relayer: user.id})
              .expect(200, function(err, res){
                if (err) return done(err);
                body = res.body;
                done();
              });
          });
      });

      it("returns the post", function(done){
        expect(body.id).to.eq(post.id);
        done();
      });

      it("successfully relays the post", function(done){
        Post.findById(post, function(err, p){
          eqObjectIDs(p._last_relayed_by, user).should.be.true;
          done();
        });
      });
    });
  });
});
