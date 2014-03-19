app.factory("ActivityIndexService",ActivityIndexService);

ActivityIndexService.$inject = ['$http'];

function ActivityIndexService($http){

       return  {getActivities: function(offsets){
           var url = "/index_pagination?page="+offsets;
           return $http.get(url);
       }
       }


}
    app.factory("ActivityOtherUserService",ActivityOtherUserService);

ActivityOtherUserService.$inject = ['$http'];

function ActivityOtherUserService($http){
        return {
            getFeed:function(user_id,trackable_id,trackable_type){
                var tr_type = angular.lowercase(trackable_type);
                var url = "/show_others_details?trackable_id="+trackable_id+"&user_id="+user_id+"&trackable_type="+trackable_type;
                return $http.get(url);
            }
        }
}
app.factory("ActivityRemoveService",ActivityRemoveService);


ActivityRemoveService.$inject = ['$resource'];


function ActivityRemoveService($resource){
    return {
        removeFeed:function(){
            return $resource("/activities/remove_activity");
        }
    }
}
