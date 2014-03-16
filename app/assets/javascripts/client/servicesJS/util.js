//var op = angular.module("app.UtilityServices",[]);

    app.factory("PhotoService",PhotoService);

PhotoService.$inject = ['$http'];
function PhotoService($http){
       return {
            getPhoto:function(){
                return $http.get("/user/getphoto");
            }
        }
    }

    app.factory("CurrentUserService",CurrentUserService);

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







