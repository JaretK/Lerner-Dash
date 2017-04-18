

/*
Loaded on all pages not including the below url componenets
See manifest.json for other pages that exlucde the below
Part of a redundancy that prevents unexpected behavior
*/
var forbiddenUrls = [
  "www.ncbi.nlm.nih.gov/pubmed",
  ".gov",
  "ccmain.ohionet.org",
  "ccf.org"
];

//attempt to redirect if indicated by user settings and is allowed by page
function attemptValidation(){
  //make sure url isn't forbidden
  var url = window.location.href;
  if(!properUrl(url)){
    return;
  }

  chrome.storage.sync.get("ccaccess", function(e){
    var checked = e['ccaccess'];
    if(checked){
      //   chrome.tabs.sendMessage(tab.id, {text:"CCAccess"}, function(e){
      //     console.log(e);
      //     var dom = null;
      //     validateLibraryAccess(tabId, tab, url);
      // });
      chrome.runtime.sendMessage(
          {
            greeting: "validate-page",
            url: url,
            html : document.all[0].outerHTML
          });
        }
      });
  }

function properUrl(url){
  //make sure url doesn't contain urls that break
  for(i=0;i<forbiddenUrls.length;i++){
    if(url.includes(forbiddenUrls[i])){
      return false;
    }
  }
  return true;
}
$(attemptValidation());
