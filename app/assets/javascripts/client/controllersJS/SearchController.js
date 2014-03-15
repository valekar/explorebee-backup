app.controller("SearchCtrl",SearchCtrl);
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
}