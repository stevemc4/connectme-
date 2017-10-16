var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var reqs;
var users = {};
var peer = {};
var typingUser = {};
var loginCount = {};
app.use(express.static(__dirname + '/http'));
app.get('/:roomID', function(req, res)
{
  
  if(req.params.roomID != "")
  {
    if(loginCount[req.ip] == undefined)
    {
      loginCount[req.ip] = 0;
    }
    if(loginCount[req.ip] < 10)
    {
      res.sendFile(__dirname + "/http/chat.html");
      if(req.ip != "::1" && req.ip !="127.0.0.1")
      {
        loginCount[req.ip]++;
      }
    }
    else
    {
      res.sendFile(__dirname + "/http/nologin.html");
      setTimeout(function() {
        loginCount[req.ip] = 0;
      }, 20000);
    }
  }
});


io.on('connection', function(socket){
  var currentChannel = "public";
  socket.on('join', function(name, channel)
  {
      currentChannel = channel;
      users[socket.id] = name;
      if(peer[channel] > -1)
      {
        peer[channel]++;
      }
      else
      {
          peer[channel] = 1;
      }
      socket.join(channel);
      io.in(channel).emit('userCount', peer[channel]);
      console.log('user ' + name + ' connected to ' + channel);
      socket.in(channel).broadcast.emit('notification', name + " bergabung")
      socket.emit("notification", "Berhasil bergabung dengan channel #" + currentChannel);
      
  });
  socket.on('getUsers', function(){
    io.in(currentChannel).emit('userCount', peer[currentChannel]);
  })
  socket.on('disconnect', function(){
    console.log(users[socket.id] + ' disconnected');
    socket.in(currentChannel).broadcast.emit('notification', users[socket.id] + " meninggalkan ruangan");
    socket.emit("notification", "You have left this room");
    peer[currentChannel]--;
    io.in(currentChannel).emit('userCount', peer[currentChannel]);
	});
  socket.on('msg', function(msg){
    var inc = JSON.parse(msg);
    var msgJSON = new Object();
    msgJSON.userID = users[socket.id];
    if(inc.type=="text")
    {
      msgJSON.type = "text";
      msgJSON.message = inc.val;
      console.log("[#"+ currentChannel + "] " + msgJSON.userID +  ": " + msgJSON.message);
      socket.in(currentChannel).broadcast.emit('msg', JSON.stringify(msgJSON));
    }
    else if(inc.type=="img")
    {
      msgJSON.type = "image";
      msgJSON.message = inc.val;
      msgJSON.imgName = inc.name;
      console.log("[#"+ currentChannel + "] " + msgJSON.userID +  " sends a picture");
      socket.in(currentChannel).broadcast.emit('msg', JSON.stringify(msgJSON));
    }
    else if(inc.type == "file")
    {
      msgJSON.type = "file";
      msgJSON.message = inc.val;
      msgJSON.fileName = inc.name;
      msgJSON.size = inc.size;
      console.log("[#"+ currentChannel + "] " + msgJSON.userID +  " sends a file");
      socket.in(currentChannel).broadcast.emit('msg', JSON.stringify(msgJSON));
    }
  });
  socket.on('typeStatus', function(stat){
    if(stat)
    {
      if(typingUser[currentChannel] > -1)
      {
        typingUser[currentChannel]++;
      }
      else
      {
        typingUser[currentChannel] = 1;
      }
      if(typingUser[currentChannel] < 2)

      socket.in(currentChannel).broadcast.emit("typing", users[socket.id]);
      else socket.in(currentChannel).broadcast.emit("typing", typingUser[currentChannel] + " orang");
    }
    else
    {
      typingUser[currentChannel]--;
      if(typingUser[currentChannel] > 1)
      {
        socket.in(currentChannel).broadcast.emit("typing", typingUser[currentChannel] + " orang");
      }
      else if (typingUser[currentChannel] == 1)
      {
        //socket.in(currentChannel).broadcast.emit("typing", users[socket.id]);
      }
      else
      socket.in(currentChannel).broadcast.emit("typing", "!none");
    }
  });
});
http.listen(3000, function(){
  console.log('ConnectMe Server');
  console.log('listening on *:3000');
  console.log("Type \"Help\" to see available commands");

});

var stdin = process.openStdin();
stdin.addListener("data", function(e){
  var string = e.toString().trim();
  if(string.indexOf("broadcast") > -1)
  {
    io.emit("announcement", "SYS: " + string.substr(9));
    console.log("Message sent");
  }
  if(string.indexOf("notice") > -1)
  {
    io.emit("announcement", "NOTICE: " + string.substr(6));
    console.log("Users Noticed");
  }
  else
  {
    console.log("Unknown Command");
  }
});