var _ = require("underscore");

exports.get = function(req, res) {
    User.findOne({ email:req.params.email }, function(err, user) {
      Move.find({ 'to': user._id }, function(err, docs) {
        console.log("Found these:" + docs);
        var balance = {};
        _.each(docs, function(move) {
          if(balance[move.from]) {
            balance[move.from] += move.amount;
          } else {
            balance[move.from] = move.amount;
          }
        });
        res.send(balance);
      })
    });
};