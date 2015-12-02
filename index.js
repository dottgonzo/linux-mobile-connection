var Wvdial=require('wvdialjs'),
pathExists=require('path-exists'),
merge=require('json-add'),
timerdaemon=require('timerdaemon'),
Promise=require('promise'),
verb=require('verbo'),
testConnection=require('promise-test-connection'),
lsusbdev=require('lsusbdev');


function setfordev(provider,options){
  var mobilemodem=new Wvdial(options.wvdialFile);

  return new Promise(function (resolve, reject) {

    if(pathExists.sync('/sys/bus/usb/devices/'+options.dev)){

      lsusbdev().then(function(data){


        for(var i=0;i<data.length;i++){
          var usb=data[i];

          if(usb.type=='serial'&&usb.hub==options.dev){
            if(pathExists.sync(options.wvdialFile)){
              mobilemodem.setUsb(usb.dev).then(function(){


                resolve({success:true});
              }).catch(function(err){


                reject(err)
              })

            } else{


              mobilemodem.configure(provider).then(function(){


                mobilemodem.setUsb(usb.dev).then(function(){
                  resolve({success:true});
                }).catch(function(err){
                  reject(err)
                  console.log('here8')

                })
              }).catch(function(err){
                reject(err)
              })
            }
          }
        }
      })
    }else{
      reject({error:"Wrong device"})

    }

  })
}


function goconnect(provider,options){


  var mobilemodem=new Wvdial(options.wvdialFile);

  return new Promise(function (resolve, reject) {

    if(options.dev){
      setfordev(provider,options).then(function(){
        mobilemodem.connect().then(function(){
          resolve({success:true});

        }).catch(function(err){
          reject(err);

        });
      }).catch(function(err){
        reject(err)
      })

    } else {
      mobilemodem.configure(provider).then(function(){

        mobilemodem.connect().then(function(){
          resolve({success:true});

        }).catch(function(err){
          reject(err);

        });

      }).catch(function(err){
        reject(err)
      })

    }
  })
}

module.exports=function(provider,opt){
  return new Promise(function (resolve, reject) {

    var options={};
    options.verbose=true;
    options.wvdialFile='/etc/wvdial.conf';
    options.dev=false;
    options.ifOffline=true;
    options.retry=true;
    //  options.retryMax=10;
    if(opt){
      merge(options,opt);
    }


    if (provider && provider.apn){

      if(options.retry && options.ifOffline){


        if(options.dev){


          setfordev(provider,options).then(function(){
            goconnect(provider,options).then(function(){
              reject({running:false,daemonized:true});

            }).catch(function(err){
              reject(err);

            })


            timerdaemon.post(240000,function () {
              testConnection().catch(function(){
                goconnect(provider,options)
              })


            })
          }).catch(function(err){
            reject(err)
          })


        } else{

          goconnect(provider,options).then(function(){
            reject({running:false,daemonized:true});

          }).catch(function(err){
            reject(err);

          })

          timerdaemon.post(240000,function () {
            testConnection().catch(function(){
              goconnect(provider,options)
            })


          });
        }



      } else{

        if(options.ifOffline){

          if(options.dev){
            setfordev(provider,options).then(function(){
              testConnection().then(function(){
                reject({online:true});
              }).catch(function(){
                goconnect(provider,options).then(function(data){
                  resolve(data);

                }).catch(function(err){
                  reject(err)
                })
              })
            }).catch(function(err){
              reject(err)
            })
          } else{
            testConnection().then(function(){
              reject({online:true});
            }).catch(function(){
              goconnect(provider,options).then(function(data){
                resolve(data);

              }).catch(function(err){
                reject(err)
              })
            })
          }


        } else{
          if(options.dev){
            setfordev(provider,options).then(function(){
              goconnect(provider,options).then(function(answer){
                resolve(answer)

              }).catch(function(err){
                reject(err)
              })
            }).catch(function(err){
              reject(err)
            })
          } else{
            goconnect(provider,options).then(function(answer){
              resolve(answer)

            }).catch(function(err){
              reject(err)
            })

          }
        }
      }

    } else{
      reject({error:"You must provide a valid Apn"})
    }

  })
}
