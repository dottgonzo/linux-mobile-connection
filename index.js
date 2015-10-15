var Wvdial=require('wvdialjs'),
pathExists=require('path-exists'),
merge=require('json-add'),
timerdaemon=require('timerdaemon'),
Promise=require('promise')
lsusbdev=require('lsusbdev');


function setfordev(provider,options){
  var mobilemodem=new Wvdial(options.wvdialFile);

  return new Promise(function (resolve, reject) {
console.log('here1')
    if(pathExists.sync('/sys/bus/usb/devices/'+options.dev)){
      console.log('here2')

      lsusbdev().then(function(data){
        console.log('here3')

        for(var i=0;i<data.length;i++){
          var usb=data[i];

          if(usb.type=='serial'&&usb.hub==options.dev){
            if(pathExists.sync(options.wvdialFile)){
              mobilemodem.setUsb(usb.dev).then(function(){
                console.log('here5')

                resolve({success:true});
              }).catch(function(err){
                console.log('here7')

                reject(err)
              })

            } else{
              console.log('here4')

              mobilemodem.configure(provider).then(function(){
                console.log('here6')

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
          reject(err)
        })
      }).catch(function(err){
        reject(err)
      })

    } else {
      mobilemodem.configure(provider).then(function(){
        mobilemodem.connect().then(function(){
          resolve({success:true});
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
    options.verbose=true;
    options.wvdialFile='/etc/wvdial.conf';
    options.dev=false;
    options.ifOffline=true;
    options.retry=true;
  //  options.retryMax=10;
if(opt){
    merge(options,opt);
}
console.log(options)
console.log(provider)

 if (provider && provider.apn){

      if(options.retry && options.ifOffline){


        if(options.dev){

          console.log('hhh')

          setfordev(provider,options).then(function(){
console.log('set')

            resolve({running:true});

            timerdaemon.pre(60000,function () {


              testConnection().catch(function(){
                goconnect(provider,options)
              })


            })
          }).catch(function(err){
            reject(err)
          })


        } else{
          console.log('ttt')

          resolve({running:true});

          timerdaemon.pre(60000,function () {


            testConnection().catch(function(){
              goconnect(provider,options)
            })


          });
        }



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
