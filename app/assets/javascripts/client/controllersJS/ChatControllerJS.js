app.controller("ChatCtrl", ChatCtrl)

ChatCtrl.$inject = ['$scope','MessageService'];

function ChatCtrl($scope,MessageService){

    $scope.messages = [];
    $scope.sendMessage = function(){
        //alert($scope.data.message);
        $scope.messages.push($scope.data.message);

        var message =
            {content:$scope.data.message};

        message = MessageService.save(message);

        $scope.messages.push(message);

        $scope.data.message = " ";
        //alert(message);

    }
}