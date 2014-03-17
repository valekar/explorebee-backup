
app.directive("flow",flow);
flow.$inject = [];
function flow(){
    return {


        link:function(scope, element, attrs) {
            return scope.$watch('showcast', function(url) {
                if (url) {
                    return element.flowplayer({
                        playlist: [
                            [
                                {
                                    mp4: url
                                }
                            ]
                        ],
                        ratio: 9 / 14,
                        autoPlay: true,
                        autoBuffering: true
                    });
                }
            });
        },

        controller:['$scope',function($scope){
            $scope.showcast = null;
            $scope.showVideo=function(url){
                $scope.showcast = url
            }
        }]

    }
}

