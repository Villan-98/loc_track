const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const translate = require('translate-api')
const languages = require('language-list')();
const app = express()

const server = http.createServer(app)
const io = socketio(server)

let socketIdName = {}
let msg
let transText = 'latitude';
let language='hi'

console.log(languages.getLanguageName('zh-CN')); // Bihari
console.log(languages.getLanguageCode('urdu'))
translate.getText(transText,{to: "ur"}).then(function(data){
    msg=data.text
    console.log(msg)
}).catch();
io.on('connection', function (socket) {
    console.log('Socket connected ' + socket.id)

    function user_list()
    {
        var x


        for(x in socketIdName){
            var y

            let userList={}
            for(y in socketIdName) {
                userList[y] = {username: socketIdName[y].username}
                if(x===y){
                    userList[y] = {username: "You"}
                }
            }
            io.to(x).emit("user_list",userList)
        }

    }
    socket.on('disconnect',function(data)
    {
        console.log("socket disconnected")
        delete socketIdName[socket.id]
        console.log("length of socketid"+socketIdName.length)
        user_list()
    })
    socket.on('login', (data) => {
        console.log(data.language)
        socketIdName[socket.id] = {username:data.username,got_loc_permission:0,per_of:{},lang_code:"en"}
        socket.join(data.username)                                              //why this function is here
        user_list()                 //to update the list of online user
        io.emit('logged_in',
            {
                success: true,
                socket_id:socket.id
            })
    })
    ///////////////to show the location of multiple person on the map//////////
    socket.on('get_all',(data)=>{
        let cordinate={}
        let x
        let j=0
        console.log("get all is"+(socketIdName[socket.id].per_of).length)
        for(x in socketIdName[socket.id].per_of){
            let id=socketIdName[socket.id].per_of[x]
            cordinate[id]={username:'',lat:'',long:''}
            cordinate[id]["username"]=socketIdName[id].username
            cordinate[id]['lat']=socketIdName[id].lat
            cordinate[id]['long']=socketIdName[id].long

        }
        socket.emit("take_cord",cordinate)
    })
    ////////////language input//////////////
    socket.on('enter_language',(data)=>{
        let converted_code=(languages.getLanguageCode(data.lang))
        socketIdName[socket.id]['lang_code']=converted_code
        console.log(socketIdName[socket.id]['lang_code'])
    })
    /////////////////
    function validate_user(candidate){
        let x
        let find=0
        for(x in socketIdName){
            if(socketIdName[x].username===candidate){
                find=1
            }
        }
        return find
    }

    ///////////////
    socket.on('request_track',(data)=>{

        let recipient = data.friend_name
        if(validate_user(data.friend_name))
        {

            if(data.friend_name===socketIdName[socket.id].username)
            {
                socket.emit('alert',{})
            }
            else{
                let msg_in="I Want to track your location"
                translate.getText(msg_in,{to: "ur"}).then(function(data){
                    let msg_out=data.text
                    io.to(recipient).emit('chat', {
                        private: true,
                        track:true,                 //track to open the option of yes or no button on the friend's page
                        sender: socketIdName[socket.id].username,
                        message: msg_out,
                        timestamp: new Date(),
                        socket_id:socket.id
                    })

                }).catch();

            }
        }
        else{
            socket.emit('alert',{})
        }

        console.log(socket.id)
    })
    socket.on('stop_tracking',(data)=>{
            socketIdName[socketIdName[socket.id].fetcher].per_of[0]=null                    //try to implement splice here
            socketIdName[socketIdName[socket.id].fetcher].got_loc_permission-=1


            let msg_in="Tracker_stopped by"+socketIdName[socket.id].username
            translate.getText(msg_in,{to: "ur"}).then(function(data){
                let msg_out=data.text

                io.to(socketIdName[socket.id].fetcher).emit('chat',{
                    sender:socketIdName[socket.id].username,
                    private:true,
                    message: msg_out
                })
                io.to(socketIdName[socket.id].fetcher).emit('disable',{})
            }).catch();

        }
    )
    socket.on('request_pressed',(data)=>{
        console.log(data.loc_of)
        io.to(data.loc_of).emit('start_interval',{
            fetFriend:socket.id,
            nextTime:true
        })
        // console.log("request presed by "+socketIdName[socket.id].username)
    })
    socket.on('response',(data)=>{              //response from the friend comes here

        let recipient = data.send_to            //in data.send to there will be b if b ask for location
        if(data.permission)
        {

            console.log(data.socket_id_per_TO)
            //console.log(socketIdName[data.socket_id_per_TO].username)
            socketIdName[data.socket_id_per_TO].got_loc_permission+=1
            let x=socketIdName[data.socket_id_per_TO].got_loc_permission
            socketIdName[data.socket_id_per_TO]["per_of"][x-1]=socket.id
            socketIdName[socket.id]['fetcher']=data.socket_id_per_TO

            socket.emit('start_interval',{                          //by this a start its function to track location
                fetFriend:data.send_to,  //-------
                nextTime:false
            })
        }




        let msg_in=data.message
        translate.getText(msg_in,{to: "ur"}).then(function(data){
            let msg_out=data.text

            io.to(recipient).emit('chat', {
                private: true,
                sender: socketIdName[socket.id].username,
                message: msg_out,
                timestamp: new Date(),
                button:true
            })
        }).catch();


    })

    socket.on(('my_location'),(data)=>
    {
        console.log("entered in my location")
        //final one to send my and my friend's location
        socketIdName[socket.id]["lat"]=data.latitude
        socketIdName[socket.id]['long']=data.longitude
        let lat=socketIdName[socket.id]["lat"]
        let long=socketIdName[socket.id]['long']
        let latf =socketIdName[data.id_of_per_giving]['lat']
        let longf =socketIdName[data.id_of_per_giving]['long']
        let distance1
        let location_of=socketIdName[data.id_of_per_giving]['username']
        console.log("id of per giving"+location_of)
        function show_dist(lat1, lon1, lat2, lon2, unit)
        {
            return new Promise(function(resolve,reject)
            {

                var radlat1 = Math.PI * lat1/180
                var radlat2 = Math.PI * lat2/180
                var theta = lon1-lon2
                var radtheta = Math.PI * theta/180
                distance1 = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                distance1 = Math.acos(distance1)
                distance1 = distance1 * 180/Math.PI
                distance1 = distance1 * 60 * 1.1515
                if (unit=="K") { distance1 = distance1 * 1.609344 }
                if (unit=="N") { distance1 = distance1 * 0.8684 }
                console.log("distance"+distance1)
                if(Number.isFinite(distance1)){
                    resolve("done")
                }
                else{
                    reject (new Error("cannot calculate the result"))
                }
            })

        }
        show_dist(lat,long,latf,longf,"K").then(function(data)
        {
            let msg_in= "longitude is"+longf+"latitude is"+latf+"approx distance"+distance1
            let msg_out
            let lang=socketIdName[socket.id].lang_code
            console.log("in final"+socketIdName[socket.id].lang_code)
            let a="hi"
            function get_lang(){
                lang=socketIdName[socket.id].lang_code
            }

            translate.getText(msg_in,{to:'hi'}).then(function(data){
                msg_out=data.text
                console.log(msg)
                socket.emit('chat', {
                    private: true,
                    // sender: socketIdName[data.id_of_per_giving]['username'],      why data.id_of_per_giving is undefined here
                    sender:location_of,
                    message: msg_out,
                    timestamp: new Date(),
                    map:true,
                    longitude_me:long,
                    latitude_me:lat,
                    latitude:latf ,
                    longitude:longf,

                })
            }).catch();
            console.log("entered"+data.of1)


        }).catch(function(err){
            console.log(err)
        })

    })
    ////chat listener///////////////////
    socket.on('chat', (data) => {
        //if (socketIdName[socket.id].username)
        //{
        if(data.sending_location)
        {
            socketIdName[socket.id]['long']=data.longitude
            socketIdName[socket.id]['lat']=data.latitude

            io.to(data.to_be_send).emit('fetch_location',{              //after the location f friend has come ,self location tracker is start
                fetch:true,
                socket_id:socket.id,
                of1:socketIdName[socket.id].username      //a
            })
            /*io.to(permissionto).emit('chat', {
                private: true,
                sender: socketIdName[socket.id],
                message: data.message,
                timestamp: new Date()
            })*/
        }
        /*else if (data.message.charAt(0) === '@')
        {
            let recipient = data.message.split(' ')[0].substring(1)
            io.to(recipient).emit('chat', {
                private: true,
                sender: socketIdName[socket.id].username,
                message: data.message,
                timestamp: new Date()
            })
        } else {
            socket.broadcast.emit('chat', {
                sender: socketIdName[socket.id].username,
                message: data.message,
                timestamp: new Date()
            })
        }*/
        // }
    })
})

app.use('/loc',express.static(__dirname + '/public/second.html'))
app.use('/', express.static(__dirname + '/public'))
app.get('/post',(req,res)=>{
    res.send(socketIdName)
})
server.listen(2345, () => {
    console.log("Server started on http://localhost:2345")
})