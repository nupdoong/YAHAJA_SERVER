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

var del_id;
var del_f;
var del_c;

var add_f;

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
                res.write('<script>alert("Wrong Password. Check your password")</script>');
                res.write('<script language=\"javascript\">window.location=\"http://ec2-13-59-95-38.us-east-2.compute.amazonaws.com:3000/first\"</script>');
            }

        }
        else{
            res.write('<script>alert("Wrong ID. Check your ID")</script>');
            res.write('<script language=\"javascript\">window.location=\"http://ec2-13-59-95-38.us-east-2.compute.amazonaws.com:3000/first\"</script>');
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

app.get('/random_matching', function(req, res){
    const id = req.query.account_id;
    
    var partner_id;
    var match_place;
    
    var sqlQuery = "INSERT INTO mc_progress SET ?";
    
    async.waterfall([
        function(callback){
            connection.query('select account_id  from us_custom where status = ?', ['ready'], function(err,rows){
                partner_id = rows[0].account_id;
                callback(null);
            });
        },
        function(callback){
            connection.query('select name from fc_billiards where availability = ?', ['ok'], function(err,rows2){
                match_place = rows2[0].name;
                callback(null);
            }); 
        },
        function(callback){
            var post = {match_type : 'billiards', match_status : 'ready', match_member1 : id, match_member2 : partner_id, match_place : match_place};
            var query = connection.query(sqlQuery, post);
            res.json(null);
        }
    ]);
});

app.get('/find_match',function(req,res){
    const id = req.query.account_id;
    console.log('who get in here post /find_match');
    var query = connection.query('select * from mc_progress where match_member1 = ? OR match_member2 = ?', [id, id], function(err,rows){
        res.json(rows);
    });    
});

app.get('/fc_info',function(req,res){
    const name = req.query.name;
    console.log('who get in here post /fc_info');
    var query = connection.query('select * from fc_billiards where name = ?', [name], function(err,rows){
        res.json(rows);
    });    
});

app.get('/partner_contact',function(req,res){
    const partner_id = req.query.partner_id;
    console.log('who get in here post /partner_contact');
    var query = connection.query('select * from us_custom where account_id = ?', [partner_id], function(err,rows){
        res.json(rows);
    });    
});

app.get('/partner_points',function(req,res){
    const partner_id = req.query.partner_id;
    console.log('who get in here post /partner_points');
    var query = connection.query('select * from rk_billiards where user_account_id = ?', [partner_id], function(err,rows){
        res.json(rows);
    });    
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

app.post('/custom_match',function(req,res){
    console.log('who get in here post /custom_match');
    const id = req.body.account_id;
    
    const partner_id = req.body.partner_id;
    var match_place;
    
    var sqlQuery = "INSERT INTO mc_progress SET ?";
    
    async.waterfall([
        function(callback){
            connection.query('select name from fc_billiards where availability = ?', ['ok'], function(err,rows2){
                match_place = rows2[0].name;
                callback(null);
            }); 
        },
        function(callback){
            var post = {match_type : 'billiards', match_status : 'ready', match_member1 : id, match_member2 : partner_id, match_place : match_place};
            var query = connection.query(sqlQuery, post);
            res.end(JSON.stringify());
        }
    ]);
});

app.get('/match_result_win',function(req,res){
    console.log('who get in here post /match_result');
    const id = req.query.account_id;
    var sqlQuery = "UPDATE rk_billiards SET points=points+10 WHERE user_account_id = '" + id + "';";
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
    var query = connection.query(sqlQuery, callback);  
});
app.get('/match_result_lose',function(req,res){
    console.log('who get in here post /match_result');
    const id = req.query.account_id;
    var sqlQuery = "UPDATE rk_billiards SET points=points-10 WHERE user_account_id = '" + id + "';";
    function callback(err, result){
        if(err){
            console.log("err");
            throw err;
        }
        else{
            console.log('완료');
                        console.log(id);

            res.end(JSON.stringify());
        }
    }
    var query = connection.query(sqlQuery, callback);  
});

app.get('/match_result',function(req,res){
    console.log('who get in here post /match_result');
    const id = req.query.account_id;
    var sqlQuery = "Delete from mc_progress WHERE match_member1 = '" + id + "' or match_member2 = '" + id + "';";
    function callback(err, result){
        if(err){
            console.log("err");
            throw err;
        }
        else{
            console.log('완료');
            console.log(id);
            res.end(JSON.stringify());
        }
    }
    var query = connection.query(sqlQuery, callback);  
});

app.get('/get_billiards_rank_clan', function(req, res){
    console.log('who get in here post /clan_rank');
    var query = connection.query('select clan_name, points from cm_clan ORDER BY points DESC', function(err,rows){
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

app.get('/friends', function(req, res){
    console.log('who get in here post /friends');
    var query = connection.query('select * from cm_friend', function(err,rows){
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
            res.write("<form method = 'post' action='/facility_add'>");
            res.write("<input type = 'submit' value = 'Manage Facility' class='right' name = ''>");
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
                del_id = rows[0].account_id;
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
    connection.query("SELECT * from fc_billiards where availability = ?", ['ok'],function(err, rows, fields){
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
            res.write("<form method = 'post' action='/facility_add'>");
            res.write("<input type = 'submit' value = 'Manage Facility' class='right' name = ''>");
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
                del_f = rows[i].name;
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
                res.write("<h4 style='margin-left : 15px;'>Loc_Latitude : " + rows[i].lat + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Loc_Longitude : " + rows[i].lon + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Contact : " + rows[i].contact + "</h4>");
                res.write("<br>")
                res.write("<form method = 'post' action='/del_fac'>");
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

app.post('/facility_add', function(req, res){
    connection.query("SELECT * from fc_billiards where availability = ?", ['yet'],function(err, rows, fields){
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
                add_f = rows[0].name;
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
                res.write("<h4 style='margin-left : 15px;'>Loc_Latitude : " + rows[i].lat + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Loc_Longitude : " + rows[i].lon + "</h4>");
                res.write("<h4 style='margin-left : 15px;'>Contact : " + rows[i].contact + "</h4>");
                res.write("<br>")
                res.write("<form method = 'post' action='/accept_fac'>");
                res.write("<input type = 'submit' value = 'Accept' class='right' name = ''>");
                res.write("</form>");
                res.write("<form method = 'post' action='/reject_fac'>");
                res.write("<input type = 'submit' value = 'Reject' class='right' name = ''>");
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
            res.write("<form method = 'post' action='/facility_add'>");
            res.write("<input type = 'submit' value = 'Manage Facility' class='right' name = ''>");
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
                del_c = rows[i].clan_name;
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
                res.write("<form method = 'post' action='/del_clan'>");
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
        

    var sqlQuery = "Delete from us_custom WHERE account_id = '" + del_id + "';";
                function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        res.render('post.html');
                    }
                }
                var query = connection.query(sqlQuery, callback);

          
});

app.post('/del_fac', function(req, res){
        

    var sqlQuery = "Delete from fc_billiards WHERE name = '" + del_f + "';";
                function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        res.render('post.html');
                    }
                }
                var query = connection.query(sqlQuery, callback);

          
});

app.post('/del_clan', function(req, res){
        

    var sqlQuery = "Delete from cm_clan WHERE clan_name = '" + del_c + "';";
                function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        res.render('post.html');
                    }
                }
                var query = connection.query(sqlQuery, callback);

          
});

app.post('/accept_fac', function(req, res){
        

    var sqlQuery = "UPDATE fc_billiards SET ? WHERE name = '" + add_f + "';";
    var post = {availability: 'ok'};                
    function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        res.render('post.html');
                    }
                }
                var query = connection.query(sqlQuery, post, callback);

          
});

app.post('/reject_fac', function(req, res){
        

    var sqlQuery = "Delete from fc_billiards WHERE name = '" + add_f + "';";               
    function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        res.render('post.html');
                    }
                }
                var query = connection.query(sqlQuery, callback);

          
});


http.createServer(app).listen(app.get('port'),function(){
    console.log("express start : %d ", app.get('port'));
});
