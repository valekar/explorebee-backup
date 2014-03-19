app.controller("LeftHomeController",LeftHomeController);
LeftHomeController.$inject = ['$scope','ProfilePhotoUploadService'];


function LeftHomeController($scope,ProfilePhotoUploadService){
    /* $scope.changePic = function(){

     }*/

    $scope.togglePhoto1 = true;
    $scope.togglePhoto2 = false;


    //sending the modal id for closing
    var closePicModal = angular.element("#changePicAttachment");


    $scope.onPhotoAttach = function($files){

        ProfilePhotoUploadService.uploadPhoto($files,closePicModal);

        var ass = ProfilePhotoUploadService.getUploadedDatas();
        $scope.profile_photo = ass;
        $scope.togglePhoto1 = false;
        $scope.togglePhoto2 = true;
    }
}