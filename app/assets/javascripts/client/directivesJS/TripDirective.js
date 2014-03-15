app.directive("tripJoin", tripJoin);
tripJoin.$inject = ['TripServices'];
function tripJoin(TripServices) {
    return {
        restrict: 'A',
        scope: {
            trip_id: '=tripId',
            trip_acceptance:"=tripAcceptance",
            trip_invitee:"=tripInvitee"

        },
        template:"<input type='button' value='' class='button round'> ",
        replace: true,
        transclude: true,

        controller: function($scope, $attrs, $http) {
           // console.log($scope.trip_acceptance)


            $scope.setAcceptance = function(element){
                var acceptanceUrl = TripServices.setTripAcceptanceUrl();
                $scope.acceptance= !$scope.acceptance;
                var acceptance = {
                    trip_id:$scope.trip_id,
                    trip_acceptance:$scope.acceptance,
                    trip_invitee:$scope.trip_invitee
                }

                var acceptance = acceptanceUrl.save(acceptance);

                if($scope.acceptance==true){
                    element.val('Unjoin');


                }
                else{
                    element.val('Join');
                }

                $scope.$apply();
            }

        },
        link: function(scope, iElem, iAttrs) {

            // console.log(scope.trip_acceptance);
             scope.acceptance = scope.trip_acceptance;
            if(scope.trip_acceptance==true){
                iElem.val('Unjoin');
            }
            else if(scope.trip_acceptance==false){
                iElem.val('Join');
            }


              iElem.bind('click',function(){
                     //alert(scope.trip_id);

                  scope.setAcceptance(iElem);

              });


        }
    };
}