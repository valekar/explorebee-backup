app.factory("PlaceServices",PlaceServices);
PlaceServices.$inject = ['$http'];

function PlaceServices($http){

        var service = {

//        var url = "/places/get_other_places"
//        return $http.get(url);
          getPlacesUrl :function(interest_id){
              return $http.get("/places/signed_index?interest_id="+interest_id);
          },

          getPaginationUrl:function(offset){
              return $http.get("/places/signed_index?page="+offset);
          },
          getNextPage:function(counter){
                return $http.get("/places/getPlaces?page="+counter);
          },
            getNextInterest:function(id){
                return $http.get("/places/getPlaces?interest_id="+id);
            }


        }

        return service;

}
app.factory("PlaceFavouriteService",PlaceFavouriteService);
PlaceFavouriteService.$inject = ['$http'];

function PlaceFavouriteService($http){

        var service = {
        getPlaceUrl:function(id){
            return $http.get("/places/favourite?place="+id);
            }
        }

        return service;

}/*.factory("PlaceAndTripServices",function($resource){
       var service ={
           getPlaceAndTripUrl:function(){
               return $resource("/trips/create_trip/:id.json",{id:"@id"});
           }
       }

        return service;

    });*/

//Newly added after getting al services into one file
app.factory("PlaceDetailServices",PlaceDetailServices);
PlaceDetailServices.$inject = ['$http'];
function PlaceDetailServices($http){
    var service ={
        getDetailDescription:function(trackable_id){
            return $http.get("/places/getDetailDescription?place_id="+trackable_id);
        }
    };
    return service;
}


//Used in unsigned html page /static_pages/home part
app.factory("UnsignedPlaceServices",UnsignedPlaceServices);
UnsignedPlaceServices.$inject=["$http"];

function UnsignedPlaceServices($http){
    return {
        getRecentPlaces:function(){
            return $http.get("/static_pages/get_place_photos");
        }
    }
}

