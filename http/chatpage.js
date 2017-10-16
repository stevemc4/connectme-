var sent = 0;
var socket = io("http://" + window.location.host);
var isTyping = false;
var params = new URLSearchParams(window.location.search);
window.onload = function () {
    if (params.get("username") != null) {
        //socket = io("http://" + window.location.host);
        var channelID = location.pathname.substr(1);
        if (channelID != "Global") {
            $(".roomName").text("#" + location.pathname.substr(1));
            document.title = "#" + location.pathname.substr(1) + " - ConnectMe";
        }
        else {
            $(".roomName").text("Ruangan Global");
            document.title = "#Global - ConnectMe";
        }
    }
};
socket.onconnect = function () {
    if (params.get("username") != null) {
        socket.connected = true;
        socket.disconnected = false;
        socket.emit('connect');
        socket.emitBuffered();
        socket.emit('join', params.get("username"), location.pathname.substr(1));
    }
    else {
        location.href = "/?tochannel=" + location.pathname.substr(1);
    }
    resetCounter();
};
socket.onclose = function () {
    console.log("ASD");
}
function resetCounter() {
    sent = 0;
    setTimeout(function () {
        resetCounter();
    }, 25000);
}
var lastSent;
function submitMsg() {
    if (sent < 8) {
        if ($(".input").val() != "") {
            if ($(".input").val().length < 1024) {
                isTyping = false;
                var a = new Object();
                a.val = $(".input").val();
                a.type = "text";
                lastSent = a.val;
                socket.emit("msg", JSON.stringify(a));
                sent++;
                var date = new Date();
                var minutes = date.getMinutes();
                var hour = date.getHours();
                if (minutes < 10) {
                    minutes = "0" + minutes;
                }
                if (hour < 10) {
                    hour = "0" + hour;
                }
                var final = hour + ":" + minutes
                $("#messages").append($('<li class="self">')
                    .append($("<span class='outer'>")
                        .append($("<span class='msg'>")
                            .text($(".input").val())
                            .append($("<span class='time'>")
                                .text(final)))));
                $(".input").val("");
                $("#messages").scrollTop($("#messages").prop('scrollHeight'));
            }
            else {
                alert("Teks terlalu panjang!");
                $(".input").val("");
            }

        }
    }
    else {
        $("#messages").append($('<li class="notification">').append($("<span>").text("Peringatan: Anda terlalu banyak mengirimkan pesan")));
        $("#messages").scrollTop($("#messages").prop('scrollHeight'));
        setTimeout(function () {
            resetCounter();
        }, 5000);
    }
}
var scrolling = false;
var isNewMessageShowing = false;
/*$("#messages").on('scroll', function(){
    console.log("gblg");
    
});*/

function scrolled() {
    scrolling = true;
}
socket.on('msg', function (msg) {
    var date = new Date();
    var minutes = date.getMinutes();
    var hour = date.getHours();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (hour < 10) {
        hour = "0" + hour;
    }
    var final = hour + ":" + minutes
    var content = JSON.parse(msg);
    if (content.type == "text")
        $("#messages")
            .append($('<li class="across">')
                .append($("<span class='outer'>")
                    .append($("<span class='msg'>")
                        .text(content.message)
                        .append($("<span class='time'>").text(final))
                        .append($("<span class='id'>").text(content.userID)))));
    else if (content.type == "image")
        $("#messages")
            .append($('<li class="across has-image">')
                .append($("<span class='outer'>")
                    .append($("<span class='msg'>")
                        .append("<img src='" + content.message + "'>")
                        .append($("<span class='time'>").text(final))
                        .append($("<span class='id'>").text(content.userID))
                        .append($("<a class='download' href='" + content.message + "' download='" + content.imgName + "'>").text("Download")))));
    else if (content.type == "file")
        $("#messages")
            .append($('<li class="across has-file">')
                .append($("<span class='outer'>")
                    .append($("<span class='msg'>")
                        .append($("<i class='icon'>").text("W"))
                        .append(content.fileName)
                        .append($("<span class='time'>").text(final))
                        .append($("<span class='id'>").text(content.userID))
                        .append($("<a class='download' href='" + content.message + "' download='" + content.fileName + "'>").text("Download")))));

    //if(!scrolling)
    //{
    $("#messages").scrollTop($("#messages").prop('scrollHeight'));
    /*}
    else
    {
        if(!isNewMessageShowing)
        {
            $(".chatNotifier").addClass("show");
            isNewMessageShowing = true;
        }
    }*/
});
socket.on('notification', function (msg) {
    if (msg.length < 64) {
        $("#messages").append($('<li class="notification">').append($("<span>").text(msg)));
    }
    else {
        $("#messages").append($('<li class="notification">').append($("<span>").text("Seorang pengguna bergabung")));
    }
    $("#messages").scrollTop($("#messages").prop('scrollHeight'));
});
socket.on('announcement', function (msg) {
    $("#messages").append($('<li class="notification announcement">').append($("<span>").text(msg)));
    $("#messages").scrollTop($("#messages").prop('scrollHeight'));
});
var isOtherUserTyping = false
socket.on('userCount', function (msg) {
    if (!isOtherUserTyping)
        $(".userIndicator").text(msg + " Orang");
});
socket.on('typing', function (user) {
    if (user != "!none") {
        isOtherUserTyping = true;
        $("h2.userIndicator").data('lastText', $(".userIndicator").text());
        $("h2.userIndicator").text(user + " sedang mengetik...");
    }
    else {
        isOtherUserTyping = false;
        socket.emit('getUsers');
    }
});
function setTyping() {
    if ($(".input").val() != "" && sent < 8) {
        if (!isTyping) {
            isTyping = true;
            socket.emit("typeStatus", true);
        }
    }
    else {
        socket.emit("typeStatus", false);
        isTyping = false;
    }
}
function uploadAttachment() {
    var file = document.querySelector('input[type=file]').files;
    var reader = new FileReader();
    var i = 0;
    reader.addEventListener("load", function () {
        //console.log(reader.result);
        var date = new Date();
        var minutes = date.getMinutes();
        var hour = date.getHours();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (hour < 10) {
            hour = "0" + hour;
        }
        var final = hour + ":" + minutes;
        var dataUrl = reader.result;
        if (file[i - 1].type.indexOf("image") > -1) {

            var imgUpload = new Object();
            imgUpload.type = "img";
            imgUpload.val = dataUrl;
            imgUpload.name = file[i - 1].name;
            socket.emit("msg", JSON.stringify(imgUpload));
            $("#messages").append($('<li class="self has-image">')
                .append($("<span class='outer'>")
                    .append($("<div class='msg'>")
                        .append("<img id='" + new Date().getTime() + "' onclick='previewImg(this)' src='" + dataUrl + "'>")
                        .append($("<span class='time'>")
                            .text(final)))));
        }
        else {
            var fileUpload = new Object();
            fileUpload.type = "file";
            if (file[i - 1].type != "")
                fileUpload.val = dataUrl;
            else {
                fileUpload.val = "data:application/octet-stream" + dataUrl.substr(5);
            }
            fileUpload.name = file[i - 1].name;
            fileUpload.size = (file[i - 1].size / 1024000).toPrecision(2);
            socket.emit("msg", JSON.stringify(fileUpload));
            $("#messages").append($('<li class="self has-file">')
                .append($("<span class='outer'>")
                    .append($("<div class='msg'>")
                        .append($("<i class='icon'>").text("W"))
                        .append(file[i - 1].name)
                        .append($("<span class='time'>")
                            .text(final)))));
        }
        $("#file").val("");
        document.querySelector('input[type=file]').files[i - 1] = null;
        if ($("#input").val() != "") {
            submitMsg();
            isTyping = false;
        }
        else {
            sent++;
        }
        $("#messages").scrollTop($("#messages").prop('scrollHeight'));
    }, false);

    if (file) {
        for (i; i < file.length; i++) {
            if (file[i].type != "") {
                if ((file[i].size / 1024000) <= 50) {
                    reader.readAsDataURL(file[i]);
                }
                else {
                    alert("Ukuran file terlalu besar");
                }
            }
            else {
                alert("File tidak didukung");
            }
        }
    }
}

function attach() {
    $("#file").click();

}
function copyShare() {
    var link = location.host + location.pathname;
    var textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = 0;
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
        $("#messages").append($('<li class="notification announcement">').append($("<span>").text("Link: ").append($("<a>").text(link).attr('href', link))));
        $("#messages").append($('<li class="notification announcement">').append($("<span>").text("Link telah disalin")));
        $("#messages").scrollTop($("#messages").prop('scrollHeight'));

    } catch (err) {
        console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
}

function previewImg(e)
{
    console.log(e);
    $(e).offsetParent.addClass("show");
}