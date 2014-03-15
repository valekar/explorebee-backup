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