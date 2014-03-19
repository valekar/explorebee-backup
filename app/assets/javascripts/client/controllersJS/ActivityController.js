//This one is for showing the activities/notifications, I have moved the code from the activity page to this page

app.controller("ActivityCtrl",ActivityCtrl);
ActivityCtrl.$inject =['$scope','ActivityIndexService','ActivityOtherUserService','VoteUrlService','CommentUrlService','ActivityRemoveService','CommonVoteService'];
function ActivityCtrl($scope,ActivityIndexService,ActivityOtherUserService,VoteUrlService,CommentUrlService,ActivityRemoveService,CommonVoteService){
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

                    //here activities contains track_type "comment", so we dont want that . so is the reason we have used if condition

                    //In the below code value.user_id is used for getting the details of the user who has made the activity


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
    // the commenting person is of course current_user....  ;-)

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

        }
        else if(model == "microposts"){
            var vote = {
                type:type,
                model:model,
                id:id

            };

        }
        else if(model == "attachments"){
            var vote = {
                type:type,
                model:model,
                id:id

            };
        }
        else if(model == "posts"){
                var vote = {
                    type:type,
                    model:model,
                    id:id
                };
        }

            var Vote = CommonVoteService.commonVote();
            //var Vote = VoteUrlService.vote(model,id);
            var voted = Vote.save(vote);
            userDetail.vote = voted;




    }



        //this is used for deleting the posted posts and videos by the user
    $scope.removeUserDetail = function(userDetail,index){
        var model = userDetail.feedModel;
        var id = userDetail.feed.id;

        //alert("index "+index);

        $scope.usersDetails.splice(index, 1);

        var Activity = ActivityRemoveService.removeFeed();


        var activity = {
            trackable_id:id,
            trackable_type:model

        };


        var removed = Activity.save(activity);


    }






}