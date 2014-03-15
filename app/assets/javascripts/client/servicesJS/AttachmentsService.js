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
    app.factory("VideoUploadService",VideoUploadService)
VideoUploadService.$inject = ['$upload','ngProgress','$timeout']

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
                            ngProgress.stop();
                            //alert("uploded successfully");

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
        }
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