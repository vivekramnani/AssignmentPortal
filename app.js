const MongoClient = require('mongodb').MongoClient;
const uri = ""; //ENTER THE URI PROVIDED BY MONGO DB FOR YOUR CLUSTER
const client = new MongoClient(uri, {poolSize: 10, bufferMaxEntries: 0, useNewUrlParser: true,useUnifiedTopology: true});
client.connect();
const fs=require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const app=express();
app.use(bodyParser.urlencoded({extended : false}));
const nodemailer=require('nodemailer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
app.use(cookieParser());
app.use(session({secret:"Secret Key"}));
app.use(express.static(__dirname+'/views/Teacher/Profile'));
app.use(express.static(__dirname+'/views/Teacher/AddAssignments'));
app.use(express.static(__dirname+'/views/Teacher/mygroups'));
app.use(express.static(__dirname+'/views/Teacher/MyAssignments'));
app.use(express.static(__dirname+'/views/Student/Profile'));
app.use(express.static(__dirname+'/views/Student/upcomingAssignments'));
app.use(express.static(__dirname+'/views/Student/OngoingAssigments'));
app.use(express.static(__dirname+'/views/Student/Remarks'));
app.use(express.static(__dirname));
app.set('view engine', 'ejs');
let incorrect = new Map();

const redirectLoginBoth = (req, res, next)=>{
    if(!req.session.user)  res.redirect('/login'); 
    else next();
}
const redirectLogin = (req, res, next)=>{
    if(!req.session.user || !req.session.faculty)  res.redirect('/login'); 
    else next();
}
const redirectLoginSt = (req, res, next)=>{
    if(!req.session.user || !req.session.student)  res.redirect('/login'); 
    else next();
}

app.get('/logout', redirectLoginBoth, (req,res)=>{
    req.session.user=undefined;
    req.session.faculty=undefined;
    req.session.student=undefined;
    res.redirect('/login');
});

app.post('/myassignments/giveremarks/:assi/:user', redirectLoginBoth, (req,res)=>{
    const users = client.db("Verified_users").collection("details");
    const rem = client.db("remarks").collection(req.params.user);
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            rem.insertOne({ assignment:req.params.assi, remarks: req.body.remark}, function(err, assiDetails){
                if(err) res.render(err);
                else res.redirect('/myassignments');
            });
        }
    });
});
app.get('/myassignments/giveremarks/:assi/:user', redirectLoginBoth, (req,res)=>{
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            res.render('Teacher/MyAssignments/addremarks', {profile: result, assi: req.params.assi, user: req.params.user});
        }
    });
});
app.get('/viewsubmission/:user/:assi', redirectLoginSt, (req,res)=>{
    const submissions = client.db(req.params.user).collection(req.params.assi);
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            submissions.findOne({student: req.session.user}, function(err, subDetails){
                if(err) res.render(err);
                else if(subDetails==null) {
                    res.render('Student/OngoingAssignments/viewsubNotExist', result);
                } else {
                    res.render('Student/OngoingAssignments/viewsub', {Profile: result, sub: subDetails});
                }
            });
        }
    });
});
app.get('/remarks', redirectLoginSt, (req,res)=>{
    const remarks = client.db('remarks').collection(req.session.user);
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            remarks.find({}).toArray( function(err, rem){
                if(err) res.render(err);
                res.render('Student/Remarks/index', {Profile: result, rem: rem});
            });
        }
    });
});
app.get('/submitassignment/:user/:assi', redirectLoginSt, (req,res)=>{
    console.log(req.params.assi);
    const users = client.db("Verified_users").collection("details");
    const assi = client.db(req.params.user).collection("assignments");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            assi.findOne({assignment: req.params.assi}, function(err, assiDetails){
                if(err) res.render(err);
                else {
                    res.render('Student/OngoingAssignments/submit', {Profile: result, assi: assiDetails});
                }
            });
        }
    });
});
app.post('/submitassignment/:user/:assi',redirectLoginSt,(req,res)=>{
    const submissions = client.db(req.params.user).collection(req.params.assi);
    const users = client.db("Verified_users").collection("details");
    const assi = client.db(req.params.user).collection("assignments");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result1){
        if(err) res.render(err);
        else if(result1==null) { res.redirect('/login');}
        else{
            submissions.findOne({student: req.session.user}, function(err, result){
                if(err) res.render(err);
                else if(result==null) {
                    submissions.insertOne({student: req.session.user, answers: req.body.answers}, function(err, assiDetails){
                        if(err) res.render(err);
                        else res.redirect('/ongoingassignments');
                    });
                } else {
                    res.redirect('/ongoingassignmentsAlreadyExist');
                }
            });
           
        }
    });
});
app.get('/ongoingassignmentsAlreadyExist', redirectLoginSt, (req, res)=>{
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            res.render('Student/OngoingAssignments/indexAlreadyExist', result);
        }
    });
});
app.get('/upcomingassignments', redirectLoginSt, (req, res)=>{
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            res.render('Student/UpcomingAssignments/index', result);
        }
    });
});
app.get('/ongoingassignments', redirectLoginSt, (req, res)=>{
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            res.render('Student/OngoingAssignments/index', result);
        }
    });
});
app.get('/mygroups/addgroup', redirectLogin, (req,res)=>{
    const users = client.db("Verified_users").collection("details");
    const group = client.db(req.session.user).collection('groups');
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            group.find({}).toArray(function(err, allGroups) {
                const group = client.db(req.session.user).collection('groups');
                group.insertOne({Group: (allGroups.length+1).toString(), roll:[]}, function(err, result){
                    if(err) res.render(err);
                    else res.redirect('/mygroups');
                });
            });
        }
    });
});
app.get('/mygroups/:groupnum/addroll', redirectLogin, (req,res)=>{
    const group = client.db(req.session.user).collection('groups');
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            group.findOne({Group: req.params.groupnum}, function(err, group1){
                if(err) res.render(err);
                else if(group1==null) res.redirect('/login');
                else{
                    res.render('Teacher/mygroups/addroll',{profile: result, grp: group1});
                }
            });
        }
    });
});
app.post('/mygroups/addroll/submit/:groupnum', redirectLogin, (req,res)=>{
    const group = client.db(req.session.user).collection('groups');
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            for(var i=req.body.start;i<=req.body.end;++i){
                    var str=i.toString();
                    while(str.length<3) str='0'+str;
                    group.update({Group: req.params.groupnum},{$addToSet:{roll:req.body.series+str}});
            }
            console.log(req.params.groupnum);
            res.redirect('/mygroups/'+req.params.groupnum);
        }
    });
});
app.get('/mygroups/:groupnum', redirectLogin, (req, res)=> {
    const group = client.db(req.session.user).collection('groups');
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            group.findOne({Group: req.params.groupnum}, function(err, group1){
                if(err) res.render(err);
                else if(group1==null) res.redirect('/login');
                else{
                    res.render('Teacher/mygroups/groups', {profile: result, grp: group1});
                }
            });
        }
    });
    
});
app.get('/mygroups', redirectLogin, (req, res)=> {
    const users = client.db("Verified_users").collection("details");
    const group = client.db(req.session.user).collection('groups');
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            group.find({}).toArray(function(err, allGroups) {
               if(err) res.render(err);
               res.render('Teacher/mygroups/index', {profile:result, grp: allGroups});
            });
        }
    });
});
app.get('/myassignments/:assnum/addques', redirectLogin, (req,res)=>{
    const assign = client.db(req.session.user).collection('assignments');
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
            assign.findOne({assignment: req.params.assnum}, function(err, assign1){
                if(err) res.render(err);
                else if(assign1==null) res.redirect('/login');
                else{
                    res.render('Teacher/MyAssignments/addques',{profile: result, ass: assign1});
                }
            });
        }
    });
});
app.post('/myassignments/addques/submit/:assnum', redirectLogin, (req,res)=>{
    const assign = client.db(req.session.user).collection('assignments');
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) { res.redirect('/login');}
        else{
                assign.update({assignment: req.params.assnum},{$addToSet:{questions:req.body.question}});
            console.log(req.params.groupnum);
            res.redirect('/myassignments/'+req.params.assnum);
        }
    });
});
app.post('/myassignments/viewsubmissions/:assnum',(req,res)=>{
    const users = client.db("Verified_users").collection("details");
    const assign = client.db(req.session.user).collection(req.params.assnum);
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/login');
        else{
            console.log(req.params.assnum);
            
            assign.findOne({student:req.body.stud}, function(err, result1) {
                if(err) res.render(err);
                if(result1==null){
                    console.log("no such submission");
                    res.redirect('/myassignments/'+req.params.assnum);
                }
                else
                    res.render('Teacher/MyAssignments/specificroll', {profile:result, sub: result1, ass:req.params.assnum});
            });
        }
    });
});
app.get('/myassignments/viewsubmissions/:assnum',(req,res)=>{
    const users = client.db("Verified_users").collection("details");
    const assign = client.db(req.session.user).collection(req.params.assnum);
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/login');
        else{
            
            assign.find({}).toArray(function(err, result1) {
                if(err) res.render(err);
                res.render('Teacher/MyAssignments/submissions', {profile:result, sub: result1, ass:req.params.assnum});
            });
        }
    });
});
app.get('/myassignments/:assnum', redirectLogin, (req,res)=>{
    const users = client.db("Verified_users").collection("details");
    const assign = client.db(req.session.user).collection('assignments');
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/login');
        else{
            
            assign.findOne({assignment: req.params.assnum}, function(err, result1) {
                if(err) res.render(err);
                res.render('Teacher/MyAssignments/assignments', {profile:result, ass: result1});
            });
        }
    });
});
app.get('/myassignments', redirectLogin, (req,res)=>{
    const users = client.db("Verified_users").collection("details");
    const assign = client.db(req.session.user).collection('assignments');
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/login');
        else{
            assign.find({}).toArray(function(err, allAss) {
                if(err) res.render(err);
                res.render('Teacher/MyAssignments/index', {profile:result, ass: allAss});
            });
        }
    });
});
app.get('/addassignments', redirectLogin, (req, res)=> {
    const users = client.db("Verified_users").collection("details");
    const group = client.db(req.session.user).collection('groups');
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/login');
        else{
            group.find({}).toArray(function(err, allGroups) {
                if(err) res.render(err);
                res.render('Teacher/AddAssignments/index', {profile:result, grp: allGroups});
            });
        }
    });
});
app.post('/addassignments/add', redirectLogin, (req, res)=> {
    const users = client.db("Verified_users").collection("details");
    const group = client.db(req.session.user).collection('groups');
    const assignment = client.db(req.session.user).collection('assignments');
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/login');
        else{
            var stTime= new Date(req.body.stDate+' '+req.body.stTime), enTime=new Date(req.body.enDate+' '+req.body.enTime);
            if(stTime.getTime()>enTime.getTime()) {
                group.find({}).toArray(function(err, allGroups) {
                    if(err) res.render(err);
                    res.render('Teacher/AddAssignments/indexandmessage', {profile: result, grp: allGroups, title: 'Unsuccessful!', message:'Start time should be before end time!'});
                });
            } else {
                assignment.insertOne({assignment: (result.Assignments+1).toString(), assignmentName: req.body.AName, start: stTime, end: enTime, group: req.body.assignmentGroup, questions: []}, function(err, assign){
                    users.updateOne({email: req.session.user+'@nirmauni.ac.in'}, {$set: {Assignments: result.Assignments+1}});
                    group.findOne({Group: req.body.assignmentGroup.substring(6)}, function(err, grp) {
                        if(err) res.render(err);
                        for(var i=0;i<grp.roll.length;i++) {
                            users.findOne({email: grp.roll[i]+'@nirmauni.ac.in'}, function(err, res){
                                if(res!=null) users.updateOne({email: res.email}, {$addToSet:{assignmentIds: {user: req.session.user, name:  req.body.AName, assi:(result.Assignments+1).toString(), start: stTime, end: enTime}}});
                            });
                        }
                    });
                });
                res.redirect('/profile');
            }
        }
    });
});
app.get('/profile/:mail', (req, res)=> {
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.params.mail+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.render('No such user found');
        else{
            res.render('Teacher/profile/index', result);
        }
    });
});
app.get('/profile', redirectLoginBoth, (req, res)=> {
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.session.user+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render('No such user found');
        else if(result==null) res.render('No such user found');
        else{
            if(result.Faculty) {
                req.session.faculty=true;
                res.render('Teacher/profile/index', result);
            } else {
                req.session.student=true;
                res.render('Student/profile/index', result);
            }
        }
    });
});
app.post('/profile', (req, res)=> {
    const users = client.db("Verified_users").collection("details");
    users.findOne({email: req.body.mail+'@nirmauni.ac.in'}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.redirect('/incorrectLogin');
        else if(result.password === req.body.password) {
            req.session.user=req.body.mail;
            if(result.Faculty) {
                req.session.faculty=true;
                res.render('Teacher/profile/index', result);
            } else {
                req.session.student=true;
                res.render('Student/profile/index', result);
            }
            
        }
        else {
            res.redirect('/incorrectLogin');
        }
    });
});

app.get('/incorrectLogin', (req, res)=> {
    res.writeHead(200, {'Content-Type':'text/html'});
    var readStream = fs.createReadStream(__dirname + '/incorrectLogin.html', 'utf8');
    readStream.pipe(res);
});
app.get('/login', (req, res)=>{
    res.writeHead(200, {'Content-Type':'text/html'});
    var readStream = fs.createReadStream(__dirname + '/login.html', 'utf8');
    readStream.pipe(res);
});
app.get('/already_exist_login', (req, res)=>{
    res.writeHead(200, {'Content-Type':'text/html'});
    var readStream = fs.createReadStream(__dirname + '/already_exist_login.html', 'utf8');
    readStream.pipe(res);
});
app.post('/verifyOTP/:mail', (req, res)=> {
    const collection = client.db("test").collection("OTP");
    const collection2 = client.db("Verified_users").collection("details");
    const mail=req.params.mail+'@nirmauni.ac.in';
    collection.findOne({email: mail}, function(err, result){
        if(err) res.render(err);
        else if(result==null) res.render("No OTP exists. Please signup again");
        else{
            if(result.expire>=new Date().getTime()){
                if(result.otp === req.body.otp) {
                    incorrect.set(req.params.mail, 0);
                    collection.deleteOne({email:mail});
                    collection2.insertOne(result, function(err, resu){
                        res.redirect('/login');
                    });
                } else {
                    incorrect.set(req.params.mail, 1);
                    res.redirect('/otp/'+req.params.mail);
                }
            } else {
                var val = Math.floor(Math.random()*1000000).toString();
                while(val.length<6) val='0'+val;
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { //THE CREDENTIALS BELOW WILL BE USED FOR SENDING OTP VIA MAIL
                           user: '', //ENTER EMAIL HERE
                           pass: '' //ENTER PASSWORD HERE
                       },
                    tls: {
                        rejectUnauthorized: false
                    }
                   });
                
                const mailOptions = {
                    from: '', //ENTER EMAIL ID FROM WHICH OTP WILL BE SENT
                    to: mail, 
                    subject: 'OTP for assignment portal', 
                    html: "Hey "+result.FirstName+"! Your <b>NEW</b> OTP is "+val
                  };   
            
                transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      console.log(err);
                    else
                      console.log(info);
                 });
                 collection.updateOne({"email": mail}, {$set:{"otp":val, "expire": new Date().getTime()+120000}}, function(err, result){
                    if(err) res.render(err);
                    incorrect.set(req.params.mail, 2);
                    console.log(new Date().getTime());
                    res.redirect('/otp/'+req.params.mail);
                 });
            }    
        }
    });
});

app.get('/otp/:mail', (req, res)=>{
    if(incorrect.get(req.params.mail)==1){
        res.render('OTP', {head: 'Incorrect OTP!', body: 'Enter OTP again!'});
    } else if(incorrect.get(req.params.mail)==2) {
        res.render('OTP', {head: 'OTP Expired!', body: 'New OTP has been sent to your mail!'});
    } else{
        res.writeHead(200, {'Content-Type':'text/html'});
        var readStream = fs.createReadStream(__dirname + '/OTP.html', 'utf8');
        readStream.pipe(res);
    }
});
app.post('/genotp/:mail', (req, res)=>{
    console.log('Trying to create user');
    var fname = req.body.exampleInputFirstName1;
    var lname=req.body.exampleInputLastName1;
    var pass=req.body.exampleInputPassword1;
    var val = Math.floor(Math.random()*1000000).toString(), mail=req.body.exampleInputEmail1+'@nirmauni.ac.in';
    while(val.length<6) val='0'+val;
    console.log('Page loaded '+req.url);
    const collection2 = client.db("Verified_users").collection("details");
    collection2.findOne({email: mail}, function(err, result){
        if(err) console.log(err);
        else if(result !=null) res.redirect('/already_exist_login');
        else{
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { //THE CREDENTIALS BELOW WILL BE USED FOR SENDING OTP VIA MAIL
                       user: '', //ENTER EMAIL HERE
                       pass: '' //ENTER PASSWORD HERE
                   },
                tls: {
                    rejectUnauthorized: false
                }
               });
            
            const mailOptions = {
                from: '', //ENTER EMAIL ID FROM WHICH OTP WILL BE SENT
                to: mail, 
                subject: 'OTP for assignment portal', 
                html: "Hey "+fname+"! Your OTP is "+val
              };   
        
            transporter.sendMail(mailOptions, function (err, info) {
                if(err)
                  console.log(err);
                else
                  console.log(info);
             });
            const collection = client.db("test").collection("OTP");
            collection.deleteOne({email: mail}, function(err, result){
                if(err) console.log(err);
                else console.log('Deleted');
                collection.insertOne({otp: val, expire: new Date().getTime()+120000,email: mail, FirstName: fname, LastName: lname, password:pass, Faculty: false}, function(err, resul){
                    console.log(resul.otp);
                    if(err) console.log(err);  
                    else {
                        console.log('inserted');
                        res.redirect('/otp/'+req.body.exampleInputEmail1);
                    }
                });
            });
        }
    });
    
});

app.get('/otp.js', (req, res)=> {
    res.writeHead(200, {'Content-Type':'text/js'});
    var readStream = fs.createReadStream(__dirname + '/otp.js', 'utf8');
    readStream.pipe(res);
});

app.get('/register', (req, res)=>{
    console.log('Page loaded '+req.url);
    res.writeHead(200, {'Content-Type':'text/html'});
    var readStream = fs.createReadStream(__dirname + '/register.html', 'utf8');
    readStream.pipe(res);
});
app.get('/js1.js', (req, res)=> {
    res.writeHead(200, {'Content-Type':'text/js'});
    var readStream = fs.createReadStream(__dirname + '/js1.js', 'utf8');
    readStream.pipe(res);
});
app.get('/', (req, res)=>{
    res.redirect('/login');
});
app.get('*', redirectLoginBoth,(req,res)=>{
    res.redirect('/login');
});
var port_number = app.listen(process.env.PORT || 3000);
app.listen(port_number,()=>{
    console.log('Now listening');

});