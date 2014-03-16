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
            console.log("asdasdasdasdasdadsdasdas"+gon.id);
            PlaceDetailServices.getDetailDescription(trackable_id).success(function(data){
                $scope.detailDescription = data;
                console.log($scope.detailDescription);
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
PlaceUnsignedCtrl.$inject=["$scope","UnsignedPlaceServices"];

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


}