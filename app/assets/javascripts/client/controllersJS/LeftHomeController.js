app.controller("LeftHomeController",LeftHomeController);
LeftHomeController.$inject = ['$scope','ProfilePhotoUploadService','LargeProfilePhotoService'];


function LeftHomeController($scope,ProfilePhotoUploadService,LargeProfilePhotoService){
    /* $scope.changePic = function(){

     }*/

    $scope.togglePhoto1 = true;
    $scope.togglePhoto2 = false;
    $scope.largePhotoUrl = '';


    //sending the modal id for closing
    var closePicModal = angular.element("#changePicAttachment");


    $scope.onPhotoAttach = function($files){

        ProfilePhotoUploadService.uploadPhoto($files,closePicModal);

        var ass = ProfilePhotoUploadService.getUploadedDatas();
        $scope.profile_photo = ass;
        $scope.togglePhoto1 = false;
        $scope.togglePhoto2 = true;
    }



    $scope.loadImage = function(){
        LargeProfilePhotoService.getLargePhoto().success(function(data){
           $scope.largePhotoUrl = data;
        });
    }


}