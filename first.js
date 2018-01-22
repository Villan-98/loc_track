const translate = require('translate-api');

/*let transUrl = 'https://nodejs.org/en/';
translate.getPage(transUrl).then(function(htmlStr){
    console.log("this is"+htmlStr.length)
});*/
let data
let transText = 'this is sachin';
translate.getText(transText,{to: 'hi'}).then(function(data){
    console.log(data.text)
});
let longitude
let latitude
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

geoFindMe()