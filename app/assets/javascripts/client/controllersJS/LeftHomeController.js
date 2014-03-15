app.controller("LeftHomeController",LeftHomeController);
LeftHomeController.$inject = ['$scope','ProfilePhotoUploadService'];


function LeftHomeController($scope,ProfilePhotoUploadService){
    /* $scope.changePic = function(){

     }*/

    $scope.togglePhoto1 = true;
    $scope.togglePhoto2 = false;

    $scope.onPhotoAttach = function($files){
        ProfilePhotoUploadService.uploadPhoto($files);
        $scope.profile_photo = ProfilePhotoUploadService.getUploadedDatas();

        $scope.togglePhoto1 = false;
        $scope.togglePhoto2 = true;
    }
}