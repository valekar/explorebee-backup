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



app.factory("ProfilePhotoUploadService",ProfilePhotoUploadService);

ProfilePhotoUploadService.$inject = ['$upload','ngProgress'];
function ProfilePhotoUploadService($upload,ngProgress){
            var datas = [];

            return {


                uploadPhoto : function($files,upload,closePicModal) {
                    ngProgress.color('white');
                    ngProgress.height('2em');
                    ngProgress.start();
                    //$files: an array of files selected, each file has name, size, and type.
                    for (var i = 0; i < $files.length; i++) {
                        var $file = $files[i];
                        upload = $upload.upload({
                            url: '/user/profile_upload',
                            // method: POST or PUT,
                            // headers: {'headerKey': 'headerValue'}, withCredential: true,
                           // data: {myObj: myModelObj},
                            file: $file,
                            //(optional) set 'Content-Desposition' formData name for file
                            //fileFormDataName: myFile,
                            progress: function(evt) {

                                ngProgress.set(parseInt(100.0 * evt.loaded / evt.total));
                            }
                        }).success(function(data, status, headers, config) {
                                // file is uploaded successfully
                               // console.log(data);
                                  if(datas.length !=0){
                                      datas.pop();

                                  }
                                datas.push(data);
                               // alert("uploded successfully" );
                            ngProgress.complete();
                            //console.log(data);
                            //datas.push(data);
                            ngProgress.stop();
                            $('.close-reveal-modal',closePicModal).click();

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




app.factory("CommonVoteService",CommonVoteService);
CommonVoteService.$inject=['$resource'];

function CommonVoteService($resource){
            var service = {
                commonVote:function(){
                    return $resource("/utility/commonVote");
                }
            };
        return service;
}



app.factory("VoteService",VoteService);
VoteService.$inject=['$resource'];

function VoteService($resource){
    var service = {
        commonVote:function(){
            return $resource("/utility/commonVote");
        }
    };
    return service;
}

app.factory("LargeProfilePhotoService",LargeProfilePhotoService);
LargeProfilePhotoService.$inject = ['$http'];

function LargeProfilePhotoService($http){
    var service ={
        getLargePhoto:function(){
            return $http.get("/utility/get_large_photo");
        }
    }

    return service;
}