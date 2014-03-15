app.factory("MessageService",MessageService);

MessageService.$inject = ['$resource'];
function MessageService($resource){
    var service = $resource('/messages/:id.json',
                  {id:'@id'},
                  {}
                );

       return service;

}