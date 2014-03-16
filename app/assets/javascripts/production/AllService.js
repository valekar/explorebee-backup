app.factory("ActivityIndexService",ActivityIndexService);

ActivityIndexService.$inject = ['$http'];

function ActivityIndexService($http){

    return  {getActivities: function(offsets){
        var url = "/index_pagination?page="+offsets;
        return $http.get(url);
    }
    }


}
app.factory("ActivityOtherUserService",ActivityOtherUserService);

ActivityOtherUserService.$inject = ['$http'];

function ActivityOtherUserService($http){
    return {
        getFeed:function(user_id,trackable_id,trackable_type){
            var tr_type = angular.lowercase(trackable_type);
            var url = "/show_others_details?trackable_id="+trackable_id+"&user_id="+user_id+"&trackable_type="+trackable_type;
            return $http.get(url);
        }
    }
}

app.factory("FileUploadService",FileUploadService);
FileUploadService.$inject = ['$upload'] ;
function FileUploadService($upload){
    var datas = [];
    return {
        attachFile : function($files,myModelObj,upload,interestIds) {
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                upload = $upload.upload({
                    url: '/attach_file',
                    // method: POST or PUT,
                    // headers: {'headerKey': 'headerValue'}, withCredential: true,
                    data: {myObj: myModelObj,interestIds:interestIds},
                    file: $file,
                    //(optional) set 'Content-Desposition' formData name for file
                    //fileFormDataName: myFile,
                    progress: function(evt) {
                        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                    }
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);
                    datas.push(data);
                    alert("uploded successfully");

                }).error(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);


                })
            }
        },

        getUploadedAttachment:function(){
            return datas;
        }


    }

}
app.factory("VideoUploadService",VideoUploadService);
VideoUploadService.$inject = ['$upload','ngProgress','$timeout'];

function VideoUploadService($upload,ngProgress,$timeout){
    var datas = [];
    return {
        attachFile : function($files,myModelObj,upload,interestIds,closeVideoModal) {
            ngProgress.color('white');
            ngProgress.height('2em');

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                upload = $upload.upload({
                    url: '/attach_video',
                    // method: POST or PUT,
                    // headers: {'headerKey': 'headerValue'}, withCredential: true,
                    data: {myObj: myModelObj,interestIds:interestIds},
                    file: $file,
                    //(optional) set 'Content-Desposition' formData name for file
                    //fileFormDataName: myFile,
                    progress: function(evt) {

                        ngProgress.start();
                        // $timeout(ngProgress.complete(), 1000);

                        // console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                        ngProgress.set(parseInt(100.0 * evt.loaded / evt.total));


                    }
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully

                    ngProgress.complete();
                    console.log(data);
                    datas.push(data);
                    alert("uploded successfully");
                    ngProgress.stop();
                    //using foundations reveal modal
                    $('.close-reveal-modal',closeVideoModal).click();
                }).error(function(data, status, headers, config) {
                    // file is uploaded successfully
                    alert("Sorry couldn't upload");
                    ngProgress.complete();
                    console.log(data);
                    ngProgress.stop();
                    //using foundations reveal modal
                    $('.close-reveal-modal',closeVideoModal).click();
                })
            }
        },

        getUploadedAttachment:function(){
            return datas;
        }


    }

}
app.factory("GetVideosService",GetVideosService);
GetVideosService.$inject = ['$http'];

function GetVideosService($http){
    var service = {
        getVideoUrl:function(){
            return $http.get("/get_videos");
        }
    };
    return service;
}

//used in places/new.html.erb
app.factory("PlaceVideoUploadService",PlaceVideoUploadService);
PlaceVideoUploadService.$inject = ['$upload'];
function PlaceVideoUploadService($upload){
    var datas = [];
    return {
        attachFile : function($files,myModelObj,upload,placeId) {
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                upload = $upload.upload({
                    url: '/attach_place_video',
                    // method: POST or PUT,
                    // headers: {'headerKey': 'headerValue'}, withCredential: true,
                    data: {myObj: myModelObj,placeId:placeId},
                    file: $file,
                    //(optional) set 'Content-Desposition' formData name for file
                    //fileFormDataName: myFile,
                    progress: function(evt) {
                        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                    }
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);
                    datas.push(data);
                    alert("uploded successfully");

                }).error(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);


                })
            }
        },

        getUploadedAttachment:function(){
            return datas;
        }


    }

}
app.factory("MessageService",MessageService);

MessageService.$inject = ['$resource'];
function MessageService($resource){
    var service = $resource('/messages/:id.json',
        {id:'@id'},
        {}
    );

    return service;

}
//this one is used for commenting
app.factory("CommentUrlService",CommentUrlService);


CommentUrlService.$inject = ['$resource'];
function CommentUrlService($resource){

    return{
        getUrl:function(model,id){
            var url = "/"+model+"/"+id+"/comments/:id.json";
            return $resource(url,{id:"@id"});
        }


    }
}


app.factory("AddInterestService",AddInterestService);


AddInterestService.$inject = ['$resource'];
function AddInterestService($resource){
    /*  var AddInterest = $resource('interestship/:id.json',
     {id:'@id'},
     {}
     );
     return AddInterest;
     */

    var service = {
        interestUrl:function(){
            var url = "/interestship";
            return $resource(url);
        }
    }

    return service;

}
app.factory("GetInterestsService",GetInterestsService);
GetInterestsService.$inject = ['$http'];

function GetInterestsService($http){
    var service = {
        getInterest:function(){
            return $http.get("/show_interests/get_index");
        }
    }
    return service;
}
app.factory("Micropost",Micropost);
Micropost.$inject = ['$resource'];


function Micropost($resource){
    var Micropost = $resource('microposts/:id.json',
        {id:'@id'},
        {}
    );
    return Micropost;
}



app.factory("AddInterestService",AddInterestService);


AddInterestService.$inject = ['$resource'];
function AddInterestService($resource){
    /*  var AddInterest = $resource('interestship/:id.json',
     {id:'@id'},
     {}
     );
     return AddInterest;
     */

    var service = {
        interestUrl:function(){
            var url = "/interestship";
            return $resource(url);
        }
    };

    return service;

}
app.factory("GetInterestsService",GetInterestsService);
GetInterestsService.$inject = ['$http'];

function GetInterestsService($http){
    var service = {
        getInterest:function(){
            return $http.get("/show_interests/get_index");
        }
    };
    return service;
}


app.factory("PlaceServices",PlaceServices);
PlaceServices.$inject = ['$http'];

function PlaceServices($http){

    var service = {

//        var url = "/places/get_other_places"
//        return $http.get(url);
        getPlacesUrl :function(interest_id){
            return $http.get("/places/signed_index?interest_id="+interest_id);
        },

        getPaginationUrl:function(offset){
            return $http.get("/places/signed_index?page="+offset);
        },
        getNextPage:function(counter){
            return $http.get("/places/getPlaces?page="+counter);
        },
        getNextInterest:function(id){
            return $http.get("/places/getPlaces?interest_id="+id);
        }


    };

    return service;

}
app.factory("PlaceFavouriteService",PlaceFavouriteService);
PlaceFavouriteService.$inject = ['$http'];

function PlaceFavouriteService($http){

    var service = {
        getPlaceUrl:function(id){
            return $http.get("/places/favourite?place="+id);
        }
    };

    return service;

}/*.factory("PlaceAndTripServices",function($resource){
 var service ={
 getPlaceAndTripUrl:function(){
 return $resource("/trips/create_trip/:id.json",{id:"@id"});
 }
 }

 return service;

 });*/

//Newly added after getting al services into one file
app.factory("PlaceDetailServices",PlaceDetailServices);
PlaceDetailServices.$inject = ['$http'];
function PlaceDetailServices($http){
    var service ={
        getDetailDescription:function(trackable_id){
            return $http.get("/places/getDetailDescription?place_id="+trackable_id);
        }
    };
    return service;
}


//Used in unsigned html page /static_pages/home part
app.factory("UnsignedPlaceServices",UnsignedPlaceServices);
UnsignedPlaceServices.$inject=["$http"];

function UnsignedPlaceServices($http){
    return {
        getRecentPlaces:function(){
            return $http.get("/static_pages/get_place_photos");
        }
    }
}

app.factory("StoryServices",StoryServices);
StoryServices.$inject = ['$resource'];
function StoryServices($resource){
    var service = {
        setStoryUrl:function(){
            return $resource("/stories/create_story/:id.json",{id:'@id'})
        }
    };

    return service;
}

app.factory("TripServices",TripServices);
TripServices.$inject = ['$resource'];

function TripServices($resource){
    var service ={
        setTripAcceptanceUrl:function(){
            return $resource("/trips/acceptance:id.json",{id:"@id"});
        }
    };
    return service;
}

app.factory("UserServices",UserServices);
UserServices.$inject = ['$resource','$http'];
function UserServices($resource,$http){
    var service = {
        setWorkPlace:function(){
            return $resource("/users/create_user_and_work/:id.json",{id:"@id"})
        },

        getFollowers: function(counter){
            return $http.get("/getFollowers?page="+counter);
        },

        setRelation: function(){
            return $resource("/users/relate/:id.json", {id:"@id"})
        }

    };

    return service;
}


var op = angular.module("app.UtilityServices",[]);

op.factory("PhotoService",PhotoService);

PhotoService.$inject = ['$http'];
function PhotoService($http){
    return {
        getPhoto:function(){
            return $http.get("/user/getphoto");
        }
    }
}

op.factory("CurrentUserService",CurrentUserService);

CurrentUserService.$inject = ['$http'];
function CurrentUserService($http){
    return {
        getCurrentUser:function(){
            return $http.get("/user/currentuser");
        }
    }
}


// note there is sum difference between above and below factories
app.factory("PhotoUploadService",PhotoUploadService);


PhotoUploadService.$inject = ['$upload'];

function PhotoUploadService($upload){
    var datas = [];
    return {


        uploadPhoto : function($files,myModelObj,upload) {
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                upload = $upload.upload({
                    url: '/upload',
                    // method: POST or PUT,
                    // headers: {'headerKey': 'headerValue'}, withCredential: true,
                    data: {myObj: myModelObj},
                    file: $file,
                    //(optional) set 'Content-Desposition' formData name for file
                    //fileFormDataName: myFile,
                    progress: function(evt) {
                        console.log('percent: ');
                    }
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully
                    //console.log(data);
                    datas.push(data);
                    //alert("uploded successfully" +data);

                }).error(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);


                })
            }
        },

        getUploadedDatas:function(){
            return datas;
        }


    }

}
//used for voting the microposts
app.factory("VoteUrlService",VoteUrlService);
VoteUrlService.$inject = ['$resource'];
function VoteUrlService($resource){
    var service = {
        vote:function(model,id){
            var url = "/"+model+"/"+id+"/vote/:id.json";
            return $resource(url,{id:"@id"});
        },

        voteVideo:function(){
            return $resource("/attachments/vote_video_attachment");
        }

    };

    return service;
}
app.factory("flowPlayerService",flowPlayerService);
flowPlayerService.$inject = [];
function flowPlayerService(){
    var service = {
        flowPlayer:function(){
            $f("player", "/flowplayer.swf" ,{
                clip:  {
                    autoPlay: false,
                    autoBuffering: true
                },
                plugins: { // load one or more plugins
                    controls: { // load the controls plugin

                        // always: where to find the Flash object
                        url: '/flowplayer.controls-tube-3.2.15.swf'
                        // display properties
                        ,
                        tooltips: { // this plugin object exposes a 'tooltips' object
                            buttons: true,
                            fullscreen: 'Enter Fullscreen mode'
                        }
                    }
                }
            });
        }
    };

    return service;
}
app.factory("ProfilePhotoUploadService",ProfilePhotoUploadService);

ProfilePhotoUploadService.$inject = ['$upload'];
function ProfilePhotoUploadService($upload){
    var datas = [];
    return {


        uploadPhoto : function($files,myModelObj,upload) {
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                upload = $upload.upload({
                    url: '/user/profile_upload',
                    // method: POST or PUT,
                    // headers: {'headerKey': 'headerValue'}, withCredential: true,
                    data: {myObj: myModelObj},
                    file: $file,
                    //(optional) set 'Content-Desposition' formData name for file
                    //fileFormDataName: myFile,
                    progress: function(evt) {
                        //console.log('percent: ' );

                        alert("uploading.....")
                    }
                }).success(function(data, status, headers, config) {
                    // file is uploaded successfully
                    // console.log(data);
                    datas.push(data);
                    //  alert("uploded successfully" +data);

                }).error(function(data, status, headers, config) {
                    // file is uploaded successfully
                    console.log(data);


                })
            }
        },

        getUploadedDatas:function(){
            return datas;
        }


    }

}

app.factory("SuggestionServices",SuggestionServices);
SuggestionServices.$inject = ['$http'];

function SuggestionServices($http){
    var service ={
        getFriendSuggestions:function(){
            return $http.get("/utility/getSuggestions");
        }
    };
    return service;
}







