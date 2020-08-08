function verify() {
    console.log(window.location.href.substring(25));
    document.getElementById("regForm").action='/verifyOTP/'+window.location.href.substring(26);
}