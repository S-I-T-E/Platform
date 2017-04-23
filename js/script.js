Dropzone.autoDiscover = false;
$(function() {
    $(".button-collapse").sideNav();
    $('select').material_select();
    $('.modal').modal({dismissible: false});
    $('#announcementsModal').modal('open');
    var myVar = setInterval(time, 1000);
    function time() {
        var d = new Date();
        $("#fullTime").html(d.toLocaleTimeString());
    }
    $('#uploadcsvbtn').click(function(){
        $("div#csvuploaddiv").dropzone({ url: "/uploadCSV", paramName: "3v7465OC$UsX", acceptedFiles:".csv",  dictDefaultMessage:"Drop files or click here to upload. Only CSVs are accepted."});
    })
    $('#csvuploadupdatebtn').click(function(){
        $.post( "/updateDB", function( data ) {
        console.log(data)
});
    })
    $('#csvuploadclosebtn').click(function(){
        $("#csvuploadzone").html('<div class="dropzone dz-clickable" id="csvuploaddiv"></div>');
    })
    
    $('#studentLocatorSearch').submit(function(e) {
    e.preventDefault();
    var search = $('#search').val();
    $('#studentSearchResults').html('');
        $.post('/studentSearch',{search: search},function(data){
            console.log(data[0])
      for(var x = 0; x < data.length; x++){
          $('#studentSearchResults').append('<a><tr><td>'+data[x]['First Name']+" "+data[x]['Last Name']+'</td><td>'+data[x].Grade+'</td><td>'+data[x]['Student ID']+'</td></tr></a>');
      }
      $('table').removeClass("hide");
    });
});
})

function appSearch() {
    for (var x = 0; x < 25; x++) {
        str = "App" + x
        if (str.indexOf($('#appSearchBar').val()) >= 0) {
            $('#App' + x).css('display', 'block')
        }
        else $('#App' + x).css('display', 'none')
    }
}

function s(){
    
}