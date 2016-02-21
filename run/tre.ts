import mobileconnect=require('../index');
let netw=require("netw");
let verb=require('verbo');

mobileconnect({"label":"Tre Ricaricabile","apn":"tre.it","phone":"*99#","username":"tre","password":"tre"},{retry:false}).then(function(answer){

  // setTimeout(function () {
  //   netw.data().then(function(doc){
  //     if (doc.network){
  //     verb("connected to "+doc.network.dev+' with '+doc.network.ip,"info","Online")
  //   } else{
  //     verb("Offline","warn","Offline")
  //
  //   }
  //
  //   })
  // }, 100000);



verb(answer,'info','linux-mobile-connection tre connect info')


}).catch(function(err){
  verb(err,"error")
})
