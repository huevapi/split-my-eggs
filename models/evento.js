module.exports=function Event(mongoose) {
	var Schema = mongoose.Schema
	  , ObjectId = Schema.ObjectId;
	var schema = new Schema({
    label 			:  { type: String }
  , version 		:  { type: String }
  , type  			:  { type: String }
  , doc   			:  { type: String }
  , created_at	:  { type: Date }
  , updated_at	:  { type: Date }
	});
	var model=mongoose.model('Event', schema);
	return model;
};