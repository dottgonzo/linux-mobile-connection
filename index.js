var mobilemodem=require('wvdialjs'),
pathExists=require('path-exists'),
merge=require('json-add'),
lsusbdev=require('lsusbdev');

function goconnect(provider,options){

  if(options.dev){

    if(pathExists.sync('/sys/bus/usb/devices/'+options.dev)){

      lsusbdev().then(function(data){
        for(var i=0;i<data.length;i++){
          var usb=data[i];

          if(usb.type=='serial'&&usb.hub==options.dev){
            if(pathExists.sync('/etc/wvdial.conf')){
              mobilemodem.setUsb(usb.dev).then(function(){
                mobilemodem.connect()

              })

            }

          }
        }

      })
    }
  } else {
    mobilemodem.configure(config.devices.mobilemodem.provider).then(function(){
      mobilemodem.connect()

    })

  }

}

module.exports=function(provider,opt){

  var options={};
  options.timer=false;
  options.verbose=true

  options.dev=false
  options.ifOffline=true
  options.reconnect=false
  options.retry=false
  options.retryMax=false

  merge(options,opt);
  if (provider && provider.apn){

  if(options.timer){
    setTimeout(function () {

      if(options.ifOffline){
        testConnection().catch(function(err){


          goconnect(provider,options);



        })
      } else{
        goconnect(provider,options);

      }
    }, options.timer);
  } else{
    if(options.ifOffline){
      testConnection().catch(function(err){


        goconnect(provider,options);



      })
    } else{
      goconnect(provider,options);

    }


  }

}
}
