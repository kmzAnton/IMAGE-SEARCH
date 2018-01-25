var express = require('express');
var app = express();
var mongodb = require('mongodb').MongoClient;
var dotenv = require('dotenv').config();

var google = require('googleapis');
var cs = google.customsearch('v1');

var url = require('url');
var MONGO_URI = process.env.MONGO_URI;
var GOOGLE_API = process.env.GOOGLE_API;
// var GOOGLE_ENG = '015592541230548226938:g-lbxngqa1w';
var GOOGLE_ENG = '013863650583121476830:8jwymltr9vy'; //<--------THIS ENGINE IS MUCH BETTER THAT MINE (ABOVE);
var searchList = {'_id':'imagesearch', 'search':[]};


// SENDING MAIN PAGE TO SERVER
app.use(express.static('public'));
app.get('/', function(req,res){
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/search/:num', function(req,res){

  // PREPARING SEARCHLIST ARRAY TO BE UPLOADED
  var searchWord = req.params.num;
  var num = req.query.num;
  searchList.search.unshift({'searchWord':searchWord, 'date':new Date()});
  // console.log(searchList);
  
  // UPLOADING SEARCHLIST TO MONGO
  mongodb.connect(MONGO_URI, function(err,db){
    if(err) res.send('Error on first connecting to mongodb');
    else{
      var dbase = db.db('fccurlshort');
      dbase.collection('imagesearch').update({'_id':'imagesearch'},{'search':searchList.search},{upsert: true});
    }
  });
    
  // GOOGLE CUSTOM SEARCH 
  cs.cse.list({
      auth: GOOGLE_API,
      cx: GOOGLE_ENG,
      q: searchWord,
      searchType:'image',
      num: num
  },function(err,data){
    var arr=[];
    if(err){console.log(err)}
    else {
      console.log('in google');
      // console.log(data);
      data.items.forEach((elem)=>{
        arr.push({
          'url': elem.link,
          'snippet':elem.snippet,
          'thumbnail': elem.image.thumbnailLink,
          'context': elem.image.contextLink 
        });
      });
      // res.send(data.items);
      res.send(arr);
    }
  });
});

// GETTING SEARCHLIST FORM MONGO
  app.get('/searchList', function(req,res){
    mongodb.connect(MONGO_URI, function(err, db){
      if(err) {res.send('Error on second connecting to mongodb');}
      else{
        var dbase = db.db('fccurlshort');
        dbase.collection('imagesearch').findOne({'_id':'imagesearch'},{'search':1},function(err,data){
          if(err){res.send('Error, no data from FINDONE');}
          else{
            res.send(data.search);
          }
        });
      }
    });
    // res.send(searchList);
  });

// CONNECTING TO SERVER PORT
app.listen(process.env.PORT||3000);