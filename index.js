var pathExists = require("path-exists");
var Promise = require("bluebird");
var timerdaemon = require("timerdaemon");
var Wvdial = require("wvdialjs");
var testConnection = require('promise-test-connection');
var merge = require("json-add");
var lsusbdev = require('lsusbdev');
var verb = require('verbo');
function setfordev(provider, options) {
    var mobilemodem = new Wvdial(options.wvdialFile);
    return new Promise(function (resolve, reject) {
        if (pathExists.sync('/sys/bus/usb/devices/' + options.dev)) {
            lsusbdev().then(function (data) {
                for (var i = 0; i < data.length; i++) {
                    var usb = data[i];
                    if (usb.type == 'serial' && usb.hub == options.dev) {
                        if (pathExists.sync(options.wvdialFile)) {
                            mobilemodem.setUsb(usb.dev).then(function () {
                                resolve({ success: true });
                            }).catch(function (err) {
                                reject(err);
                            });
                        }
                        else {
                            mobilemodem.configure(provider).then(function () {
                                mobilemodem.setUsb(usb.dev).then(function () {
                                    resolve({ success: true });
                                }).catch(function (err) {
                                    reject(err);
                                    console.log('here8');
                                });
                            }).catch(function (err) {
                                reject(err);
                            });
                        }
                        ;
                    }
                    else {
                        reject("err");
                    }
                    ;
                }
                ;
            });
        }
        else {
            reject({ error: "Wrong device" });
        }
    });
}
function goconnect(provider, options) {
    var mobilemodem = new Wvdial(options.wvdialFile);
    return new Promise(function (resolve, reject) {
        if (options.dev) {
            setfordev(provider, options).then(function () {
                mobilemodem.connect().then(function () {
                    resolve({ success: true });
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        }
        else {
            mobilemodem.configure(provider).then(function () {
                mobilemodem.connect().then(function () {
                    resolve({ success: true });
                }).catch(function (err) {
                    reject(err);
                });
            }).catch(function (err) {
                reject(err);
            });
        }
        ;
    });
}
;
;
;
;
module.exports = function (provider, opt) {
    return new Promise(function (resolve, reject) {
        var options = {
            verbose: true,
            wvdialFile: "/etc/wvdial.conf",
            dev: false,
            ifOffline: true,
            retry: true
        };
        if (opt) {
            merge(options, opt);
        }
        ;
        if (provider && provider.apn) {
            if (options.retry && options.ifOffline) {
                if (options.dev) {
                    setfordev(provider, options).then(function () {
                        goconnect(provider, options).then(function () {
                            reject({ running: false, daemonized: true });
                        }).catch(function (err) {
                            reject(err);
                        });
                        timerdaemon.post(240000, function () {
                            testConnection().catch(function () {
                                goconnect(provider, options);
                            });
                        });
                    }).catch(function (err) {
                        reject(err);
                    });
                }
                else {
                    goconnect(provider, options).then(function () {
                        reject({ running: false, daemonized: true });
                    }).catch(function (err) {
                        reject(err);
                    });
                    timerdaemon.post(240000, function () {
                        testConnection().catch(function () {
                            goconnect(provider, options);
                        });
                    });
                }
                ;
            }
            else {
                if (options.ifOffline) {
                    if (options.dev) {
                        setfordev(provider, options).then(function () {
                            testConnection().then(function () {
                                reject({ online: true });
                            }).catch(function () {
                                goconnect(provider, options).then(function (data) {
                                    resolve(data);
                                }).catch(function (err) {
                                    reject(err);
                                });
                            });
                        }).catch(function (err) {
                            reject(err);
                        });
                    }
                    else {
                        testConnection().then(function () {
                            reject({ online: true });
                        }).catch(function () {
                            goconnect(provider, options).then(function (data) {
                                resolve(data);
                            }).catch(function (err) {
                                reject(err);
                            });
                        });
                    }
                }
                else {
                    if (options.dev) {
                        setfordev(provider, options).then(function () {
                            goconnect(provider, options).then(function (answer) {
                                resolve(answer);
                            }).catch(function (err) {
                                reject(err);
                            });
                        }).catch(function (err) {
                            reject(err);
                        });
                    }
                    else {
                        goconnect(provider, options).then(function (answer) {
                            resolve(answer);
                        }).catch(function (err) {
                            reject(err);
                        });
                    }
                    ;
                }
                ;
            }
            ;
        }
        else {
            reject({ error: "You must provide a valid Apn" });
        }
        ;
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbInNldGZvcmRldiIsImdvY29ubmVjdCJdLCJtYXBwaW5ncyI6IkFBQUEsSUFBWSxVQUFVLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDMUMsSUFBWSxPQUFPLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDcEMsSUFBWSxXQUFXLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDM0MsSUFBTyxNQUFNLFdBQVcsVUFBVSxDQUFDLENBQUM7QUFDcEMsSUFBTyxjQUFjLFdBQVcseUJBQXlCLENBQUMsQ0FBQztBQUMzRCxJQUFPLEtBQUssV0FBVyxVQUFVLENBQUMsQ0FBQztBQUNuQyxJQUFPLFFBQVEsV0FBVyxVQUFVLENBQUMsQ0FBQztBQUV0QyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFNUIsbUJBQW1CLFFBQWtCLEVBQUUsT0FBa0I7SUFDckRBLElBQUlBLFdBQVdBLEdBQUdBLElBQUlBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO0lBRWpEQSxNQUFNQSxDQUFDQSxJQUFJQSxPQUFPQSxDQUFDQSxVQUFTQSxPQUFPQSxFQUFFQSxNQUFNQTtRQUV2QyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekQsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVMsSUFBK0U7Z0JBQ3BHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ25DLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxRQUFRLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxPQUFP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QUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ2QsU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7NEJBQzlCLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsTUFBTTtnQ0FDN0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzRCQUNwQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBUyxHQUFHO2dDQUNqQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ2hCLENBQUMsQ0FBQyxDQUFBO3dCQUNOLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFTLEdBQUc7NEJBQ2pCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDaEIsQ0FBQyxDQUFDLENBQUM7b0JBQ1AsQ0FBQztvQkFBQyxJQUFJLENBQUMsQ0FBQzt3QkFDSixTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFTLE1BQU07NEJBQzdDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTt3QkFDbkIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVMsR0FBRzs0QkFDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUNmLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUM7b0JBQUEsQ0FBQztnQkFDTixDQUFDO2dCQUFBLENBQUM7WUFDTixDQUFDO1lBQUEsQ0FBQztRQUNOLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSw4QkFBOEIsRUFBRSxDQUFDLENBQUE7UUFDckQsQ0FBQztRQUFBLENBQUM7SUFDTixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGhFeGlzdHMgZnJvbSBcInBhdGgtZXhpc3RzXCI7XG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gXCJibHVlYmlyZFwiO1xuaW1wb3J0ICogYXMgdGltZXJkYWVtb24gZnJvbSBcInRpbWVyZGFlbW9uXCI7XG5pbXBvcnQgV3ZkaWFsID0gcmVxdWlyZShcInd2ZGlhbGpzXCIpO1xuaW1wb3J0IHRlc3RDb25uZWN0aW9uID0gcmVxdWlyZSgncHJvbWlzZS10ZXN0LWNvbm5lY3Rpb24nKTtcbmltcG9ydCBtZXJnZSA9IHJlcXVpcmUoXCJqc29uLWFkZFwiKTtcbmltcG9ydCBsc3VzYmRldiA9IHJlcXVpcmUoJ2xzdXNiZGV2Jyk7XG5cbmxldCB2ZXJiID0gcmVxdWlyZSgndmVyYm8nKTtcblxuZnVuY3Rpb24gc2V0Zm9yZGV2KHByb3ZpZGVyOklQcm92aWRlciwgb3B0aW9uczpJQ2xhc3NDb25mKSB7XG4gICAgbGV0IG1vYmlsZW1vZGVtID0gbmV3IFd2ZGlhbChvcHRpb25zLnd2ZGlhbEZpbGUpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgIGlmIChwYXRoRXhpc3RzLnN5bmMoJy9zeXMvYnVzL3VzYi9kZXZpY2VzLycgKyBvcHRpb25zLmRldikpIHtcblxuICAgICAgICAgICAgbHN1c2JkZXYoKS50aGVuKGZ1bmN0aW9uKGRhdGE6IFt7IHR5cGU6IHN0cmluZywgZGV2OiBzdHJpbmcsIHByb2R1Y3Q6IHN0cmluZywgaHViOiBzdHJpbmcsIGlkOiBzdHJpbmcgfV0pIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzYiA9IGRhdGFbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2IudHlwZSA9PSAnc2VyaWFsJyAmJiB1c2IuaHViID09IG9wdGlvbnMuZGV2KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoRXhpc3RzLnN5bmMob3B0aW9ucy53dmRpYWxGaWxlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vYmlsZW1vZGVtLnNldFVzYih1c2IuZGV2KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2JpbGVtb2RlbS5jb25maWd1cmUocHJvdmlkZXIpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vYmlsZW1vZGVtLnNldFVzYih1c2IuZGV2KS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaGVyZTgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFwiZXJyXCIpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdCh7IGVycm9yOiBcIldyb25nIGRldmljZVwiIH0pO1xuICAgICAgICB9XG5cbiAgICB9KVxufVxuXG5cbmZ1bmN0aW9uIGdvY29ubmVjdChwcm92aWRlcjpJUHJvdmlkZXIsIG9wdGlvbnM6SUNsYXNzQ29uZikge1xuXG4gICAgbGV0IG1vYmlsZW1vZGVtID0gbmV3IFd2ZGlhbChvcHRpb25zLnd2ZGlhbEZpbGUpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgICAgIGlmIChvcHRpb25zLmRldikge1xuICAgICAgICAgICAgc2V0Zm9yZGV2KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG1vYmlsZW1vZGVtLmNvbm5lY3QoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vYmlsZW1vZGVtLmNvbmZpZ3VyZShwcm92aWRlcikudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBtb2JpbGVtb2RlbS5jb25uZWN0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuXG5pbnRlcmZhY2UgSUNsYXNzQ29uZiB7XG4gICAgdmVyYm9zZTogYm9vbGVhbjtcbiAgICB3dmRpYWxGaWxlOiBzdHJpbmc7XG4gICAgZGV2OiBhbnk7XG4gICAgaWZPZmZsaW5lOiBib29sZWFuO1xuICAgIHJldHJ5OiBib29sZWFuO1xufTtcblxuaW50ZXJmYWNlIElDbGFzc09wdCB7XG4gICAgdmVyYm9zZT86IGJvb2xlYW47XG4gICAgd3ZkaWFsRmlsZT86IHN0cmluZztcbiAgICBkZXY/OiBhbnk7XG4gICAgaWZPZmZsaW5lPzogYm9vbGVhbjtcbiAgICByZXRyeT86IGJvb2xlYW47XG59O1xuXG5pbnRlcmZhY2UgSVByb3ZpZGVyIHtcbiAgICBsYWJlbD86IHN0cmluZztcbiAgICBhcG46IHN0cmluZztcbiAgICBwaG9uZT86IHN0cmluZ1xuICAgIHVzZXJuYW1lPzogc3RyaW5nO1xuICAgIHBhc3N3b3JkPzogc3RyaW5nO1xufTtcblxuXG5leHBvcnQgPSBmdW5jdGlvbihwcm92aWRlcjogSVByb3ZpZGVyLCBvcHQ6IElDbGFzc09wdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICBsZXQgb3B0aW9uczogSUNsYXNzQ29uZiA9IHtcbiAgICAgICAgICAgIHZlcmJvc2U6IHRydWUsXG4gICAgICAgICAgICB3dmRpYWxGaWxlOiBcIi9ldGMvd3ZkaWFsLmNvbmZcIixcbiAgICAgICAgICAgIGRldjogZmFsc2UsXG4gICAgICAgICAgICBpZk9mZmxpbmU6IHRydWUsXG4gICAgICAgICAgICByZXRyeTogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vICBvcHRpb25zLnJldHJ5TWF4PTEwO1xuICAgICAgICBpZiAob3B0KSB7XG4gICAgICAgICAgICBtZXJnZShvcHRpb25zLCBvcHQpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIuYXBuKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZXRyeSAmJiBvcHRpb25zLmlmT2ZmbGluZSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmRldikge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgc2V0Zm9yZGV2KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCh7IHJ1bm5pbmc6IGZhbHNlLCBkYWVtb25pemVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVyZGFlbW9uLnBvc3QoMjQwMDAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q29ubmVjdGlvbigpLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2Nvbm5lY3QocHJvdmlkZXIsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGdvY29ubmVjdChwcm92aWRlciwgb3B0aW9ucykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCh7IHJ1bm5pbmc6IGZhbHNlLCBkYWVtb25pemVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHRpbWVyZGFlbW9uLnBvc3QoMjQwMDAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb25uZWN0aW9uKCkuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pZk9mZmxpbmUpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5kZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldGZvcmRldihwcm92aWRlciwgb3B0aW9ucykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q29ubmVjdGlvbigpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCh7IG9ubGluZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb25uZWN0aW9uKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoeyBvbmxpbmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2Nvbm5lY3QocHJvdmlkZXIsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRmb3JkZXYocHJvdmlkZXIsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFuc3dlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5zd2VyKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KHsgZXJyb3I6IFwiWW91IG11c3QgcHJvdmlkZSBhIHZhbGlkIEFwblwiIH0pXG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
