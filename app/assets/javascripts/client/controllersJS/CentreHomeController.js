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

    $scope.currentUserId = $window.current_user_id;


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


     $scope.onVoteMicropost = function(micropost){
            console.log(micropost);
           var vote = {
               type:"up"
           };

         var model = "microposts";
         var id = micropost.micropost.id;
         var Vote = VoteUrlService.vote(model,id);
         var voted = Vote.save(vote);

         $scope.vote = voted;

/*
             var type ="up";
             var model = "microposts";
             var id = micropost.micropost.id;

             var vote = {
                 type:type,
                 model:model,
                 id:id

             };


         //alert("asdasda");
         var Vote = CommonVoteService.commonVote();
         var voted = Vote.save(vote);
         $scope.vote = voted;*/
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

            for(var i = 0;i<$scope.interestIds.length ; i++){
                $scope.isDisabled[$scope.interestIds[i]]= false;
            }

            $scope.videoAttachs = VideoUploadService.getUploadedAttachment();
            $scope.videoDesc = " ";
            //$scope.fileAttach = " ";
        };

        //comment part for the VIDEO attachment section


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



        // this is for voting the videos
    $scope.onVideoVoteUp = function(video){

        console.log(video);
        var model = "video_attachments";
        var id = video.getFiles.id;
        var vote = {
            type:"up",
            id:id,
            model:model
        };

        var Vote = VoteUrlService.voteVideo();

        var voted = Vote.save(vote);

        $scope.videoVote = voted;

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








