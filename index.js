var Wvdial=require('wvdialjs'),
pathExists=require('path-exists'),
merge=require('json-add'),
Promise=require('promise')
lsusbdev=require('lsusbdev');

function goconnect(provider,options){
  return new Promise(function (resolve, reject) {

    var mobilemodem=new Wvdial(options.wvdialFile);

    if(options.dev){

      if(pathExists.sync('/sys/bus/usb/devices/'+options.dev)){

        lsusbdev().then(function(data){

          for(var i=0;i<data.length;i++){
            var usb=data[i];

            if(usb.type=='serial'&&usb.hub==options.dev){
              if(pathExists.sync(options.wvdialFile)){
                mobilemodem.setUsb(usb.dev).then(function(){
                  mobilemodem.connect().then(function(){
                    resolve(success:true);
                  }).catch(function(err){
                    reject(err)
                  })
                }).catch(function(err){
                  reject(err)
                })

              } else{
                mobilemodem.configure(provider).then(function(){
                  mobilemodem.setUsb(usb.dev).then(function(){
                    mobilemodem.connect().then(function(){
                      resolve(success:true);
                    }).catch(function(err){
                      reject(err)
                    })
                  }).catch(function(err){
                    reject(err)
                  })
                }).catch(function(err){
                  reject(err)
                })
              }
            }
          }
        })
      } else{
        reject({error:"Wrong device"})

      }
    } else {
      mobilemodem.configure(provider).then(function(){
        mobilemodem.connect().then(function(){
          resolve(success:true);
        }).catch(function(err){
          reject(err)
        })
      }).catch(function(err){
        reject(err)
      })

    }
  })
}

module.exports=function(provider,opt){
  return new Promise(function (resolve, reject) {

    var options={};
    options.timer=false;
    options.verbose=true;
    options.wvdialFile='/etc/wvdial.conf';
    options.dev=false;
    options.ifOffline=true;
    options.reconnect=false;
    options.retry=false;
    options.retryMax=false;

    merge(options,opt);

    if (provider && provider.apn){

      if(options.timer){

        setTimeout(function () {

          if(options.ifOffline){

            testConnection().then(function(){
              reject({online:true});
            }).catch(function(err){
              goconnect(provider,options).catch(function(err){
                reject(err)
              })
            })

          } else{

            goconnect(provider,options).catch(function(err){
              reject(err)
            })

          }
        }, options.timer);
      } else{

        if(options.ifOffline){

          testConnection().then(function(){
            reject({online:true});
          }).catch(function(err){
            goconnect(provider,options).catch(function(err){
              reject(err)
            })
          })

        } else{

          goconnect(provider,options).catch(function(err){
            reject(err)
          })

        }

      }

    } else{
      reject({error:"You must provide a valid Apn"})
    }

  })
}
