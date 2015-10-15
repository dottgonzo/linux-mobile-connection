
var Wvdial=require('wvdialjs'),
pathExists=require('path-exists'),
merge=require('json-add'),
timerdaemon=require('timerdaemon'),
Promise=require('promise'),
verb=require('verbo'),
testConnection=require('promise-test-connection'),
lsusbdev=require('lsusbdev');








function goconnect(provider,options){
  verb('connect',"info","linux-mobile-connection")

  var mobilemodem=new Wvdial(options.wvdialFile);

  return new Promise(function (resolve, reject) {

    mobilemodem.configure(provider).then(function(){
      verb('configure',"info","linux-mobile-connection")
      mobilemodem.connect().then(function(){
        verb('connection',"info","linux-mobile-connection")
        resolve({success:true});
      }).catch(function(err){
        reject(err)
      })
    }).catch(function(err){
      reject(err)
    })
  })
}
goconnect({"label":"Tre Ricaricabile","apn":"tre.it","phone":"*99#","username":"tre","password":"tre"}).then(function(){
  console.log('done')
})
