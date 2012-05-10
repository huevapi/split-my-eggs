module.exports = function Move(mongoose) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
  var schema = new Schema({
    from    : { type: ObjectId }
  , to      : { type: ObjectId }
  , evento   : { type: ObjectId }
  , amount  : { type: Number }
  });
  var model=mongoose.model('Move', schema);
  return model;
};