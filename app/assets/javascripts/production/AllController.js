app.controller("AttachmentCtrl",AttachmentCtrl);

AttachmentCtrl.$inject = [];
function AttachmentCtrl(){

}
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





app.controller("ChatCtrl", ChatCtrl)

ChatCtrl.$inject = ['$scope','MessageService'];

function ChatCtrl($scope,MessageService){

    $scope.messages = [];
    $scope.sendMessage = function(){
        //alert($scope.data.message);
        $scope.messages.push($scope.data.message);

        var message =
        {content:$scope.data.message};

        message = MessageService.save(message);

        $scope.messages.push(message);

        $scope.data.message = " ";
        //alert(message);

    }
}app.controller("LeftHomeController",LeftHomeController);
LeftHomeController.$inject = ['$scope','ProfilePhotoUploadService'];


function LeftHomeController($scope,ProfilePhotoUploadService){
    /* $scope.changePic = function(){

     }*/

    $scope.togglePhoto1 = true;
    $scope.togglePhoto2 = false;

    $scope.onPhotoAttach = function($files){
        ProfilePhotoUploadService.uploadPhoto($files);
        $scope.profile_photo = ProfilePhotoUploadService.getUploadedDatas();

        $scope.togglePhoto1 = false;
        $scope.togglePhoto2 = true;
    }
}
//used in signed_index.html.erb in places
app.controller("PlaceCtrl",PlaceCtrl);

PlaceCtrl.$inject=['$scope','$window','PlaceFavouriteService','PlaceServices','$timeout'];
function PlaceCtrl($scope,$window,PlaceFavouriteService,PlaceServices,$timeout){
    //this is used for pagination
    var counterPlace = 0;

    //this variable is used stopping the calls made to the server end while scrolling
    var flag = true;

    $scope.interestedPlaces =[];

    /*********************************************************************************************************************/

        //This is used for favourite rates(Heart shaped button)
    $scope.favourite = function(place){

        PlaceFavouriteService.getPlaceUrl(place.id).success(function(data){
            if(data.success) {
                //alert("asda");
                place.favourite =place.favourite+1;
            }
        });
    };

    /*********************************************************************************************************************/
        // This is used to fetch the places for the pressed interest
    $scope.fetchPlaces = function(id){
        // alert("Interest Id is "+id);
        PlaceServices.getNextInterest(id).success(function(data){
            $scope.interestedPlaces = [];
            flag = true;
            counterPlace = 1;
            $scope.interestedPlaces.push(data);
        });
    };

    // used to load the next set of values using ng-infinite scroll pagination
    //this function calls to the server automatically when the page is loaded
    $scope.myPagingFunction = function(){

        if(flag){
            counterPlace += 1;
            $timeout(function(){
                PlaceServices.getNextPage(counterPlace).success(function(data){
                    $scope.interestedPlaces.push(data);
                    flag = data.success;
                    return data;
                });
            },1);

        }
    };


    /**********************************************************************************************************************/

}

//used for place/show.html.erb in places
app.controller("PlaceShowCtrl",PlaceShowCtrl);
PlaceShowCtrl.$inject = ['$scope','StoryServices','PlaceDetailServices'];
function PlaceShowCtrl($scope,StoryServices,PlaceDetailServices){
    var flag = false;
    var userCounter =0;
    $scope.toggle = false;
    //alert("ads");
    //$scope.user_rating = 2;
    //passed from the controller
    $scope.current_user_id = gon.user_id;

    //pased from the controller
    if(gon.rating){
        $scope.user_rating = gon.rating.rate;
        $scope.rating_user_id = gon.rating.user_id
    }
    if($scope.user_rating==null){
        $scope.user_rating=0;
    }
    //passed from the controller(gon variables are declared in the controller)
    var trackable_type = gon.type;
    var trackable_id  = gon.id;



    //console.log(type+" rating "+$scope.user_rating+" trackable_id="+id);

    //this is a universal rating routing url
    $scope.rating_url = "/rating";
    $scope.trackable_id = trackable_id;
    $scope.trackable_type = trackable_type;
    //$scope.trip_date="";


    $scope.createStory = function(placeId){
        var story = {
            story_name:$scope.story_name,
            story_description:$scope.story_description,
            place_id:placeId
        };

        story = StoryServices.setStoryUrl().save(story);

    };

    // for getting more details
    $scope.detailDescription = null;
    $scope.detailShow = false;
    $scope.getPlaceDetails = function(){
        //console.log("asdasdasdasdasdadsdasdas"+gon.id);
        PlaceDetailServices.getDetailDescription(trackable_id).success(function(data){
            $scope.detailDescription = data;
            //console.log($scope.detailDescription);
            $scope.detailShow = true;
        });


    }




}

//Used in places/index.html.erb
app.controller("PlaceNewController",PlaceNewController);
PlaceNewController.$inject = ['$scope','PlaceVideoUploadService'];

function PlaceNewController($scope,PlaceVideoUploadService){
    $scope.onVideoAttach = function($files,placeId){
        console.log(placeId);
        PlaceVideoUploadService.attachFile($files,$scope.description,$scope.upload,placeId);
        $scope.attachments = PlaceVideoUploadService.getUploadedAttachment();
        $scope.description = " ";
        $scope.videoAttach = " ";
    }


}

app.controller("PlaceUnsignedCtrl",PlaceUnsignedCtrl);
PlaceUnsignedCtrl.$inject=['$scope','UnsignedPlaceServices'];

function PlaceUnsignedCtrl($scope,UnsignedPlaceServices){

    $scope.places =[];

    $scope.getPlaces = function(){
        UnsignedPlaceServices.getRecentPlaces().success(function(data){
            $scope.places.push(data);
        });
    };




    $scope.currentIndex = 0;

    $scope.setCurrentSlideIndex = function (index) {
        $scope.currentIndex = index;
    };

    $scope.isCurrentSlideIndex = function (index) {
        return $scope.currentIndex === index;
    };


}app.controller("RightHomeController",RightHomeController);
RightHomeController.$inject = ['$scope','SuggestionServices','UserServices'];


function RightHomeController($scope,SuggestionServices,UserServices){
    $scope.test = "Hello world";

    $scope.affinities = [];
    var local = [];
    SuggestionServices.getFriendSuggestions().success(function(data){
        //$scope.affinities.push(data);

        angular.forEach(data,function(v,k){
            //console.log(k);
            //console.log(v);
            //$scope.affinities.push(v);
            local.push(v);
        });


        var lo = local[0];

        for(var i=0;i<lo.length;i++){
            $scope.affinities.push(lo[i]);
        }

        //console.log($scope.affinities);
    });


    $scope.relate = function(user_id,affinity_id,index){
        var other_id = {
            //if i use id then then post will change
            other_id:user_id,
            affinity_id:affinity_id
        };
        var result = UserServices.setRelation().save(other_id);

        $scope.affinities.splice(index,1);

    }


}app.controller("SearchCtrl",SearchCtrl);
SearchCtrl.$inject = ['$scope',"$window"];

function SearchCtrl($scope,$window){
    /* $scope.searchText = null;
     $scope.result = null;
     $scope.search = function(){
     var url = $window.location.origin;
     url = url+"/search/index";

     if(document.URL != url){
     var saver = {
     query:$scope.searchText
     }

     var obj = SearchServices.getSearchResults().save(saver);
     $scope.qq = obj;

     //alert(document.URL);
     }

     }
     */
}app.controller("InterestsCtrl",InterestsCtrl);
InterestsCtrl.$inject = ['$window','$scope','AddInterestService','UserServices'];
function InterestsCtrl($window,$scope,AddInterestService,UserServices){

    $scope.interstIds = [];
    $scope.currentUser = $window.user
    ;
    var user_id = gon.user_id;
    $scope.isDisabled = {};
    $scope.addInterest = function(interestId){
        //var interestId = interest.id;
        var AddInterest = AddInterestService.interestUrl();
        var id = {
            id:interestId,
            user_id:user_id
        };

        $scope.isDisabled[interestId] = true;

        //alert("lllllll");
        var added = AddInterest.save(id);
        //var ss = "data"+id;
        $scope.added = added;
        //$scope."data"+id = true;
        $scope.interstIds.push(interestId);
        var ids =0;
        $scope.flag = function(id){

        }


    };


    var workPlaceElement = angular.element("#user_workplace_tokens");

    workPlaceElement.change(function(){
        $scope.$apply(function(){
            $scope.user_college = workPlaceElement.val();
        });
    });


    //getting the locations from the locations ...we are using the jquery token input technique here
    var locationElement = angular.element("#user_location_tokens");

    locationElement.change(function(){
        $scope.$apply(function(){
            $scope.user_location = locationElement.val();
            //console.log($scope.user_location);
        });
    });


    //triggered when the Done button is pressed
    $scope.addWorkPlace = function(){
        //alert($scope.user_college);
        //console.log($scope.user_college);

        var workplace = {
            workplace_ids:$scope.user_college,
            user_id: user_id,
            location_ids:$scope.user_location
        };

        workplace = UserServices.setWorkPlace().save(workplace);

    }




}//trips/new.html
app.controller("TripCtrl",TripCtrl);
TripCtrl.$inject = ['$scope','UserServices'];

function TripCtrl($scope,UserServices){
    var userCounter =0;
    $scope.users = null;
    $scope.inviteFollowers= function(){
        userCounter += 1;

        if($scope.users == null){
            UserServices.getFollowers(userCounter).then(function(data){
                console.log(data) ;

                $scope.users = data;

            });
        }

    };

    //This is used for the checkbox
    $scope.userIds=[];
    $scope.toggleSelection = function toggleSelection(id) {
        var idx = $scope.userIds.indexOf(id);

        // is currently selected
        if (idx > -1) {
            $scope.userIds.splice(idx, 1);
        }
        // is newly selected
        else {
            $scope.userIds.push(id);
        }
        console.log($scope.userIds);
    };

}
//trips/index.html.erb
app.controller("TripIndexCtrl",TripIndexCtrl);
TripIndexCtrl.$inject = ['$scope'];

function TripIndexCtrl($scope){

    $scope.unjoinToggleOut = false;
    $scope.joinToggleOut = false;
    $scope.acceptance = true;


    $scope.join = function(id){
        $scope.acceptance = !$scope.acceptance;
        $scope.unjoinToggleOut = !$scope.unjoinToggleOut
    };

    $scope.unjoin = function(id){
        $scope.joinToggleOut = !$scope.joinToggleOut;
        $scope.acceptance = !$scope.acceptance;
    };

    //$scope.trip = [];
    $scope.trips = gon.trips;
    // $scope.ss = "asdsa";


    /* angular.forEach($scope.trips,function(v,k){
     //console.log(v.id);
     var button = angular.element("#button_"+v.id);

     });*/

    //var button = angular.element("#button")


}app.controller("VideoCtrl",VideoCtrl);
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