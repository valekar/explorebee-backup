app.
    controller('CentreHomeController',CentreHomeController);

CentreHomeController.$inject = ['$scope','Micropost','PhotoService','VideoUploadService','VoteUrlService','$window',
            'CommentUrlService','$upload','GetInterestsService','PhotoUploadService','FileUploadService','$rootScope'];

function CentreHomeController($scope,Micropost,PhotoService,VideoUploadService,VoteUrlService,
                              $window,CommentUrlService,$upload,GetInterestsService,
                              PhotoUploadService,FileUploadService,$rootScope){
    //got this from the global declaration
    $rootScope.currentUserName = $window.user;

    $window.onload = function(){
        PhotoService.getPhoto().success(function(data){
            $scope.myPhoto =  data;
        });
    };




    //**********************************************************************************************************//
    //method for writing new microposts
    $scope.microposts = [];
    //$scope.myPhoto = photo;
    $scope.post = function(){

        //note:: the success has to be used in this controller itself in order to work
      /*  if($scope.myPhoto == null){
            PhotoService.getPhoto().success(function(data){
                $scope.myPhoto =  data;
            });
        }*/
        if($scope.data!=null){

            var micropost = $scope.data.micropost;
            var post = new Micropost({
                content:micropost
            });
            post.$save();
            $scope.microposts.push(post);
            $scope.data.micropost = " ";
        }
        else{
            alert("Hi, there, we didn't think you are having nothing");
        }
    };
   //***********************************************************************************************************//
    //method for comment section

    $scope.micropostComment = function(micropost){

      var comment = {
          content:micropost.commentIt
      };
       var model = "microposts";
        var id = micropost.micropost.id;
       var Comment = CommentUrlService.getUrl(model,id);


        var commentable = Comment.save(comment);
        if(!micropost.comments){
            micropost.comments = [];
        }
        micropost.comments.push(commentable);
        micropost.commentIt = " ";
    };


     $scope.onVoteUp = function(micropost){

           var vote = {
               type:"up"
           };
         var model = "microposts";
         var id = micropost.micropost.id;
         var Vote = VoteUrlService.vote(model,id);

         var voted = Vote.save(vote);

         $scope.vote = voted;

     };


    //***********************************************************************************************************//

    //this method is for photo upload using angular-file-upload
    $scope.onFileSelect = function($files){
        PhotoUploadService.uploadPhoto($files,$scope.myModelObj,$scope.upload);
        $scope.datas = PhotoUploadService.getUploadedDatas();
    };
    //**********************************************************************************************************//

    //this is used for angular file upload


    $scope.toggleUpload = function(){
        $scope.flag2 = true;
    };
    //this is where the file attachment takes place
    $scope.onFileAttach = function($files){
        FileUploadService.attachFile($files,$scope.description,$scope.upload,$scope.interestIds);
        $scope.attachments = FileUploadService.getUploadedAttachment();
        $scope.description = " ";
        $scope.fileAttach = " ";
    };
    //comment part for the file attachment section
    $scope.attachmentComment = function(attachment){
        var comment = {
            content:attachment.commentIt
        };
        var model = "attachments";
        var id = attachment.getFiles.id;

        var Comment = CommentUrlService.getUrl(model,id);
        var commentable = Comment.save(comment);
        if(!attachment.comments){
            attachment.comments = [];
        }
        attachment.comments.push(commentable);
        attachment.commentIt = " ";
    };

    //********************************************************************************************************//

        //this is used for angular file upload


        $scope.toggleVideoUpload = function(){
            $scope.flag4 = true;
        };
        //this is where the file attachment takes place
        $scope.onVideoAttach = function($files){


            //sending the modal id for closing
            var closeVideoModal = angular.element("#videoAttachment");
            VideoUploadService.attachFile($files,$scope.videoDesc,$scope.upload,$scope.interestIds,closeVideoModal);



            $scope.videoAttachs = VideoUploadService.getUploadedAttachment();
            $scope.videoDesc = " ";
            //$scope.fileAttach = " ";
        };

        //comment part for the file attachment section
        $scope.videoComment = function(vadeo){
            var comment = {
                content:vadeo.commentIt
            };
            var model = "video_attachments";
            var id = vadeo.getFiles.id;

            var Comment = CommentUrlService.getUrl(model,id);
            var commentable = Comment.save(comment);
            if(!vadeo.comments){
                vadeo.comments = [];
            }
            vadeo.comments.push(commentable);
            vadeo.commentIt = " ";
        };

    //******************************************************************************************************//


        //this is used for getting interests and to map interests for uploads
        $scope.interestIds = [];
        $scope.interestMapper = [];
        $scope.interests = [];
        $scope.loadInterests = function(){
            if($scope.interests.length == 0){
                GetInterestsService.getInterest().success(function(data){
                    $scope.interests = data;
                  angular.forEach(data,function(value,key){
                        //console.log(value);
                      angular.forEach(value,function(v,k){
                          //console.log(v.id);
                          //console.log(v.name);
                          $scope.interestMapper.push(v);

                      })
                  });


            })
            }
        };
        $scope.isDisabled = {};
        $scope.toggleInterest = function(id){
            $scope.interestIds.push(id);
            $scope.isDisabled[id] = true;
        }


}


//This one is for showing the activities/notifications, I have moved the code from the activity page to this page

app.controller("ActivityCtrl",ActivityCtrl);
ActivityCtrl.$inject =['$scope','ActivityIndexService','ActivityOtherUserService','VoteUrlService','CommentUrlService'];
    function ActivityCtrl($scope,ActivityIndexService,ActivityOtherUserService,VoteUrlService,CommentUrlService){
    var counter = 0;
    var obj = [];
    var activities;
    var flag = true;




    $scope.activities = [];
    $scope.usersDetails = [];
    $scope.myPagingFunction = function(){
        counter += 1;
        if(flag){
            // call made once to the server
            ActivityIndexService.getActivities(counter).success(function(data){
                obj = data;
                activities = obj.activities;
                //console.log(activities);
                //alert(data.success);
                flag = data.success;

                angular.forEach(activities,function(value,key){

                    $scope.activities.push(value);
                    /* angular.forEach(value,function(value1,key){
                     console.log(value1);
                     })*/

                    //var user = ActivityUserService.getUser(value.user_id);
                    if(value.trackable_type!="Comment"){
                        ActivityOtherUserService
                            .getFeed(value.user_id,value.trackable_id,value.trackable_type)
                            .success(function(data){
                                $scope.usersDetails.push(data);
                            });
                    }
                });

            });
        }

    };

    //Here we are passing userDetail only for model,id purpose....the commenting person is different

    $scope.comment = function(userDetail){
        var comment = {
            content:userDetail.commentIt
        };
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;
        var Comment = CommentUrlService.getUrl(model,id);


        var commentable = Comment.save(comment);
        //in user controller i hav defined comments .....so its imp to initialize with comments variable name
        if(!userDetail.comments){

            userDetail.comments = [];
        }
        userDetail.comments.push(commentable);

        //comment.otherUserPhotoEnable = true;
        // userDetail.currentUserPhotoEnable = true;
        userDetail.commentIt = " ";
    };




    $scope.onVote = function(userDetail,type){
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;
        //var Vote = '';
        console.log(model);

        if(model == 'video_attachments'){
            var vote = {
                type:type,
                model:model,
                id:id
            };
            var Vote = VoteUrlService.voteVideo();
            var voted = Vote.save(vote);
            userDetail.vote = voted;
        }
        else if(model == "microposts"){
            var vote = {
                type:type

            };
            var Vote = VoteUrlService.vote(model,id);
            var voted = Vote.save(vote);
            userDetail.vote = voted;
        }
        else if(model == "attachments"){
            var vote = {
                type:type

            };
            var Vote = VoteUrlService.vote(model,id);
            var voted = Vote.save(vote);
            userDetail.vote = voted;
        }



    }


}





