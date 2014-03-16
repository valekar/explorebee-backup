app.directive("datepickers",datepickers);
datepickers.$inject =[];

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