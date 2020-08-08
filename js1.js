function func() {
    var fname, lname, pass1, email, otp;
    fname=document.getElementById("exampleInputFirstName1").value;
    lname=document.getElementById("exampleInputLastName1").value;
    pass1=document.getElementById("exampleInputPassword1").value;
    pass2=document.getElementById("exampleInputPassword2").value;
    email=document.getElementById('exampleInputEmail1').value;
    document.getElementById("regForm").action="genotp/"+email;
    if(fname.length==0 || lname.length==0 || pass1.length==0 || pass2.length==0) {
        alert("All fields are mandatory!");
        return false;
    }
    if(pass1.localeCompare(pass2)!=0) {
        alert("Passwords don't match!");
        return false;
    }
    return true;
}