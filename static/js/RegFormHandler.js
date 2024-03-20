// Registration Form Handler
$(document).ready(function() {
    $('#registrationForm').submit(function(e) {
        e.preventDefault(); // Prevent default form submission
        $.ajax({
            type: "POST",
            url: "/signup",
            data: $(this).serialize(),
            success: function(response) {
                alert(response.message); // Customize this to use your modal
                window.location.href = "/login"; // Redirect
            },
            error: function(error) {
                alert(error.responseJSON.message); // Customize this
            }
        });
    });
});
