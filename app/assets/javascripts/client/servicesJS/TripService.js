app.factory("TripServices",TripServices);
TripServices.$inject = ['$resource'];

function TripServices($resource){
          var service ={
              setTripAcceptanceUrl:function(){
                  return $resource("/trips/acceptance:id.json",{id:"@id"});
              }
          };
    return service;
}