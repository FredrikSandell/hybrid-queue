
var q = 'tasks';

//var open = require('amqplib').connect('amqp://guest:guest@localhost:15674');
var open = require('amqplib').connect('amqp://localhost');

var fakeDatabase = [
  {
      id:'̈́userId1',
      permanentTerminals : [
          {
              id : '11111111111',
              type : 'android'
          }
      ]
  },
  {
      id: 'userId2',
      permanentTerminals : [
          {
              id : '22222222222',
              type : 'android'
          },
          {
              id : '33333333333',
              type : 'android'
          }
      ]
  }
];

function setupServer(channel) {
    channel.assertExchange('outbound', 'direct', {durable: false});
    return channel;
}

function setupUserExchanges(channel) {
    fakeDatabase.forEach(function(user) {
        var userOutboundEx = 'outbound_'+user.id;
        channel.assertExchange(userOutboundEx, 'fanout', {durable: false});
        channel.bindExchange(userOutboundEx, 'outbound', user.id, {durable:false});

        var ok = channel.assertExchange(ex, 'topic', {durable: false});
    });
}

// Publisher

// Consumer
open.then(function(conn) {
    conn.createChannel();
    setupServer(conn);
    setupUserExchanges(conn);

},function(error){
    console.log(error);
}).then(null, console.warn)


/*
open.then(function(conn) {
    var ok = conn.createChannel();
    ok = ok.then(function(ch) {
        ch.assertQueue(q);
        ch.consume(q, function(msg) {
            if (msg !== null) {
                console.log(msg.content.toString());
                ch.ack(msg);
            }
        });
    });
    return ok;
}).then(null, console.warn);
*/