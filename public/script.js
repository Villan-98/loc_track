let socket = io()
function initMap(){}
$(function () {

    let containerLogin = $('#login')
    let containerChat = $('#chatbox')
    let containersend = $('#send_request')          //this button is to give permission to track the location
    let getRequestButton=$('#btn_re')                  // button to fetch friend's location
    let stopLocTrack=$('#btn_re_stop')
    let interval_id
    getRequestButton.hide()
    containerChat.hide()
    containersend.hide()
    stopLocTrack.hide()
    $('.for_hide').hide()
    $('#refetch').hide()
   // $('#chat-opt').hide()
    $('#map').hide()
    let btnLogin = $('#btn-login')
    let btnSend = $('#btn-send')
    let inpUsername = $('#inp-username')
    let inpMsg = $('#inp-msg')
    let listChats = $('#chatlist')
    let longitude
    let latitude
    $('#abc').hide


    //////function to find location/////////////////////
    function geoFindMe()
    {
        return new Promise(function(resolve,reject){



            if (!navigator.geolocation){
                alert("Sorry Your browser donot support navigator")
                return;
            }

            function success(position) {
                latitude  = position.coords.latitude;
                longitude = position.coords.longitude;

                console.log("longitude is:"+longitude)
                var img = new Image();
                img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=true";
                resolve("done")
            }

            function error() {
                alert("Sorry some error on the server side")
                reject(new Error("could no track location"))
            }


            navigator.geolocation.getCurrentPosition(success, error);

        } )
    }
    ///////////////////////find location ends here//////////////////
    function send_location( my,fetfriend)                       //send_location is called from two places 1. from setInterval nad second from fetchlocatin event of socket
    {
        geoFindMe().then(function(data)
        {
            if(!my)
            {
                socket.emit('chat', {
                    sending_location:1,
                    message: "longitude is"+longitude+"latitude is"+latitude,
                    longitude:longitude,
                    latitude:latitude,
                    to_be_send:fetfriend
                })

            }
            else
            {
                socket.emit('my_location', {
                    sending_location:1,
                    longitude:longitude,
                    latitude:latitude,
                    id_of_per_giving:my,
                    of1:fetfriend

                })
                console.log("my location send")
            }
        }).catch(function(err){
            console.log(err)
        })
    }


    ///fetch location button//////
    getRequestButton.click(()=>{
        console.log("fetch button pressed")
        socket.emit('request_pressed',{
            a:"a",
            loc_of:$('#refetch').val()
        })
    })
    ///////send chat message/////
    /*btnSend.click(() => {
        socket.emit('chat', {
            message: inpMsg.val()
        })
    })*/
    /////stop location tracker/////
    stopLocTrack.click(()=>{
        console.log("stop pressed")
        socket.emit('stop_tracking',{
            command:true
        })
    })
    //////locate all button event----no working/////
    $('#loc_all').click(()=>{
        socket.emit('get_all',{})
    })
    //login btn event///////
    btnLogin.click(() => {
        socket.emit('login', {
            username: inpUsername.val(),
            //language:input_language.val()
        })
        //window.location.replace("localhost:2345/loc");

    })
    ///
    /*$('#btn-chat').click(()=>
    {
        $('#chat-opt').show()
    })*/

    $('#btn-loc').click(()=>
    {
        $('#send_request').show()
    })
    ///request button///////
    $('#btn_req').click(()=>{
        socket.emit('request_track',{                   //message to ask friend for location track sent from here
            friend_name:$('#inp_req').val()
        })
    })
    /////logged in event///////////////
    socket.on('logged_in', (data) => {
        if (data.success)
        {
            if(socket.id===data.socket_id)
            {

                containerChat.show()


                containerLogin.hide()
            }

        }
    })
    ////////////listening to various alert///////////////
    socket.on('alert',(data)=>{
        alert("OOOps something went wrong");
    })
    //////language button//////////////
    $('#btn-lang').click(()=>{
        socket.emit('enter_language',{
            lang: $("#input_language option:selected").text()
        })
       console.log()
    })


    //////////block to get location of permitted user//////
    socket.on('take_cord',(data)=>{
        console.log(data)

        $('#map').show()
        console.log("button"+data.button)
        console.log("reaching in maap")
        {
            // Map options
            var options = {
                zoom:12,
                center:{lat:28.7041,lng:77.1025}
            }
            let a;
            console.log(a)
            // New map
            var map = new google.maps.Map(document.getElementById('map'), options);

            // Listen for click on map

            // Array of markers
            let marker1=[{coords:'',iconImage:'',content:''}]
            let j=0
            for(x in data)
            {

                marker1[j]={

                    coords:{lat:data[x].lat,lng:data[x].long},
                    iconImage:'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
                    content:'<h1>Location of Friend</h1>'
                }
                if(j%4===1)
                {
                    marker1[j].iconImage='https://maps.google.com/mapfiles/kml/shapes/parking_lot_maps.png'
                }
                if(j%4===2)
                {
                    marker1[j].iconImage='https://maps.google.com/mapfiles/kml/shapes/library_maps.png'
                }
                if(j%4===3)
                {
                    marker1[j].iconImage='https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png'

                }
                j++
            }
            console.log(marker1)


            // Loop through markers
            for(var i = 0;i < marker1.length;i++){
                // Add marker
                addMarker(marker1[i]);
            }

            // Add Marker Function
            function addMarker(props){
                var marker = new google.maps.Marker({
                    position:props.coords,
                    map:map,
                    //icon:props.iconImage
                });

                // Check for customicon
                if(props.iconImage){
                    // Set icon image
                    marker.setIcon(props.iconImage);
                }

                // Check content
                if(props.content){
                    var infoWindow = new google.maps.InfoWindow({
                        content:props.content
                    });

                    marker.addListener('click', function(){
                        infoWindow.open(map, marker);
                    });
                }
            }
        }
    })
    ////////////////// block to show online user///////////////////
    socket.on('user_list',(data)=>{
        var x
        let str=''
        $('#online_list').empty()
        console.log(data)
        for(x in data)
        {
            str+=`
            <li> ${data[x].username}</li>
            
            `
            console.log(data[x].username)
        }
        $('#online_list').append(str)
    })
    ////locaion interval start event//////
    socket.on('start_interval',(data)=>{
        console.log("rachasdksk")
        send_location(0,data.fetFriend)          //here argument is pass to check whether chat is to be emit for my_locatin is to be emit and data.fetfriend will be the one who ask for location
        stopLocTrack.show()
        console.log("sjfksjd",data.nextTime)
    })
    /////fetch location event////
    socket.on('fetch_location',(data)=>{

        send_location(data.socket_id,data.of1)                  //here in socket_id(there wil be the id of the friend whose location i want to fetch
        console.log("fetch request has come")

    })
    ////////////for chat request//////////////////////////////
    socket.on('chat', (data) =>
    {
        console.log("reaching herre")
        let cardExtraClass = (data.private)
            ? 'text-white bg-info'
            : ''
        listChats.append(
            $(
                `
            <div class="card ${cardExtraClass} col-12">
                <div class="card-body">
                    <div class="card-title">${data.sender}</div>
                    <div class="card-subtitle text-muted small">${data.timestamp}</div>
                    <div class="card-text">${data.message}</div>
                </div>
            </div>
                `
            )

        )
        if(data.private)
        {
            if(data.track)
            {
                listChats.append
                (                                                                   ////why cant i do in calling resposnse( ${data.sender})
                    $(
                        `
                            <div class="card bg-secondary col-12">
                                <div class="card-body">
                                 <div class="row">
                                    <button onclick="response_fun(1)" class="btn btn-info req_per col m-4" >YES</button>                
                                    <button onclick="response_fun(0)"class="btn btn-info req_per col m-4" >NO</button>
                                </div>
                               </div>
                            </div>
                        `
                    )
                )
                console.log(data.socket_id)
                console.log(data.sender)
                let to_send=data.sender                 //sender will b if b ask for request aupcoming yes or no is given(emit) by a
                window.response_fun=function(value1)
                {
                    $('.req_per').prop("disabled",true)
                    let  my_msg="Permission not Granted"
                    if(value1){
                        my_msg="Permission Granted"

                    }
                    socket.emit('response', {
                        message: my_msg,
                        send_to:data.sender,                        //name of the fetcher
                        permission:value1,
                        socket_id_per_TO:data.socket_id
                    })
                }
            }
            if(data.button)
            {
                console.log("entered in button")
                getRequestButton.show()
                $('#refetch').show()
                $('#send_request').show()
            }
            if(data.map)
            {{
                console.log("map ic"+data.object1)
                $('#map').show()
                console.log(data.map)
                console.log("button"+data.button)
                console.log("reaching in maap")
                {
                    // Map options
                    var options = {
                        zoom:12,
                        center:{lat:28.7041,lng:77.1025}
                    }
                    let a;
                    console.log(a)
                    // New map
                    var map = new google.maps.Map(document.getElementById('map'), options);

                    // Listen for click on map


                    // Array of markers
                    var markers = [
                        {

                            coords:{lat:data.latitude,lng:data.longitude},
                            iconImage:'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
                            content:'<h1>Location of Friend</h1>'
                        },
                        {
                            coords:{lat:data.latitude_me,lng:data.longitude_me},
                            content:'<h1>My location</h1>'
                        }
                    ];

                    // Loop through markers
                    for(var i = 0;i < markers.length;i++){
                        // Add marker
                        addMarker(markers[i]);
                    }

                    // Add Marker Function
                    function addMarker(props){
                        var marker = new google.maps.Marker({
                            position:props.coords,
                            map:map,
                            //icon:props.iconImage
                        });

                        // Check for customicon
                        if(props.iconImage){
                            // Set icon image
                            marker.setIcon(props.iconImage);
                        }

                        // Check content
                        if(props.content){
                            var infoWindow = new google.maps.InfoWindow({
                                content:props.content
                            });

                            marker.addListener('click', function(){
                                infoWindow.open(map, marker);
                            });
                        }
                    }
                }
            }

            }
        }
    })
})
