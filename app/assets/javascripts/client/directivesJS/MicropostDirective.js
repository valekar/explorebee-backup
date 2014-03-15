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



