var newPage = "https://login.ccmain.ohionet.org/login?url=";
var access = "https://library.ccf.org/wamvalidate?url=";
var otherNewPage = "https://login.ccmain.ohionet.org/login?qurl=";

//get message from background and process
function determineLogin(){
  chrome.runtime.sendMessage({greeting: "requestLoginInfo"}, function(response) {
    if(!response.success){
      error("no login credentials set!");
      return;
    }
    var url = window.location.href;
    if(url.includes(newPage)){
      loginNewPage(response);
    }
    else if(url.includes(access)){
      loginAccess(response);
    }
    else if (url.includes(otherNewPage)){
      loginOther(response);
    }
    else{
      log("Failed login at: "+url);
    }
  });
}

//similar signature to newPage, different login url
function loginOther(response){
  loginNewPage(response);
}

function loginNewPage(response){
  console.log("Trying new login protocol");
  var lname = response.lname,
  fname = response.fname,
  emp   = response.emp,
  pass  = response.pass;
  var urlloc = window.location.href;
  $('input[value="Last Name"]').val(lname);
  $('input[value="Employee ID"]').val(emp);
  $('input[value="Password"]').attr("type","password");
  $('input[value="Password"]').val(pass);
  var filled = $('input[value="Last Name"]').val() && $('input[value="Employee ID"]').val() && $('input[value="Password"]').val();
  if (filled){
    $('input[value="Sign in"]').click();
    //clinical-key defaults to homepage instead of requested page (bad design imo)
    var decodedLoc = urlloc.substring(newPage.length);
    if (decodedLoc.includes("clinicalkey")){
      navigateToClinicalKey(decodedLoc);
    }
  }
  else{
    //some clinicalkey pages have the old format
    console.log("New protocol failed. Fallback to old protocol");
    loginAccess(response);
  }

}
//callback not needed
function loginAccess(response){
  console.log("Trying old login protocol");
  var lname = response.lname,
  fname = response.fname,
  emp   = response.emp,
  pass  = response.pass;
  var urlloc = window.location.href;
  $('input[name="name"]').val(lname+", "+fname);
  $('input[name="code"]').val(emp);
  $('input[name="pin"]').val(pass);
  var filled = $('input[name="name"]').val() && $('input[name="code"]').val() && $('input[name="pin"]').val();
  console.log(filled);
  if (filled){
    $('input[value="submit"]').click();
  }
}

function navigateToClinicalKey(url){
  chrome.runtime.sendMessage(
    {
      greeting: "navigateToUrl-clinicalKey",
      navUrl:url
    });
  }

  function log(e){
    chrome.runtime.sendMessage({
      greeting:"log",
      message:e
    });
  }

  function error(e){
    chrome.runtime.sendMessage({
      greeting:"error",
      message:e
    });
  }

  $(function(){
    determineLogin();
  });
