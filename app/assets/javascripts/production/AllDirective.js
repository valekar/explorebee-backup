app.directive("datepickers",datepickers);
datepickers.$inject =[]

function datepickers(){
    return {
        restrict:"A",
        transclude:true,
        template:"<input type='text' placeholder='Date'  required ng-model='trip_date'> ",

        link:function(scope,element,attr){
            var nowTemp = new Date();
            var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate());

            var d = new Date();
            var curr_date = d.getDate();
            var curr_month = d.getMonth() + 1; //Months are zero based
            var curr_year = d.getFullYear();
            var dd = curr_date + "/" + curr_month + "/" + curr_year;

            element.bind("click",function(){
                element.fdatepicker({
                    onRender: function (date) {
                        return date.valueOf() < now.valueOf() ? 'disabled' : '';
                    }
                }).data('datepicker');
            });


        }
    }
}

/*
 app.directive("myflowplayer",function(GetVideosService,flowPlayerService){
 return {
 template:"<a href= '' style='display:block;width:200px;height:150px;'id='player'></a>",
 scope:{
 url:"@"
 },
 link:function(scope,ele,attr){
 console.log(ele.children()[0]);
 //console.log(attr.url);

 var anc = ele.children()[0];

 scope.$watch("url",function(newval,oldval){

 console.log(newval);
 //console.log(oldval);
 url = newval;

 scope.url = newval;




 ele.flowplayer({
 clip:  {
 autoPlay: false,
 autoBuffering: true
 },
 plugins: { // load one or more plugins
 controls: { // load the controls plugin

 // always: where to find the Flash object
 url: '/flowplayer.controls-tube-3.2.15.swf'
 // display properties
 ,
 tooltips: { // this plugin object exposes a 'tooltips' object
 buttons: true,
 fullscreen: 'Enter Fullscreen mode'
 }
 }
 }
 });


 //anc.prop('href',url);
 });




 }

 }
 });
 */

/*
 app.directive("flowplayer",function(){
 return {
 scope:{
 url:"@"
 },
 link:function(scope,element,attr){

 return scope.$watch("url",function(newval,oldval){

 console.log(newval);
 //console.log(oldval);


 scope.url = newval;

 if(scope.url){
 return element.flowplayer({
 playlist : [
 [
 {
 mp4:scope.url
 }

 ]

 ],
 ratio: 9/14
 })
 }


 })
 }
 }
 })*/
/*

 app.directive("flow",function(){
 return {
 scope:{
 url:"@",
 ims:"@"
 },
 link:function(scope,element,attr){

 element.bind("click",function(){
 element.flowplayer(this,"/flowplayer.swf",{

 clip: {url:scope.url,
 autoPlay: true,
 autoBuffering: true},
 ratio:9/14,
 controls :{

 }


 })

 })
 }
 }
 }) ;

 app.directive('flowPlayer', function() {
 return function(scope, element, attrs) {
 return scope.$watch('name', function(screencast) {
 if (screencast) {
 return element.flowplayer("player", "/flowplayer_html5.swf",{
 playlist: [
 [
 {
 mp4: screencast
 }
 ]
 ],
 ratio: 9 / 14
 });
 }
 });
 };
 });
 */

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

        controller:function($scope){
            $scope.showcast = null;
            $scope.showVideo=function(url){
                $scope.showcast = url
            }
        }

    }
}

//angular.module("myApp.Directive",[])
app.directive("micro",micro);
function micro(){
    return {
        restrict:"E",
        template:"<div>This is a miracle</div>",
        link:function(scope,element,attr){

        }
    }
}



app.directive("orbitdirective",orbitdirective);

function orbitdirective(){
    var linker = function(scope,element,attrs){
        element.foundation();
        //element.foundation.orbit(scope.$eval(attrs.orbitdirective));
    }

    return {
        restrict:'A',
        link:linker
    }
}
/* ng-infinite-scroll - v1.0.0 - 2013-02-23 */
var mod;

mod = angular.module('custom-scroll', []);

mod.directive('customScroll', customScroll);

customScroll.$inject = [
    '$rootScope', '$window', '$timeout','$document'];

function customScroll($rootScope, $window, $timeout,$document) {
    return {
        link: function(scope, elem, attrs) {
            var checkWhenEnabled, handler, scrollDistance, scrollEnabled;
            $window = angular.element($window);
            scrollDistance = 0;
            if (attrs.infiniteScrollDistance != null) {
                scope.$watch(attrs.infiniteScrollDistance, function(value) {
                    return scrollDistance = parseInt(value, 30);
                });
            }
            scrollEnabled = true;
            checkWhenEnabled = false;
            if (attrs.infiniteScrollDisabled != null) {
                scope.$watch(attrs.infiniteScrollDisabled, function(value) {
                    scrollEnabled = !value;
                    if (scrollEnabled && checkWhenEnabled) {
                        checkWhenEnabled = false;
                        return handler();
                    }
                });
            }
            handler = function() {
                var elementBottom, remaining, shouldScroll, windowBottom;
                var document = angular.element($document);
                windowBottom = $window.height()+document.height() + $window.scrollTop();
                elementBottom = elem.offset().top + elem.height();
                remaining = elementBottom - windowBottom;
                //shouldScroll = remaining <= $window.height() * scrollDistance;
                //added by me
                shouldScroll = ($window.scrollTop()>document.height()-$window.height()-15);
                if (shouldScroll && scrollEnabled) {
                    if ($rootScope.$$phase) {
                        return scope.$eval(attrs.infiniteScroll);
                    } else {
                        return scope.$apply(attrs.infiniteScroll);
                    }
                } else if (shouldScroll) {
                    return checkWhenEnabled = true;
                }
            };
            $window.on('scroll', handler);
            scope.$on('$destroy', function() {
                return $window.off('scroll', handler);
            });
            return $timeout((function() {
                if (attrs.infiniteScrollImmediateCheck) {
                    if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
                        return handler();
                    }
                } else {
                    return handler();
                }
            }), 0);
        }
    };
}
app.directive("tripJoin", tripJoin);
tripJoin.$inject = ['TripServices'];
function tripJoin(TripServices) {
    return {
        restrict: 'A',
        scope: {
            trip_id: '=tripId',
            trip_acceptance:"=tripAcceptance",
            trip_invitee:"=tripInvitee"

        },
        template:"<input type='button' value='' class='button round'> ",
        replace: true,
        transclude: true,

        controller: function($scope, $attrs, $http) {
            // console.log($scope.trip_acceptance)


            $scope.setAcceptance = function(element){
                var acceptanceUrl = TripServices.setTripAcceptanceUrl();
                $scope.acceptance= !$scope.acceptance;
                var acceptance = {
                    trip_id:$scope.trip_id,
                    trip_acceptance:$scope.acceptance,
                    trip_invitee:$scope.trip_invitee
                }

                var acceptance = acceptanceUrl.save(acceptance);

                if($scope.acceptance==true){
                    element.val('Unjoin');


                }
                else{
                    element.val('Join');
                }

                $scope.$apply();
            }

        },
        link: function(scope, iElem, iAttrs) {

            // console.log(scope.trip_acceptance);
            scope.acceptance = scope.trip_acceptance;
            if(scope.trip_acceptance==true){
                iElem.val('Unjoin');
            }
            else if(scope.trip_acceptance==false){
                iElem.val('Join');
            }


            iElem.bind('click',function(){
                //alert(scope.trip_id);

                scope.setAcceptance(iElem);

            });


        }
    };
}