/*
app.controller("ActivityCtrl",ActivityCtrl);

ActivityCtrl.$inject = ['$scope','ActivityIndexService','ActivityOtherUserService','VoteUrlService','CommentUrlService'];

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
                  */
/* angular.forEach(value,function(value1,key){
                       console.log(value1);
                   })*//*


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

        var vote = {
            type:type
        };
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;
        var Vote = VoteUrlService.vote(model,id);

        var voted = Vote.save(vote);
            userDetail.vote = voted;



    }


}*/
