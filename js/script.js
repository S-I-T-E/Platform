Dropzone.autoDiscover = false;
$(function() {
    $(".button-collapse").sideNav();
    $('select').material_select();
    $('.modal').modal({});
    $('#announcementsModal').modal({
        dismissible: false,
        complete: function() {
            $.get('/announcementOpened');
        }
    });
    $('#announcementsModal').modal('open');
    var myVar = setInterval(time, 1000);

    function time() {
        var d = new Date();
        $("#fullTime").html(d.toLocaleTimeString());
    }
    $('#uploadcsvbtn').click(function() {
        $("div#csvuploaddiv").dropzone({
            url: "/uploadCSV",
            paramName: "3v7465OC$UsX",
            acceptedFiles: ".csv",
            dictDefaultMessage: "Drop files or click here to upload. Only CSVs are accepted."
        });
    })
    $('#csvuploadupdatebtn').click(function() {
        $.post("/updateDB", function(data) {
            console.log(data)
        });
    })
    $('#loginForm').submit(function(e) {
        e.preventDefault();
        $('#loginForm input[type=password]').removeClass('invalid');
        $('#loginForm input[type=text]').removeClass('invalid');
        $.post("/login", form_to_json($('#loginForm')))
            .done(function() {
                window.location.href = '/dashboard';
            })
            .fail(function(response) {
                $("#snackbar").html(response.responseText)
                if (response.responseText.includes("password")) {
                    $('#loginForm input[type=password]').addClass('invalid');
                }
                else if (response.responseText.includes("username")) {
                    $('#loginForm input[type=text]').addClass('invalid');
                }
                $("#snackbar").addClass('show')
                setTimeout(function() {
                    $("#snackbar").removeClass('show')
                }, 3000);
            });
    })
    $('#csvuploadclosebtn').click(function() {
        $("#csvuploadzone").html('<div class="dropzone dz-clickable" id="csvuploaddiv"></div>');
    })

    $('#studentLocatorSearch').submit(function(e) {
        e.preventDefault();
        var search = $('#search').val();
        if (/^[a-zA-Z0-9- ]*$/.test(search) == true && search !== "") {
            $('#studentSearchResultsError').html('');
            $('#studentSearchResults').html('');
            $.post('/studentSearch', {
                search: search
            }, function(data) {
                if (data.length > 0) {
                    for (var x = 0; x < data.length; x++) {
                        $('#studentSearchResults').append('<tr id="' + data[x]['Student ID'] + '"><td>' + data[x]['First Name'] + " " + data[x]['Last Name'] + '</td><td>' + data[x].Grade + '</td><td>' + data[x]['Student ID'] + '</td></tr>');
                    }
                    $('table').removeClass("hide");
                }
                else {
                    $('table').addClass("hide");
                    $('#studentSearchResultsError').html('No students were found.');
                }

            });
        }
        else {
            console.log("aoo")
            $('#studentSearchResults').html('');
            $('table').addClass("hide");
            $('#studentSearchResultsError').html('Please enter a valid search request');
        }

    });
    $("#studentSearchResults").on("click", "tr", function(event) {
        $.post('/displayStudentInfo', {
            studentID: $(this).attr('id')
        }, function(data) {
            $('#studentLocatorResultsName').html(data.name);
            $('#studentLocatorResultsGradeID').html("Grade " + data.grade + " ID: " + data.id);
            $('#studentLocatorResultsModal').modal('open');
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

function form_to_json(selector) {
    var ary = $(selector).serializeArray();
    var obj = {};
    for (var a = 0; a < ary.length; a++) obj[ary[a].name] = ary[a].value;
    return obj;
}
