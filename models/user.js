module.exports=function User(mongoose) {
	var Schema = mongoose.Schema
	  , ObjectId = Schema.ObjectId;
	var schema = new Schema({
    email			:  { type: String }
  , name 			:  { type: String }
	});
	var model=mongoose.model('User', schema);
	return model;
};