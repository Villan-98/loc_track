const express = require('express')
const http = require('http')
const socketio = require('socket.io')
//const translate = require('translate-api')

const app = express()

const server = http.createServer(app)
const io = socketio(server)

let socketIdName = {}
let msg
let transText = 'logged in';

/*translate.getText(transText,{to: 'hi'}).then(function(data){
    msg=data.text
}).catch();*/
io.on('connection', function (socket) {
    console.log('Socket connected ' + socket.id)

    function user_list()
     {
        io.emit("user_list",socketIdName)
    }
    socket.on('disconnect',function(data)
    {
        console.log("socket disconnected")
        delete socketIdName[socket.id]
        console.log("length of socketid"+socketIdName.length)
        user_list()
    })
    socket.on('login', (data) => {
        socketIdName[socket.id] = {username:data.username,got_loc_permission:0,per_of:{}}
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
    /////////////////
    socket.on('request_track',(data)=>{

        let recipient = data.friend_name

        io.to(recipient).emit('chat', {
            private: true,
            track:true,                 //track to open the option of yes or no button on the friend's page
            sender: socketIdName[socket.id].username,
            message: "I Want to track your location",
            timestamp: new Date(),
            socket_id:socket.id
        })
        console.log(socket.id)
    })
    socket.on('stop_tracking',(data)=>{
        socketIdName[socketIdName[socket.id].fetcher].per_of[0]=null                    //try to implement splice here
        socketIdName[socketIdName[socket.id].fetcher].got_loc_permission-=1
        io.to(socketIdName[socket.id].fetcher).emit('chat',{
                sender:socketIdName[socket.id].username,
                private:true,
                message: "Tracker Stopped"
            })
        }
    )
    socket.on('request_pressed',(data)=>{
        io.to(socketIdName[socket.id].per_of[0]).emit('start_interval',{
            locationof:socketIdName[socket.id].per_of[0],
            fetFriend:socketIdName[socket.id].username,
            nextTime:true
        })
       // console.log("request presed by "+socketIdName[socket.id].username)
    })
    socket.on('response',(data)=>{              //response from the friend comes here

        let recipient = data.send_to            //in data.send to there will bw b if b ask for location

        console.log("to br "+data.send_to)
        if(data.permission)
        {

            console.log(data.socket_id_per_TO)
            //console.log(socketIdName[data.socket_id_per_TO].username)
            socketIdName[data.socket_id_per_TO].got_loc_permission+=1
            let x=socketIdName[data.socket_id_per_TO].got_loc_permission
            console.log("x is "+x)
            socketIdName[data.socket_id_per_TO]["per_of"][x-1]=socket.id
            socketIdName[socket.id]['fetcher']=data.socket_id_per_TO

            socket.emit('start_interval',{                          //by this a start its function to track location
                fetFriend:data.send_to  //-------
            })
        }
        io.to(recipient).emit('chat', {
            private: true,
            sender: socketIdName[socket.id].username,
            message: data.message,
            timestamp: new Date(),
            button:true
        })
    })

    socket.on(('my_location'),(data)=>
    {                                               //final one to send my and my friend's location
        socketIdName[socket.id]["lat"]=data.latitude
        socketIdName[socket.id]['long']=data.longitude
        let lat=socketIdName[socket.id]["lat"]
        let long=socketIdName[socket.id]['long']
        let lat_f=socketIdName[socketIdName[socket.id].per_of[0]].lat
        let long_f=socketIdName[socketIdName[socket.id].per_of[0]].long
        let distance1

        function show_dist(lat1, lon1, lat2, lon2, unit)
        {
            return new Promise(function(resolve,reject)
            {

                console.log("thid id sachin")
                console.log(lat1)
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
            show_dist(lat,long,lat_f,long_f,"K").then(function(data)
            {
                console.log("entered"+data.of1)
                socket.emit('chat', {
                    private: true,
                    sender: socketIdName[socketIdName[socket.id].per_of[0]].username,
                    message: "longitude is"+long+"latitude is"+lat+"approx distance"+distance1,
                    timestamp: new Date(),
                    map:true,
                    longitude_me:long,
                    latitude_me:lat,
                    latitude:flat ,
                    longitude:flong,

                })

            }).catch(function(err){
                console.log(err)
            })

    })
    ////chat listener///////////////////
    socket.on('chat', (data) => {
        if (socketIdName[socket.id].username) {
            if(data.sending_location)
            {
                socketIdName[socket.id]['long']=data.longitude
                socketIdName[socket.id]['lat']=data.latitude

                flong=data.longitude
                flat=data.latitude
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
            else if (data.message.charAt(0) === '@')
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
            }
        }
    })
})
app.use('/', express.static(__dirname + '/public'))
app.get('/post',(req,res)=>{
    res.send(socketIdName)
})
server.listen(2345, () => {
    console.log("Server started on http://localhost:2345")
})