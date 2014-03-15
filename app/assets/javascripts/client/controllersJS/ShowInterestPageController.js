app.controller("InterestsCtrl",InterestsCtrl);
InterestsCtrl.$inject = ['$window','$scope','AddInterestService','UserServices'];
function InterestsCtrl($window,$scope,AddInterestService,UserServices){

    $scope.interstIds = []
    $scope.currentUser = $window.user

    var user_id = gon.user_id
    $scope.isDisabled = {};
    $scope.addInterest = function(interestId){
            //var interestId = interest.id;
            var AddInterest = AddInterestService.interestUrl();
            var id = {
                id:interestId,
                user_id:user_id
            }

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




}