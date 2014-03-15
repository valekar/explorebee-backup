$('#masonry-container').masonry({

    // set columnWidth a fraction of the container width
    columnWidth: function( containerWidth ) {
        return containerWidth /6;
    }



});