app.factory("UserServices",UserServices);
UserServices.$inject = ['$resource','$http'];
function UserServices($resource,$http){
          var service = {
              setWorkPlace:function(){
                  return $resource("/users/create_user_and_work/:id.json",{id:"@id"})
              },

             getFollowers: function(counter){
                 return $http.get("/getFollowers?page="+counter);
             },

             setRelation: function(){
                 return $resource("/users/relate/:id.json", {id:"@id"})
             }

          }

    return service;
}