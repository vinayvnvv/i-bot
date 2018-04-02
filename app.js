const express = require('express');
const app = express();
const fs = require("fs");
const formidable = require('formidable');
var path = require("path");
var os = require("os");
var cors = require("cors");

// var cloudinary = require("cloudinary");

var aws = require('aws-sdk')
var multer = require('multer')
var multerS3 = require('multer-s3')
var s3 = new aws.S3({
	endpoint: "s3.amazonaws.com", 
	region: 'us-east-1',
	accessKeyId: "AKIAJ537FPWUAQEBRKYA",
	secretAccessKey: "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",
});


var upload = multer({
	storage: multerS3({
	  s3: s3,
	  bucket: 'agridoctor',
	  acl: 'public-read',
	  metadata: function (req, file, cb) {
		  console.log("FILE MULTER--->>>", file);
		cb(null, {fieldName: file.fieldname});
	  },
	  key: function (req, file, cb) {	
		cb(null, Date.now().toString());
	  }
	})
});
var cdn = "https://d1mbdhlxnhk672.cloudfront.net";
// cloudinary.config({ 
// 	cloud_name: 'djhwz8xgf', 
// 	api_key: '521781225536491', 
// 	api_secret: 'eZ5FDy-91Vgd77zzWETlE9dcu6Q' 
// });  
var appPort = process.env.PORT || 8888;


app.use(cors())
app.use(express.static(__dirname + '/public'));
app.set('public', __dirname + '/public');

app.get('/', function(req, res){
	// res.sendFile(path.join(__dirname +'/public/index.html'));
	res.send("Hello there");
});

app.post('/image/upload', upload.array('file', 1), function(req, res){

	console.log(req.files, "---> > files");
	
	console.log("INSIDE");
	if(res.statusCode===200 && req.files.length > 0) {
		status = 'uploaded file successfully';
		res.status(200).json({
			status: status,
			url: cdn + "/" + req.files[0].key
		});
	}
	else {
		status = 'upload failed';
		res.status(500).json({
			status: status
		});
	}
	res.end();
	// console.log("STATUS", status);
    // // res.sendFile(path.join(__dirname +'/public/index.html'));
    // // res.send("Hello there");
	    // function generateFileName(filename){
	// 	var ext_regx = /(?:\.([^.]+))?$/;
	// 	var ext = ext_regx.exec(filename);
	// 	var date = new Date().getTime();
	// 	var charBank = "abcdefghijklmnopqrstuvwxyz";
	// 	var fstring = ""
	// 	for(var i = 0; i < 15; i++){
	// 		fstring += charBank[parseInt(Math.random()*26)]; 
	// 	}
	// 	return(fstring += date + "." + "png");
    // }
	// var form = new formidable.IncomingForm();
	
    // form.keepExtensions = true;
    // form.parse(req, function(err, fields, file){    
	// 	if(!err){
	// 		debugger;
	// 		file = file.file;
	// 		fname = generateFileName(file.name)
	// 		// console.log("file.name", file);
	// 		fs.renameSync(file.path, path.join(os.tmpdir(), fname));
	// 		console.log("FNAME", fname);

	// 		var stream = cloudinary.uploader.upload_stream(function(result) { 
	// 			console.log("RESULT", result); 
	// 			res.setHeader('Content-Type', 'application/json');
	// 			res.send(JSON.stringify(result));
	// 		});

	// 		fs.createReadStream(path.join(os.tmpdir(), fname)).on('data', function(data){
	// 			stream.write(data)
	// 		}).on('end', function(result){
	// 			stream.end();
	// 		});


	// 		// fs.readFile(path.join(os.tmpdir(), fname), function(err, buf){
	// 		// 	if(!err){
	// 		// 	console.log(buf);
	// 		// 	}
	// 		// });
	// 	}
    // });

    // form.on('error', function(err) {
	// 	res.status(501);
    // });

});

app.listen(appPort, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + appPort);
});
