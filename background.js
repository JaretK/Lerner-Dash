/**
Part of the CCLCM chrome extension
Automatically logs in to commonly accessed pages that require CCF auth
**/

//edit these
var lastname = "";
var firstname = "";
var employeeID = "";
var lib_pass = "";

//TODO: Add CryptoJS encryption (ask for fields on log in and when preferences clicked)
//TODO: House preferences in background.html
//TODO: Ask for pin in popup.html (remove current html and replace when asking)

var pin = ""; //for encryption

// searchable links -->
// replace TEST_SEARCH with URI encoded query -->
// NB clinicalkey natively adds %2520 for space, pubmed adds + ... %20 works in both cases -->
var toReplace = "TEST_SEARCH";
var searchable_links = {
  "access-med" : "http://accessmedicine.mhmedical.com.ccmain.ohionet.org/SearchResults.aspx?q=TEST_SEARCH",
  "clinical-key" : "https://www-clinicalkey-com.ccmain.ohionet.org/#!/search/TEST_SEARCH",
  "pubmed" : "https://www.ncbi.nlm.nih.gov/pubmed/?term=TEST_SEARCH",
  "uptodate":"https://0-www.uptodate.com.library.ccf.org/contents/search?search=TEST_SEARCH&sp=0&searchType=PLAIN_TEXT&source=USER_INPUT&searchControl=TOP_PULLDOWN&searchOffset=1&autoComplete=false&language=en&max=10",
  "wikipedia":"https://en.wikipedia.org/wiki/Special:Search?search=TEST_SEARCH"
};
//resource links that map to searchable_links
var resource_links = {
  "access-med" : "http://accessmedicine.mhmedical.com.ccmain.ohionet.org/",
  "clinical-key" : "https://www-clinicalkey-com.ccmain.ohionet.org/#!/",
  "pubmed" : "https://www.ncbi.nlm.nih.gov/pubmed/",
  "uptodate":"http://0-www.uptodate.com.library.ccf.org/contents/search",
  "wikipedia":"https://www.wikipedia.org/",
  "cclcm-portal" : "http://portal.cclcm.ccf.org/cclcm/",
  "cclcm-library": "http://portals.clevelandclinic.org/library/Home/tabid/5219/Default.aspx",
  "cclcm-moodle": "https://mdl.cclcm.ccf.org/course/index.php?categoryid=27",
  "cclcm-disease-management": "http://www.clevelandclinicmeded.com/medicalpubs/diseasemanagement/",
  "sr-bb" : "https://www-clinicalkey-com.ccmain.ohionet.org/#!/browse/book/3-s2.0-C20110061677",
  "sr-grays":"https://www-clinicalkey-com.ccmain.ohionet.org/#!/browse/book/3-s2.0-C20110061707",
  "sr-katzung":"http://accessmedicine.mhmedical.com.ccmain.ohionet.org/book.aspx?bookid=1193",
  "sr-harrisons" : "http://accessmedicine.mhmedical.com.ccmain.ohionet.org/book.aspx?bookID=1130",
  "sr-casefiles" : "http://casefiles.mhmedical.com/CaseBrowse.aspx#40971"
};

var searchableMoodleLink = "https://mdl.cclcm.ccf.org/enrol/index.php?id=";

var clinicKeyDefault = "https://www-clinicalkey-com.ccmain.ohionet.org/#!/";

//code to run at install time
chrome.runtime.onInstalled.addListener(function(details){
  initialize(); //run at install as it bypasses the onStartup event
});

//code to run at startup
chrome.runtime.onStartup.addListener(function(details){
})

//code to run at event page load / reload
chrome.contextMenus.onClicked.addListener(contextClickHandler);

function initialize(){
  initializeContextMenus();
}

function initializeContextMenus(){
  //add main context menu
  var context = "selection";
  //add access-med
  chrome.contextMenus.create({
    "title": "Access Medicine",
    "contexts":[context],
    "id": "access-med"
  });
  //add clinical-key
  chrome.contextMenus.create({
    "title": "Clinical Key",
    "contexts":[context],
    "id": "clinical-key"
  });
  //add pubmed
  chrome.contextMenus.create({
    "title": "Pub Med",
    "contexts":[context],
    "id": "pubmed"
  });
  //add uptodate
  chrome.contextMenus.create({
    "title": "UpToDate",
    "contexts":[context],
    "id": "uptodate"
  });
  chrome.contextMenus.create({
    "title":"Wikipedia",
    "contexts":[context],
    "id":"wikipedia"
  });
}

function showUpdatePreferences(){
  return "";
}

function getPin(){
  return "";
}

function contextClickHandler(info, tab){
  console.log("context handled");
  var selectedText = encodeURI(info.selectionText);
  var linkId = info.menuItemId;
  navToPage(linkId,selectedText);
}

//handle message requests
chrome.runtime.onMessage.addListener(
  function(request,sender,sendResponse){
    //from content script
    if(request.greeting == "requestLoginInfo"){
      //call getLoginCredentials and feed callback
      //that sends message to content script
      getLoginCredentials(function(credentials){
        //construct object to send back
        sendResponse(credentials);
      });
      //keep pipe open for return call;
      return true;
    }
    if(request.greeting == "navigateToUrl-clinicalKey"){
      var newurl = request.navUrl;
      console.log("Replacing www.clinicalkey.com...");
      newurl = newurl.replace("www.clinicalkey.com", "www-clinicalkey-com.ccmain.ohionet.org");
      navToCallbackUrl(sender, newurl);
    }
    if(request.greeting == "navigateToUrl"){
      var query = request.query;
      var linkId = request.linkId;
      var linkHref = request.href;
      navToPage(linkId, query);
    }
    if(request.greeting=="validate-page"){
      //same across both requests
      var url = request.url;
      console.log(url);
      //only from library_content_validation (auto-access)
      var html = request.html;
      //from popup
      if(!html){
        //get tab info from popup.js
        var tab = request.tab;
        var tabId = tab.id;
        //get html from sendHtml.js injected into all pages
        chrome.tabs.sendMessage(tab.id, {text:"CCAccess"}, function(response){
          var dom = response;
          validateLibraryAccess(tabId, tab, url, dom);
        });
      }
      //from auto-access via library_content_validation.js
      else{
        //populated in sender dict
        var tabId = sender.tab.id;
        var tab = sender.tab;
        var url = request.url;
        var dom = html;
        validateLibraryAccess(tabId, tab, url, dom);
      }
    }
    if(request.greeting == "log"){
      console.log(request.message);
    }
    if(request.greeting == "error"){
      console.error(request.message);
    }
  });

  function getLoginCredentials(callback){
    //get login credentials from local storage, NOT ENCRYPTED
    var credentials = {
      success:true,
      lname:lastname,
      fname:firstname,
      emp:employeeID,
      pass:lib_pass
    }
    callback(credentials);
  }

  function navToCallbackUrl(sender, newurl){
    chrome.tabs.onUpdated.addListener(
      function consumableEventListener(tabId, info){
        if (info.status == "complete" && tabId == sender.tab.id){
          chrome.tabs.update(sender.tab.id, {url:newurl}, function(){
            chrome.tabs.onUpdated.removeListener(consumableEventListener);
          });
        }
      });
    }

    function navToPage(linkId, query){
      if(!(linkId in resource_links)){
        console.error("Resource link not found for : "+linkId);
        return;
      }
      var location;
      //moodle is Special
      if(linkId == 'cclcm-moodle'){
        if ($.isNumeric(query)){
          location =searchableMoodleLink+query;
        }
      }
      //do other requests if location not set above
      if(!location){
        location = resource_links[linkId];
        if(linkId in searchable_links){
          location = (query == "") ? location : searchable_links[linkId].replace(toReplace, query);
        }
      }
      chrome.tabs.create({active: true, url: location});
    }

    //run code whenever window updated
    //Auto logs in to pages that require authentication (journals, etc)
    function validateLibraryAccess(tabId, tab, url, domContent){
      //redirect url if page is served by a scienceDirect article
      url = scienceDirect(url, domContent);
      //modify url to add CCF proxy
      url = proxifyUrl(url);

      //make CORS request
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = function(){
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200){
          chrome.tabs.update(tabId, {url:url});
        }
      };
      xhr.send();
    }

    //conte
    function proxifyUrl(url){
      var parts = url.split('/');
      parts = parts.slice(2,parts.length);
      parts[0] = '0-' + parts[0] + '.library.ccf.org';
      var newUrl = 'http://' + parts.join('/');
      return newUrl;
    }


    //returns url for properly formatting scienceDirect url
    //elsevier publishing is determined from domContent
    //if not scienceDirect, return old url
    function scienceDirect(url, domContent){
      var $dom = $($.parseHTML(domContent)); // render DOM in jquery
      $children = $("#ScienceDirect", $dom); //get children of #ScienceDirect element
      if($children.length > 0){ //sciencedirect id in dom
        var scienceDirectUrl = "http://www.sciencedirect.com/science/article/pii/";
        path = $("a:contains('ScienceDirect')",$children)[0].pathname; //find child of #ScienceDirect that contains pii info
        pii = path.split("pii/")[1]; //parse pii
        pii = pii.replace(/[^A-Za-z0-9]/g, ''); //remove non-alphanumeric characters
        return scienceDirectUrl+pii;
      }
      return url;
    }
