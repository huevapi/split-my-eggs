exports.post = function(req, res) {
    console.log('posting user');
    var user = new User();
    user.email = req.body.email;
    user.name = req.body.name;
    user.save( function(err) {
        if(!err) {
            res.send();
        } else {
            res.send(err, 500);
        }
    });
};

exports.get = function(req, res) {
    console.log("Getting users");
    var eventos = User.find({}, function(err, docs) {
       res.end(JSON.stringify(docs)); 
    });
}