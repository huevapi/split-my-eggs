module.exports=function Evento(mongoose) {
	var Schema = mongoose.Schema
	  , ObjectId = Schema.ObjectId;
	var schema = new Schema({
    label 			:  { type: String }
  , version 		:  { type: String }
  , type  			:  { type: String }
  , data   			:  { type: String }
  , created_at	:  { type: Date }
  , updated_at	:  { type: Date }
	});
	var model=mongoose.model('Evento', schema);
	return model;
};