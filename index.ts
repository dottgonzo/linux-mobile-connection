import * as pathExists from "path-exists";
import * as Promise from "bluebird";
import Wvdial = require("wvdialjs");
import testConnection = require('promise-test-connection');
import merge = require("json-add");
import lsusbdev = require('lsusbdev');
let timerdaemon = require('timerdaemon');
let verb = require('verbo');

function setfordev(provider:IClassProvider, options:IClassOpt) {
    var mobilemodem = new Wvdial(options.wvdialFile);

    return new Promise(function(resolve, reject) {

        if (pathExists.sync('/sys/bus/usb/devices/' + options.dev)) {

            lsusbdev().then(function(data: [{ type: string, dev: string, product: string, hub: string, id: string }]) {
                for (var i = 0; i < data.length; i++) {
                    var usb = data[i];
                    if (usb.type == 'serial' && usb.hub == options.dev) {

                        if (pathExists.sync(options.wvdialFile)) {
                            mobilemodem.setUsb(usb.dev).then(function() {
                                resolve({ success: true });
                            }).catch(function(err) {
                                reject(err)
                            })

                        } else {

                            mobilemodem.configure(provider).then(function() {
                                mobilemodem.setUsb(usb.dev).then(function() {
                                    resolve({ success: true });
                                }).catch(function(err) {
                                    reject(err)
                                    console.log('here8')

                                })
                            }).catch(function(err) {
                                reject(err)
                            })
                        }
                    } else {
                        reject("err")
                    }
                }
            })
        } else {
            reject({ error: "Wrong device" })

        }

    })
}


function goconnect(provider, options) {


    var mobilemodem = new Wvdial(options.wvdialFile);

    return new Promise(function(resolve, reject) {

        if (options.dev) {
            setfordev(provider, options).then(function() {
                mobilemodem.connect().then(function() {
                    resolve({ success: true });

                }).catch(function(err) {
                    reject(err);

                });
            }).catch(function(err) {
                reject(err)
            })

        } else {
            mobilemodem.configure(provider).then(function() {

                mobilemodem.connect().then(function() {
                    resolve({ success: true });

                }).catch(function(err) {
                    reject(err);

                });

            }).catch(function(err) {
                reject(err)
            })

        }
    })
}




interface IClassConf {
    verbose: boolean;
    wvdialFile: string;
    dev: any;
    ifOffline: boolean;
    retry: boolean;
}
interface IClassOpt {
    verbose?: boolean;
    wvdialFile?: string;
    dev?: any;
    ifOffline?: boolean;
    retry?: boolean;
}
interface IProvider {
    label: string;
    apn: string;
    phone?: string
    username?: string;
    password?: string;
}
interface IClassProvider {
    label?: string;
    apn: string;
    phone?: string
    username?: string;
    password?: string;
}


export =function(provider: IClassProvider, opt: IClassOpt) {
    return new Promise(function(resolve, reject) {

        let options: IClassConf = {
            verbose: true,
            wvdialFile: "/etc/wvdial.conf",
            dev: false,
            ifOffline: true,
            retry: true
        };

        //  options.retryMax=10;
        if (opt) {
            merge(options, opt);
        }
        if (provider && provider.apn) {
            if (options.retry && options.ifOffline) {
                if (options.dev) {
                    setfordev(provider, options).then(function() {
                        goconnect(provider, options).then(function() {
                            reject({ running: false, daemonized: true });
                        }).catch(function(err) {
                            reject(err);
                        })
                        timerdaemon.post(240000, function() {
                            testConnection().catch(function() {
                                goconnect(provider, options)
                            })
                        })
                    }).catch(function(err) {
                        reject(err)
                    })


                } else {

                    goconnect(provider, options).then(function() {
                        reject({ running: false, daemonized: true });

                    }).catch(function(err) {
                        reject(err);

                    })

                    timerdaemon.post(240000, function() {
                        testConnection().catch(function() {
                            goconnect(provider, options)
                        })
                    });
                }
            } else {

                if (options.ifOffline) {

                    if (options.dev) {
                        setfordev(provider, options).then(function() {
                            testConnection().then(function() {
                                reject({ online: true });
                            }).catch(function() {
                                goconnect(provider, options).then(function(data) {
                                    resolve(data);

                                }).catch(function(err) {
                                    reject(err)
                                })
                            })
                        }).catch(function(err) {
                            reject(err)
                        })
                    } else {
                        testConnection().then(function() {
                            reject({ online: true });
                        }).catch(function() {
                            goconnect(provider, options).then(function(data) {
                                resolve(data);

                            }).catch(function(err) {
                                reject(err)
                            })
                        })
                    }


                } else {
                    if (options.dev) {
                        setfordev(provider, options).then(function() {
                            goconnect(provider, options).then(function(answer) {
                                resolve(answer)

                            }).catch(function(err) {
                                reject(err)
                            })
                        }).catch(function(err) {
                            reject(err)
                        })
                    } else {
                        goconnect(provider, options).then(function(answer) {
                            resolve(answer)

                        }).catch(function(err) {
                            reject(err)
                        })

                    }
                }
            }

        } else {
            reject({ error: "You must provide a valid Apn" })
        }

    })
}
