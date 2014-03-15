app.factory("StoryServices",StoryServices);
StoryServices.$inject = ['$resource'];
function StoryServices($resource){
    var service = {
        setStoryUrl:function(){
            return $resource("/stories/create_story/:id.json",{id:'@id'})
        }
    }

    return service;
}