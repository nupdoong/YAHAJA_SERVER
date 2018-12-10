var express = require('express');
var alert = require('alert-node');
var http = require('http');
var ejs = require('ejs');
var static = require('serve-static');
var path = require('path');
var fs = require('fs');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var async = require('async');
var FCM = require('fcm-node');

var connection = mysql.createConnection({
    host: 'yahajainstance.cseazqbmpvdh.us-east-2.rds.amazonaws.com',
    port: '3306',
    user: 'pjw930731',
    password: 'q15w96e31',
    database: 'rank',
    debug: false
});

var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
app.set('port', 3000);
app.use('/public',static(path.join(__dirname,'public')));


app.get('/first', function(req, res, next) {
    res.render('top_manage_first.html');
});

app.post('/logout', function(req, res){
    res.render('top_manage_first.html');
});

app.post('/login_m', function(req, res, next) {
    const id = req.body.account_id
    const password = req.body.account_pw;
    console.log('who get in here post /login');
    var query = connection.query('select * from us_manager where account_id = ?',[id], function(err,rows2){
        if(rows2.length > 0){
            if(rows2[0].account_pw == password){
                res.render('post.html');
            }
            else{
                res.end(JSON.stringify());
            }

        }
        else{
            res.end(JSON.stringify());
        }
        
    });
});

app.get('/login', function(req, res, next) {
    const id = req.query.account_id
    const password = req.query.account_pw;
    console.log('who get in here post /login');
    var query = connection.query('select * from us_custom where account_id = ?',[id], function(err,rows2){
        if(rows2.length > 0){
            if(rows2[0].account_pw == password){
                res.end(JSON.stringify(rows2));
            }
            else{
                res.end(JSON.stringify());
            }

        }
        else{
            res.end(JSON.stringify());
        }
        
    });
});

app.post('/login_fcm', function(req, res, next) {
    const id = req.body.account_id
    const fcm_token = req.body.fcm_token;
    console.log('who get in here post /login');
    var sqlQuery = "UPDATE us_custom SET ? WHERE account_id = '" + id + "';";
    var post = {fcm_token: fcm_token};
    function callback(err, result){
        if(err){
            console.log("err");
            throw err;
        }
        else{
            console.log('완료');
            res.end(JSON.stringify());
        }
    }
    var query = connection.query(sqlQuery, post, callback);  
    
});

app.post('/signup2', function(req, res, next) {
    console.log('who get in here post /signup');
    const clan_name = req.body.clan_name;
    const type = req.body.clan_type;
    const clan_master = req.body.clan_master;
    const introduction = req.body.clan_introduction;
   
    var id_dup = 0;
 
    var sqlQuery = "INSERT INTO cm_clan SET ?";
    var post = {clan_name: clan_name, clan_master: clan_master, clan_member: clan_master, introduction: introduction, type: type, points: 1000, established: null};
    
    async.waterfall([
        function(callback){
            connection.query('SELECT clan_name from cm_clan', function(err, rows, fields){
                if (!err){
                    for(var i = 0; i < rows.length; i++)
                    {
                        if(rows[i].clan_name == clan_name){
                            id_dup = 1;                    
                        }
                    }
                    callback(null, id_dup);

                }
                else
                    console.log('Error while performing Query.', err);
            });
            
        },
        function(id_dup, callback){
            console.log(id_dup);
                if(id_dup == 1){
                    res.end("There is already same name clan.");
                }
                else{
                    function callback(err, result){
                        if(err){
                            console.log(err);
                        }
                    }
                    var query = connection.query(sqlQuery, post, callback);
                    console.log("Insert Complete!");
                    res.end(JSON.stringify());
                }
        }
        
    ]);
});

app.post('/signup', function(req, res, next) {
    console.log('who get in here post /signup');
    const id = req.body.account_id;
    const password = req.body.account_pw;
    const sex = req.body.sex;
    const register_date = req.body.register_date;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const contact = req.body.contact;
   
    var id_size = id.length;
    var id_dup = 0;
    var password_size = password.length;
 
    var sqlQuery = "INSERT INTO us_custom SET ?";
    var post = {account_id: id, account_pw: password, sex: sex, register_date: null, firstname: firstname, lastname: lastname, contact: contact, status: 'normal', clan: null, location_longitude: null, location_latitude: null};
    var sqlQuery2 = "INSERT INTO rk_billiards SET ?";
    var post2 = {user_account_id: id, points: 1000, rank: null};
    
    async.waterfall([
        function(callback){
            connection.query('SELECT account_id from us_custom', function(err, rows, fields){
                if (!err){
                    for(var i = 0; i < rows.length; i++)
                    {
                        if(rows[i].id == id){
                            id_dup = 1;                    
                        }
                    }
                    callback(null, id_dup);

                }
                else
                    console.log('Error while performing Query.', err);
            });
            
        },
        function(id_dup, callback){
            console.log(id_dup);
            if((id_size > 10) || (id_size == 0) || (password_size < 4) || (password_size == 0)){
                res.end("Please retry sign in. You entered inappropriate information");
            }
            else{
                if(id_dup == 1){
                    res.end("There is already same ID.");
                }
                else{
                    function callback(err, result){
                        if(err){
                            console.log(err);
                        }
                        else{
                            var query2 = connection.query(sqlQuery2, post2);
                        }
                    }
                    var query = connection.query(sqlQuery, post, callback);
                    console.log("Insert Complete!");
                    res.end(JSON.stringify());
                }
            }
            
        }
        
    ]);
});


app.post('/push_location', function(req, res){
    const id = req.body.account_id;
    const latitude = req.body.location_latitude;
    const longitude = req.body.location_longitude;
    const serverKey = 'AIzaSyDZF3zh-0_PmYHKxEprFrx4V8AXKB_dQkk';
    const client_token = 'eevOFcMBiDo:APA91bEvv17po1we6KBKpk7bPT8V6T63krcAlgW38AA0zmxgisFZdPLPgEiDs2oxJ1VkrXZebOMBaI46jBidconShgMJg7PG1nTwGCrnU-aLwAF40ilL-SZmqEnLam_RYuwIjDTjVjxL';
    console.log('who get in here post /push_location');
    var fcm = new FCM(serverKey);
    var push_data = {
        to: client_token,
        notification: {
            title: "Hello Node",
            body: "Node로 발송하는 Push 메시지 입니다.",
            sound: "default",
            click_action: "FCM_PLUGIN_ACTIVITY",
            icon: "fcm_push_icon"
        }

    };

    var sqlQuery = "UPDATE us_custom SET ? WHERE account_id = '" + id + "';";
    var post = {location_latitude: latitude, location_longitude: longitude};
    function callback(err, result){
            if(err){
                    console.log("err");
                    throw err;
            }
            else{
                    console.log('완료');

                    /*fcm.send(push_data, function(err, response) {
                        if (err) {
                            console.error('Push메시지 발송에 실패했습니다.');
                            console.error(err);
                            return;
                        }

                        console.log('Push메시지가 발송되었습니다.');
                        console.log(response);
                    });*/
                    res.end(JSON.stringify());
            }
    }
    var query = connection.query(sqlQuery, post, callback);
    
});

app.get('/get_location',function(req,res){
    console.log('who get in here post /get_location');
    var query = connection.query('select account_id, firstname, location_longitude, location_latitude from us_custom', function(err,rows){
        res.json(rows);
    });
});

app.get('/get_billiards_rank',function(req,res){
    console.log('who get in here post /get_rank');
    var query = connection.query('select * from rk_billiards ORDER BY points DESC', function(err,rows){
        res.json(rows);
    });    
});

app.get('/get_bowling_rank',function(req,res){
    console.log('who get in here post /get_rank');
    var query = connection.query('select * from rk_bowling', function(err,rows){
        res.json(rows);
    });    
});

app.get('/get_basketball_rank',function(req,res){
    console.log('who get in here post /get_rank');
    var query = connection.query('select * from rk_basketball', function(err,rows){
        res.json(rows);
    });    
});

app.get('/random_match',function(req,res){
    console.log('who get in here post /random_match');
    var query = connection.query('select account_id from us_custom where status = ?', ['ready'], function(err,rows){
        res.json(rows[0]);
    });    
});

app.get('/random_fc',function(req,res){
    console.log('who get in here post /random_fc');
    var query = connection.query('select name, lat, lon, contact from fc_billiards where availability = ?', ['ok'], function(err,rows){
        res.json(rows[0]);
    });    
});

app.get('/random_partner',function(req,res){
    console.log('who get in here post /random_partner');
    var partner_id;
    async.waterfall([
        function(callback){
            connection.query('select account_id  from us_custom where status = ?', ['ready'], function(err,rows){
                var row_row;
                partner_id = rows[0].account_id;
                callback(null, partner_id);
            });
        },
        function(partner_id, callback){
            connection.query('select points from rk_billiards where user_account_id = ?', [partner_id], function(err,rows2){
                console.log(rows2);
                res.json(rows2);
            }); 
        }
    ]);
});

app.post('/random_match',function(req,res){
    console.log('who get in here post /random_match');
    const id = req.body.account_id;
    var sqlQuery = "UPDATE us_custom SET ? WHERE account_id = '" + id + "';";
    var post = {status: 'ready'};
    function callback(err, result){
        if(err){
            console.log("err");
            throw err;
        }
        else{
            console.log('완료');
            res.end(JSON.stringify());
        }
    }
    var query = connection.query(sqlQuery, post, callback);  
});

app.post('/match_result',function(req,res){
    console.log('who get in here post /match_result');
    const id = req.body.account_id;
    var sqlQuery = "UPDATE rk_billiards SET ? WHERE user_account_id = '" + id + "';";
    var post = {points: points + 10};
    function callback(err, result){
        if(err){
            console.log("err");
            throw err;
        }
        else{
            console.log('완료');
            res.end(JSON.stringify());
        }
    }
    var query = connection.query(sqlQuery, post, callback);  
});

app.get('/get_billiards_rank_clan', function(req, res){
    console.log('who get in here post /clan_rank');
    var query = connection.query('select clan_name, points from cm_clan', function(err,rows){
        res.json(rows);
    });
});

app.get('/find_clan', function(req, res){
    console.log('who get in here post /clan_rank');
    const id = req.query.account_id;
    var query = connection.query('select clan from us_custom where account_id = ?',[id] ,function(err,rows){
        res.json(rows);
    });
});

app.get('/users', function(req, res){
    console.log('who get in here post /users');
    var query = connection.query('select * from us_custom', function(err,rows){
        res.json(rows);
    });
});
app.get('/clans', function(req, res){
    console.log('who get in here post /clans');
    var query = connection.query('select * from cm_clan', function(err,rows){
        res.json(rows);
    });
});

app.post('/users_m', function(req, res){
    connection.query("SELECT * from us_custom", function(err, rows, fields){
        if (!err){
            
            res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("<!DOCTYPE html>");
            res.write("<html>");
            res.write("<head>");
            res.write("<meta charset='utf-8'>");
            res.write("<title>Clan List</title>");
            res.write("<link rel='stylesheet' href='/public/css/viewmy.css'>");
            res.write("	<style>	");
             res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("</head>");
            res.write("<body>");
             res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'>	");
            res.write("	<img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');
            res.write("<br>");
            res.write("<form method = 'post' action='/facility_m'>");
            res.write("<input type = 'submit' value = 'Facilitys' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("<form method = 'post' action='/clan_m'>");
            res.write("<input type = 'submit' value = 'Clans' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("<form method = 'post' action='/logout'>");
            res.write("<input type = 'submit' value = 'Logout' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");
            for(var i = 0; i < rows.length; i++)
            {   
                var j = i+1;
                res.write("	<article class = 'article'> 	");
                res.write("	<section class = 'section'>	");
                res.write("	<div class = 'post'>	");
                res.write("	<div class='top'> 	");
                res.write("</div>");
                res.write("<div>");
                res.write("<br><h5>User " + j + "</h5>");
                res.write("</div>");
                res.write("<div>");
                res.write("<h4 style='margin-left : 15px;'>ID : " + rows[i].account_id + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>First Name : " + rows[i].firstname + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Last Name : " + rows[i].lastname + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Contact : " + rows[i].contact + "</h4>");
                res.write("<br>")
                res.write("<form method = 'post' action='/del_user'>");
                res.write("<input type = 'submit' value = 'Delete' class='right' name = ''>");
                res.write("</form>");
                res.write("</div>");
                res.write("</div>");
                res.write("</div>");
                res.write("</section>");
                res.write("</article>");
                
            }
            res.write("</body>");
            res.write("</html>");
            res.end();
                
        }

        else
            console.log('Error while performing Query.', err);
    });
});

app.post('/facility_m', function(req, res){
    connection.query("SELECT * from fc_billiards", function(err, rows, fields){
        if (!err){
            
            res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("<!DOCTYPE html>");
            res.write("<html>");
            res.write("<head>");
            res.write("<meta charset='utf-8'>");
            res.write("<title>Clan List</title>");
            res.write("<link rel='stylesheet' href='/public/css/viewmy.css'>");
            res.write("	<style>	");
             res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("</head>");
            res.write("<body>");
             res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'>	");
            res.write("	<img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');
            res.write("<br>");
            res.write("<form method = 'post' action='/users_m'>");
            res.write("<input type = 'submit' value = 'Users' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("<form method = 'post' action='/clan_m'>");
            res.write("<input type = 'submit' value = 'Clans' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("<form method = 'post' action='/logout'>");
            res.write("<input type = 'submit' value = 'Logout' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");
            for(var i = 0; i < rows.length; i++)
            {   
                var j = i+1;
                res.write("	<article class = 'article'> 	");
                res.write("	<section class = 'section'>	");
                res.write("	<div class = 'post'>	");
                res.write("	<div class='top'> 	");
                res.write("</div>");
                res.write("<div>");
                res.write("<br><h5>Facility " + j + "</h5>");
                res.write("</div>");
                res.write("<div>");
                res.write("<h4 style='margin-left : 15px;'>Name : " + rows[i].name + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Loc : " + rows[i].location + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Contact : " + rows[i].contact + "</h4>");
                res.write("<br>")
                res.write("<form method = 'post' action='/del_user'>");
                res.write("<input type = 'submit' value = 'Delete' class='right' name = ''>");
                res.write("</form>");
                res.write("</div>");
                res.write("</div>");
                res.write("</section>");
                res.write("</article>");
                
            }
            res.write("</body>");
            res.write("</html>");
            res.end();
                
        }

        else
            console.log('Error while performing Query.', err);
    });
});

app.post('/clan_m', function(req, res){
    connection.query("SELECT * from cm_clan", function(err, rows, fields){
        if (!err){
            
            res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("<!DOCTYPE html>");
            res.write("<html>");
            res.write("<head>");
            res.write("<meta charset='utf-8'>");
            res.write("<title>Clan List</title>");
            res.write("<link rel='stylesheet' href='/public/css/viewmy.css'>");
            res.write("	<style>	");
             res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("</head>");
            res.write("<body>");
             res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'>	");
            res.write("	<img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');
            res.write("<br>");
            res.write("<form method = 'post' action='/users_m'>");
            res.write("<input type = 'submit' value = 'Users' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("<form method = 'post' action='/facility_m'>");
            res.write("<input type = 'submit' value = 'Facilitys' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("<form method = 'post' action='/logout'>");
            res.write("<input type = 'submit' value = 'Logout' class='right' name = ''>");
            res.write("</form>");    
            res.write("<br>");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");
            for(var i = 0; i < rows.length; i++)
            {   
                var j = i+1;
                res.write("	<article class = 'article'> 	");
                res.write("	<section class = 'section'>	");
                res.write("	<div class = 'post'>	");
                res.write("	<div class='top'> 	");
                res.write("</div>");
                res.write("<div>");
                res.write("<br><h5>Clan " + j + "</h5>");
                res.write("</div>");
                res.write("<div>");
                res.write("<h4 style='margin-left : 15px;'>Name : " + rows[i].clan_name + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Master : " + rows[i].clan_master + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Clan Type : " + rows[i].type + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Established : " + rows[i].established + "</h4>");
                res.write("<br>")
                res.write("<form method = 'post' action='/del_user'>");
                res.write("<input type = 'submit' value = 'Delete' class='right' name = ''>");
                res.write("</form>");
                res.write("</div>");
                res.write("</div>");
                res.write("</section>");
                res.write("</article>");
                
            }
            res.write("</body>");
            res.write("</html>");
            res.end();
                
        }

        else
            console.log('Error while performing Query.', err);
    });
});

app.post('/del_user', function(req, res){
        

    alert('Delete Complete.');

          
});

http.createServer(app).listen(app.get('port'),function(){
    console.log("express start : %d ", app.get('port'));
});
