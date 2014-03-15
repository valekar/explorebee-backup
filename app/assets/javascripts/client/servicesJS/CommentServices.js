//this one is used for commenting
app.factory("CommentUrlService",CommentUrlService);


CommentUrlService.$inject = ['$resource'];
function CommentUrlService($resource){

    return{
        getUrl:function(model,id){
            var url = "/"+model+"/"+id+"/comments/:id.json";
            return $resource(url,{id:"@id"});
        }


     }
}


