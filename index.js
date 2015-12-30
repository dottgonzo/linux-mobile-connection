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
                    }
                    else {
                        reject("err");
                    }
                }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbInNldGZvcmRldiIsImdvY29ubmVjdCJdLCJtYXBwaW5ncyI6IkFBQUEsSUFBWSxVQUFVLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDMUMsSUFBWSxPQUFPLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDcEMsSUFBWSxXQUFXLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDM0MsSUFBTyxNQUFNLFdBQVcsVUFBVSxDQUFDLENBQUM7QUFDcEMsSUFBTyxjQUFjLFdBQVcseUJBQXlCLENBQUMsQ0FBQztBQUMzRCxJQUFPLEtBQUssV0FBVyxVQUFVLENBQUMsQ0FBQztBQUNuQyxJQUFPLFFBQVEsV0FBVyxVQUFVLENBQUMsQ0FBQztBQUV0QyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFNUIsbUJBQW1CLFFBQWtCLEVBQUUsT0FBa0I7SUFDckRBLElBQUlBLFdBQVdBLEdBQUdBLElBQUlBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO0lBRWpEQSxNQUFNQSxDQUFDQSxJQUFJQSxPQUFPQSxDQUFDQSxVQUFTQSxPQUFPQSxFQUFFQSxNQUFNQTtRQUV2QyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekQsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVMsSUFBK0U7Z0JBQ3BHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ25DLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxRQUFRLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxPQUFP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Q0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDOzRCQUM5QixTQUFTLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFTLE1BQU07Z0NBQzdDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDcEIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVMsR0FBRztnQ0FDakIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUNoQixDQUFDLENBQUMsQ0FBQTt3QkFDTixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBUyxHQUFHOzRCQUNqQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2hCLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0osU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBUyxNQUFNOzRCQUM3QyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7d0JBQ25CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFTLEdBQUc7NEJBQ2pCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDZixDQUFDLENBQUMsQ0FBQztvQkFDUCxDQUFDO29CQUFBLENBQUM7Z0JBQ04sQ0FBQztnQkFBQSxDQUFDO1lBQ04sQ0FBQztZQUFBLENBQUM7UUFDTixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLEVBQUUsQ0FBQyxDQUFBO1FBQ3JELENBQUM7UUFBQSxDQUFDO0lBQ04sQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoRXhpc3RzIGZyb20gXCJwYXRoLWV4aXN0c1wiO1xuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tIFwiYmx1ZWJpcmRcIjtcbmltcG9ydCAqIGFzIHRpbWVyZGFlbW9uIGZyb20gXCJ0aW1lcmRhZW1vblwiO1xuaW1wb3J0IFd2ZGlhbCA9IHJlcXVpcmUoXCJ3dmRpYWxqc1wiKTtcbmltcG9ydCB0ZXN0Q29ubmVjdGlvbiA9IHJlcXVpcmUoJ3Byb21pc2UtdGVzdC1jb25uZWN0aW9uJyk7XG5pbXBvcnQgbWVyZ2UgPSByZXF1aXJlKFwianNvbi1hZGRcIik7XG5pbXBvcnQgbHN1c2JkZXYgPSByZXF1aXJlKCdsc3VzYmRldicpO1xuXG5sZXQgdmVyYiA9IHJlcXVpcmUoJ3ZlcmJvJyk7XG5cbmZ1bmN0aW9uIHNldGZvcmRldihwcm92aWRlcjpJUHJvdmlkZXIsIG9wdGlvbnM6SUNsYXNzQ29uZikge1xuICAgIGxldCBtb2JpbGVtb2RlbSA9IG5ldyBXdmRpYWwob3B0aW9ucy53dmRpYWxGaWxlKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICBpZiAocGF0aEV4aXN0cy5zeW5jKCcvc3lzL2J1cy91c2IvZGV2aWNlcy8nICsgb3B0aW9ucy5kZXYpKSB7XG5cbiAgICAgICAgICAgIGxzdXNiZGV2KCkudGhlbihmdW5jdGlvbihkYXRhOiBbeyB0eXBlOiBzdHJpbmcsIGRldjogc3RyaW5nLCBwcm9kdWN0OiBzdHJpbmcsIGh1Yjogc3RyaW5nLCBpZDogc3RyaW5nIH1dKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1c2IgPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNiLnR5cGUgPT0gJ3NlcmlhbCcgJiYgdXNiLmh1YiA9PSBvcHRpb25zLmRldikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aEV4aXN0cy5zeW5jKG9wdGlvbnMud3ZkaWFsRmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2JpbGVtb2RlbS5zZXRVc2IodXNiLmRldikudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vYmlsZW1vZGVtLmNvbmZpZ3VyZShwcm92aWRlcikudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9iaWxlbW9kZW0uc2V0VXNiKHVzYi5kZXYpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2hlcmU4JylcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoXCJlcnJcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QoeyBlcnJvcjogXCJXcm9uZyBkZXZpY2VcIiB9KVxuXG4gICAgICAgIH1cblxuICAgIH0pXG59XG5cblxuZnVuY3Rpb24gZ29jb25uZWN0KHByb3ZpZGVyOklQcm92aWRlciwgb3B0aW9uczpJQ2xhc3NDb25mKSB7XG5cblxuICAgIGxldCBtb2JpbGVtb2RlbSA9IG5ldyBXdmRpYWwob3B0aW9ucy53dmRpYWxGaWxlKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICBpZiAob3B0aW9ucy5kZXYpIHtcbiAgICAgICAgICAgIHNldGZvcmRldihwcm92aWRlciwgb3B0aW9ucykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBtb2JpbGVtb2RlbS5jb25uZWN0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtb2JpbGVtb2RlbS5jb25maWd1cmUocHJvdmlkZXIpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbW9iaWxlbW9kZW0uY29ubmVjdCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5cblxuXG5cbmludGVyZmFjZSBJQ2xhc3NDb25mIHtcbiAgICB2ZXJib3NlOiBib29sZWFuO1xuICAgIHd2ZGlhbEZpbGU6IHN0cmluZztcbiAgICBkZXY6IGFueTtcbiAgICBpZk9mZmxpbmU6IGJvb2xlYW47XG4gICAgcmV0cnk6IGJvb2xlYW47XG59O1xuaW50ZXJmYWNlIElDbGFzc09wdCB7XG4gICAgdmVyYm9zZT86IGJvb2xlYW47XG4gICAgd3ZkaWFsRmlsZT86IHN0cmluZztcbiAgICBkZXY/OiBhbnk7XG4gICAgaWZPZmZsaW5lPzogYm9vbGVhbjtcbiAgICByZXRyeT86IGJvb2xlYW47XG59O1xuaW50ZXJmYWNlIElQcm92aWRlciB7XG4gICAgbGFiZWw/OiBzdHJpbmc7XG4gICAgYXBuOiBzdHJpbmc7XG4gICAgcGhvbmU/OiBzdHJpbmdcbiAgICB1c2VybmFtZT86IHN0cmluZztcbiAgICBwYXNzd29yZD86IHN0cmluZztcbn07XG5cblxuZXhwb3J0ID1mdW5jdGlvbihwcm92aWRlcjogSVByb3ZpZGVyLCBvcHQ6IElDbGFzc09wdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICBsZXQgb3B0aW9uczogSUNsYXNzQ29uZiA9IHtcbiAgICAgICAgICAgIHZlcmJvc2U6IHRydWUsXG4gICAgICAgICAgICB3dmRpYWxGaWxlOiBcIi9ldGMvd3ZkaWFsLmNvbmZcIixcbiAgICAgICAgICAgIGRldjogZmFsc2UsXG4gICAgICAgICAgICBpZk9mZmxpbmU6IHRydWUsXG4gICAgICAgICAgICByZXRyeTogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vICBvcHRpb25zLnJldHJ5TWF4PTEwO1xuICAgICAgICBpZiAob3B0KSB7XG4gICAgICAgICAgICBtZXJnZShvcHRpb25zLCBvcHQpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIuYXBuKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5yZXRyeSAmJiBvcHRpb25zLmlmT2ZmbGluZSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmRldikge1xuICAgICAgICAgICAgICAgICAgICBzZXRmb3JkZXYocHJvdmlkZXIsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2Nvbm5lY3QocHJvdmlkZXIsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHsgcnVubmluZzogZmFsc2UsIGRhZW1vbml6ZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZXJkYWVtb24ucG9zdCgyNDAwMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb25uZWN0aW9uKCkuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvY29ubmVjdChwcm92aWRlciwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHsgcnVubmluZzogZmFsc2UsIGRhZW1vbml6ZWQ6IHRydWUgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcblxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHRpbWVyZGFlbW9uLnBvc3QoMjQwMDAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb25uZWN0aW9uKCkuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29jb25uZWN0KHByb3ZpZGVyLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmlmT2ZmbGluZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmRldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Zm9yZGV2KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDb25uZWN0aW9uKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHsgb25saW5lOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2Nvbm5lY3QocHJvdmlkZXIsIG9wdGlvbnMpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENvbm5lY3Rpb24oKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCh7IG9ubGluZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvY29ubmVjdChwcm92aWRlciwgb3B0aW9ucykudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmRldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Zm9yZGV2KHByb3ZpZGVyLCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvY29ubmVjdChwcm92aWRlciwgb3B0aW9ucykudGhlbihmdW5jdGlvbihhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhbnN3ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvY29ubmVjdChwcm92aWRlciwgb3B0aW9ucykudGhlbihmdW5jdGlvbihhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFuc3dlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdCh7IGVycm9yOiBcIllvdSBtdXN0IHByb3ZpZGUgYSB2YWxpZCBBcG5cIiB9KVxuICAgICAgICB9O1xuICAgIH0pO1xufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
