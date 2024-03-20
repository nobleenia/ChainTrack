// Login Form Handler

$('#loginForm').submit(function(e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: "/login", // Adjust if your endpoint is different
        data: $(this).serialize(),
        success: function(response) {
            window.location.href = "/dashboard"; // Redirect to dashboard
        },
        error: function(error) {
            alert("Invalid email or password."); // Customize this
        }
    });
});
