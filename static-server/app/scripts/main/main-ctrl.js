'use strict';


function makeStompClient(IdProvider, $q) {
    var self = {};

    var ws = new SockJS('http://' + window.location.hostname + ':15674/stomp');
    var stompClient = Stomp.over(ws);
    // SockJS does not support heart-beat: disable heart-beats
    stompClient.heartbeat.outgoing = 0;
    stompClient.heartbeat.incoming = 0;

    var deferred = $q.defer();

    function makeWrappedClient(stompClient) {
        var that = {};
        that.sendQ = function(id, data) {
            stompClient.send('/queue/'+id, {"content-type":"application/json"}, JSON.stringify(data));
        };
        that.sendT = function(id, data) {
            stompClient.send('/topic/'+id, {"content-type":"application/json"}, JSON.stringify(data));
        };
        return that;
    };

    var listeners = [];
    self.registerListener = function(id, func) {
        listeners[id] = func;
    };
    self.removeListener = function(id) {

    }

    var notifyListeners = function (data) {
        angular.forEach(listeners, function(listener) {
            listener(data);
        });
    };

    IdProvider.getId().then(function success(data){
        var on_connect = function(x) {
            stompClient.subscribe("/topic/"+data.id, function(d) {
                console.log(d.body);
                notifyListeners(JSON.parse(d.body));
            });
            deferred.resolve(makeWrappedClient(stompClient));
        };
        var on_error =  function() {
            console.log('error');
            throw "Failed to connect to message broker";
        };
        stompClient.connect('guest', 'guest', on_connect, on_error, '/');
    }, function error(reason){

    });
    self.getClient = function(){
        return deferred.promise;
    };
    return self;
};

angular.module('famousAngularStarter')
    .controller('MainCtrl', ['$scope','$famous','StompService', function ($scope, $famous, StompService) {
        var Transitionable = $famous['famous/transitions/Transitionable'];
        var Timer = $famous['famous/utilities/Timer'];

        $scope.spinner = {
            speed: 55
        };
        $scope.rotateY = new Transitionable(0);

        //run function on every tick of the Famo.us engine
        Timer.every(function () {
            var adjustedSpeed = parseFloat($scope.spinner.speed) / 1200;
            $scope.rotateY.set($scope.rotateY.get() + adjustedSpeed);
        }, 1);

    }])
    .service('IdProvider', ['$q', function($q) {
        var self = {};
        self.getId = function() {
            var deferred = $q.defer();
            deferred.resolve("client1");
            return deferred.promise()
        };
        return self;
    }])
    .service('Guid',[function() {
        return {
            generate : function() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }
        }
    }])
    .service('StompClientFactory', ['$q', 'Guid', function($q, Guid) {
        var _self = {};

        var ws = new SockJS('http://' + window.location.hostname + ':15674/stomp');
        var stompClient = Stomp.over(ws);
        // SockJS does not support heart-beat: disable heart-beats
        stompClient.heartbeat.outgoing = 0;
        stompClient.heartbeat.incoming = 0;

        var deferred = $q.defer();

        function makeWrappedClient(stompClient) {
            var that = {};
            var listenerIds = [];
            var makeListenerId = function() {
                var listenerId = Guid();
                listenerIds.push(listenerId);
                return listenerId;
            };
            that.makeSender = function(destination) {
                return function(data) {
                    stompClient.send(destination, {'content-type':'application/json'}, JSON.stringify(data));
                };
            };
            that.makeTempSender = function(destination, callback) {
                var listenerId = makeListenerId();
                var temporaryQueue = '/temp-queue/'+listenerId;
                _self.registerListener(listenerId, destination, callback);
                return function(data) {
                    stompClient.send( id, {
                        'reply-to': temporaryQueue,
                        'content-type':'application/json'
                    }, JSON.stringify(data));
                };
            };
            that.listenTo = function(destination, callback) {
                var listenerId = makeListenerId();
                _self.registerListener(listenerId, destination, callback);
            };
            that.destroy = function() {
                angular.forEach(listenerIds, function(listenerId) {
                    _self.removeListener(listenerId);
                });
            };
            return that;
        };

        var listeners = [];
        _self.registerListener = function(id, destination, func) {
            listeners[id] = {
                destination : destination,
                listenFunction : func
            };
        };
        _self.removeListener = function(id) {
            delete listeners[id];
        };

        var notifyListeners = function (data) {
            angular.forEach(listeners, function(listener) {
                if(listener.destination === data.headers.destination) {
                    listener.listenFunction(JSON.parse(data.data));
                }
            });
        };

        var on_connect = function(x) {
            stompClient.subscribe(subscribeTo, function(d) {
                console.log("Message received on permanent channel: "+JSON.stringify(d));
                notifyListeners(d);
            });
            deferred.resolve(makeWrappedClient(stompClient));
        };
        var on_error =  function() {
            console.log('error');
            throw "Failed to connect to message broker";
        };
        stompClient.onreceive = function(m) {
            console.log("Message on temporary channel: "+JSON.stringify(m));
            notifyListeners(m);
        }
        stompClient.connect('guest', 'guest', on_connect, on_error, '/');

        return deferred.promise;

        return _self;
    }])
    .service('AuthenticationService',['$q','StompClientFactory', function($q, StopClientFactory){
        var self = {};


    }]);
    /*
    .service('StompService', ['$http','IdProvider', function ($http, IdProvider) {
        var self = {};

        // Stomp.js boilerplate
        var ws = new SockJS('http://' + window.location.hostname + ':15674/stomp');
        var client = Stomp.over(ws);
        // SockJS does not support heart-beat: disable heart-beats
        client.heartbeat.outgoing = 0;
        client.heartbeat.incoming = 0;

        var deferred = $q.defer();

        var wrappedClient = (function() {
            var that = {};
            that.send = function(data) {
                client.send('/queue/server', {"content-type":"application/json"}, JSON.stringify(data));
            };
            that.sendQ = function(id, data) {
                client.send('/queue/'+id, {"content-type":"application/json"}, JSON.stringify(data));
            };
            that.sendT = function(id, data) {
                client.send('/topic/'+id, {"content-type":"application/json"}, JSON.stringify(data));
            };
            return that;
        })();

        var listeners = [];
        self.registerListener = function(id, func) {
            listeners[id] = func;
        };
        self.removeListener = function(id) {

        }

        var notifyListeners = function (data) {
            angular.forEach(listeners, function(listener) {
                listener(data);
            });
        };

        IdProvider.getId().then(function success(data){
            var on_connect = function(x) {
                client.subscribe("/topic/"+data.id, function(d) {
                    console.log(d.body);
                    notifyListeners(JSON.parse(d.body));
                });
                deferred.resolve(wrappedClient);
                //client.send('/queue/test', {"content-type":"text/plain"}, 'one two three');
            };
            var on_error =  function() {
                console.log('error');
                throw "Failed to connect to message broker";
            };
            client.connect('guest', 'guest', on_connect, on_error, '/');
        }, function error(reason){

        });
        self.getClient = function(){
            return deferred.promise;
        };
        return self;
    }]);*/
