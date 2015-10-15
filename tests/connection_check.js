var mobileconnect=require('../index'),
netw=require('netw'),
timerdaemon=require('netw'),
verb=require('verbo');

mobileconnect({"label":"Tre Ricaricabile","apn":"tre.it","phone":"*99#","username":"tre","password":"tre"}).then(function(){
  timerdaemon.post(5000,function(){
  netw.data().then(function(doc){
    if (doc.network){
    verb("connected to "+doc.network.dev+' with '+doc.network.ip,"info","Online")
  } else{
    verb("Offline","warn","Offline")

  }

  })


})
}).catch(function(err){
  verb(err,"error","test connection check")
})
