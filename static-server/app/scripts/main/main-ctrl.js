'use strict';

angular.module('famousAngularStarter')
    .controller('MainCtrl', ['$scope','$famous','StompClientFactory', function ($scope, $famous, StompClientFactory) {
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

        StompClientFactory.then(function success(client){
            console.log('connected to rabbitmq');

            //using it wih permanent queues
            client.listenTo('/amq/queue/a-client', function(data) {
                console.log('got this on a-client queue:');
                console.log(data.body);
            });
            var send = client.makeSender('/amq/queue/a-client');
            send({
                msg: '123',
                status: true
            });

            //Using it with temporary queues
            client.listenTo('/queue/temporary-client', function(msg) {
                console.log('got this on tqueue queue:');
                console.log(msg.body);
                client.send(msg.headers['reply-to'], {
                    msg: "got the message on the temporary queue"
                });
            });

            var temporarySender = client.makeTempSender('/queue/temporary-client',function(d){
                console.log("Got this back on the tmp queue"+d);
                console.log(d);
            });
            temporarySender({
                msg: "temporaryMsg"
            });
        }, function error() {
            console.log('failed to connect to rabbitmq');
        });

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

        //The stomp interface presented to the rest of the angular app
        function makeWrappedClient(stompClient) {
            var that = {};
            var listenerIds = [];
            function makeListenerId() {
                var listenerId = Guid.generate();
                listenerIds.push(listenerId);
                return listenerId;
            };
            that.makeSender = function(sendDestination) {
                return function(data) {
                    stompClient.send(sendDestination, {'content-type':'application/json'}, JSON.stringify(data));
                };
            };
            that.makeTempSender = function(sendDestination, callback) {
                var listenerId = makeListenerId();
                var temporaryQueue = '/temp-queue/'+listenerId;
                _self.registerListener(listenerId, temporaryQueue, callback);
                return function(msgBody) {
                    stompClient.send( sendDestination, {
                        'reply-to': temporaryQueue,
                        'content-type':'application/json'
                    }, JSON.stringify(msgBody));
                };
            };
            that.send = function(sendDestination, msgBody) {
                stompClient.send(sendDestination, {'content-type':'application/json'}, JSON.stringify(msgBody));
            };
            that.listenTo = function(receiveDestination, callback) {
                var listenerId = makeListenerId();
                _self.registerListener(listenerId, receiveDestination, callback);
                _self.stompListenTo(receiveDestination);
            };
            that.destroy = function() {
                angular.forEach(listenerIds, function(listenerId) {
                    _self.removeListener(listenerId);
                });
            };
            return that;
        };

        //Listeners are the local callbacks, they are all associated with a destination
        var listeners = {};
        _self.registerListener = function(id, destination, func) {
            listeners[id] = {
                destination : destination,
                listenFunction : func
            };
        };
        _self.removeListener = function(id) {
            delete listeners[id];
        };

        //Here is where the local routing happens.
        function notifyListeners(msg) {
            angular.forEach(listeners, function(listener) {
                if(listener.destination === msg.headers.destination) {
                    msg.body = JSON.parse(msg.body);
                    listener.listenFunction(msg);
                }
            });
        };
        _self.stompListenTo = function(destination) {
            stompClient.subscribe(destination, function(d) {
                notifyListeners(d);
            });
        };

        var on_connect = function(x) {
            deferred.resolve(makeWrappedClient(stompClient));
        };
        var on_error =  function() {
            deferred.reject("Failed to connect to message broker");
        };

        //Called when messages are received on a temporary channel
        stompClient.onreceive = function(m) {
            notifyListeners(m);
        };

        stompClient.connect('guest', 'guest', on_connect, on_error, '/');

        return deferred.promise;
    }]);