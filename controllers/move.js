exports.post = function(req, res) {
    console.log('posting moves');
    var move = new Move();
    move.to = req.body.to;
    move.from = req.body.from;
    move.amount = req.body.amount;
    move.save( function(err) {
        if(!err) {
            res.send();
        } else {
            res.send(err, 403);
        }
    });
};

exports.get = function(req, res) {
    console.log("Getting moves");
    Move.find({}, function(err, docs) {
       res.end(JSON.stringify(docs)); 
    });
}