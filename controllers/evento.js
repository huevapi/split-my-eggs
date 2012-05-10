exports.post = function(req, res) {
    console.log('posting evento');
    var evento = new Evento();
    evento.type = req.body.type;
    evento.data = req.body.data;
    evento.version = req.body.version;
    evento.label = req.body.label;
    evento.save( function(err) {
        if(!err) {
            res.send();
        } else {
            res.send(err, 403);
        }
        
    });
};

exports.get = function(req, res) {
    console.log("Getting eventos");
    Evento.find({}, function(err, eventos) {
       res.end(JSON.stringify(eventos)); 
    });
}