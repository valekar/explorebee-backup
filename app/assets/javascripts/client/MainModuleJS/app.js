var app = angular.module('myApp',
        ['ngRoute',
          'ngResource','ng-rails-csrf','ngCookies','angularFileUpload','infinite-scroll','ratings','ngProgress']);
app.config(['$routeProvider',function($routeProvider){
    $routeProvider.when("/",{
        //templateUrl:'/angularTemplates/dashboard.html',
        controller:'HomeController'
        /*resolve: {
            //SessionService has been declared
            session: function(SessService){
                return SessService.getCurrentUser();
            },
            microposts:function(MicropostIndexService){
                return MicropostIndexService.getMicroposts();
            }


        }*/

    })
        .otherwise({redirectTo: '/'}) ;
}]);
app.config(['$locationProvider',function($locationProvider){
        // this is used to remove '#' from the URL
        $locationProvider.html5Mode(true);
    }]);

app.config( ['$compileProvider',function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|tel):/);
}]);
app.run(['$rootScope',function($rootScope) {

    $rootScope.$on('$viewContentLoaded', function () {
    $(function(){ $(document).foundation(); });
});
}]);
