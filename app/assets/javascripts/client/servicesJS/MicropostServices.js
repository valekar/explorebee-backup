app.factory("Micropost",Micropost);
Micropost.$inject = ['$resource'];


function Micropost($resource){
            var Micropost = $resource('microposts/:id.json',
                {id:'@id'},
                {}
            );
        return Micropost;
    }





