//trips/new.html
app.controller("TripCtrl",TripCtrl)
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
    $scope.userIds=[]
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
    app.controller("TripIndexCtrl",TripIndexCtrl)
TripIndexCtrl.$inject = ['$scope'];

function TripIndexCtrl($scope){

        $scope.unjoinToggleOut = false;
        $scope.joinToggleOut = false;
        $scope.acceptance = true;


        $scope.join = function(id){
            $scope.acceptance = !$scope.acceptance;
            $scope.unjoinToggleOut = !$scope.unjoinToggleOut
        }

        $scope.unjoin = function(id){
            $scope.joinToggleOut = !$scope.joinToggleOut;
            $scope.acceptance = !$scope.acceptance;
        }

        //$scope.trip = [];
        $scope.trips = gon.trips
          // $scope.ss = "asdsa";


       /* angular.forEach($scope.trips,function(v,k){
           //console.log(v.id);
           var button = angular.element("#button_"+v.id);

        });*/

        //var button = angular.element("#button")


    }