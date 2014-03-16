app.controller("VideoCtrl",VideoCtrl);
VideoCtrl.$inject = ['$scope','$window','GetVideosService'];

function VideoCtrl($scope,$window,GetVideosService){
   $window.onload = function(){
        //alert("hello world");
          $scope.videos=[];
          $scope.videosDetail = [];
       GetVideosService.getVideoUrl().success(function(data){

            // I got the object like this [[[]]] so using three loops
           angular.forEach(data,function(value,key){
               //console.log(value);
               angular.forEach(value,function(val,k){
                   //console.log(val);
                   angular.forEach(val,function(v,k){
                       //console.log(v);
                       //trying to remove the duplicates
                        if($scope.videos.indexOf(v.file.url) == -1){
                            $scope.videos.push(v.file.url);
                            $scope.videosDetail.push(v);
                        }

                   })
               })
           });


           angular.forEach($scope.videosDetail,function(v,k){
               //console.log(v);
           })


       })
   }
}