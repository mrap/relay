var PostSchema = require('./post')
  , mongoose   = require('mongoose')
  , Schema     = mongoose.Schema
  , extend     = require('mongoose-schema-extend');

var LinkPostSchema = PostSchema.extend({
  link: { type: String, required: true }
});

mongoose.model('link_post', LinkPostSchema);

module.exports = LinkPostSchema;
