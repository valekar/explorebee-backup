app.factory("AddInterestService",AddInterestService);


AddInterestService.$inject = ['$resource'];
function AddInterestService($resource){
  /*  var AddInterest = $resource('interestship/:id.json',
        {id:'@id'},
        {}
    );
    return AddInterest;
*/

    var service = {
        interestUrl:function(){
            var url = "/interestship";
            return $resource(url);
        }
    };

    return service;

}
app.factory("GetInterestsService",GetInterestsService);
GetInterestsService.$inject = ['$http'];

function GetInterestsService($http){
        var service = {
            getInterest:function(){
                return $http.get("/show_interests/get_index");
            }
        };
        return service;
    }