//dict that holds engine:image mappings
var searchable_images = {
  "access-med" : "images/mhm-favicon.ico",
  "clinical-key":"images/clinickey-favicon.png",
  "pubmed":"images/ncbi-logo.png",
  "uptodate":"images/uptodate.png",
  "wikipedia":"images/wikipedia.png",
}

//execute on doc ready
$(function () {
  //send loaded message to background
  log('==> loaded popup');
  //construct access button
  //get default selected value
  chrome.storage.sync.get("ccaccess", function(e){
    var defaultVal = e['ccaccess'];
    if(!defaultVal){
      $("#ccaccess-checkbox").prop("checked", false);
    }
    else{
      $("#ccaccess-checkbox").prop("checked", defaultVal);
    }
  });

  //add listener
  $("#ccaccess-checkbox").change(
    function(){
      var checked = $("#ccaccess-checkbox").prop('checked');
      chrome.storage.sync.set({"ccaccess":checked});
    });

  //construct access button
  var ccaccess = document.getElementById("ccaccess");
  ccaccess.onclick = function(){
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      var tab = tabs[0];
      var url = tab.url;
      chrome.runtime.sendMessage({
        greeting:"validate-page",
        url:url,
        tab:tab
      });
    });
  };

  //construct preferences button
  var preferences = document.getElementById("preferences");
  preferences.onclick = function(){
    chrome.tabs.create({url:chrome.extension.getURL('background.html')});
  };

  //construct default search
  var selectSpan = document.getElementById('default-engine');
  var iconSelect = new IconSelect("default-engine",
  {'selectedIconWidth':20,
  'selectedIconHeight':20,
  'selectedBoxPadding':1,
  'iconsWidth':20,
  'iconsHeight':20,
  'boxIconSpace':1,
  'vectoralIconNumber':8,
  'horizontalIconNumber':1});
  var icons = [];
  icons.push({'iconFilePath':"images/mhm-favicon.ico",'iconValue':'access-med'});
  icons.push({'iconFilePath':"images/clinickey-favicon.png",'iconValue':"clinical-key"});
  icons.push({'iconFilePath':"images/ncbi-logo.png",'iconValue':"pubmed"});
  icons.push({'iconFilePath':"images/uptodate.png",'iconValue':"uptodate"});
  icons.push({'iconFilePath':'images/wikipedia.png','iconValue':'wikipedia'});
  iconSelect.refresh(icons);

  //get default selected icon from storage; set to pubmed if not set
  chrome.storage.sync.get("default-engine", function(e){
    var engine = e['default-engine'];
    if (!engine){
      engine="pubmed";
      chrome.storage.sync.set({'default-engine':engine});
    }
    //index
    var index = {"access-med":0,'clinical-key':1,'pubmed':2,'uptodate':3,'wikipedia':4};
    iconSelect.setSelectedIndex(index[engine]);
  });

  //add listener to save changes to chrome storage
  document.getElementById('default-engine').addEventListener('changed', function(e){
    var newValue = iconSelect.getSelectedValue();
    chrome.storage.sync.set({'default-engine':newValue});
  });

  //bind searchable-input to enter press
  $(document).keypress(function(event){
    if(event.which == 13){
      //construct query engine
      var default_query_engine = iconSelect.getSelectedValue();
      var query = $("#searchable-input").val().trim();
      if (!query){
        window.close();
        return;
      }
      link = {id:default_query_engine};
      navToPage(link, query);
    }
  });

  //get previously set moodle id from storage, if present
  chrome.storage.sync.get('moodle-course-id', function(e){
    var prevId = e['moodle-course-id'];
    if(prevId){
      $("#moodle-id").val(prevId);
    }
    //construct links only after moodle id retrieved from memory
    constructLinks();
  });
});

function constructLinks(){
  var links = document.getElementsByTagName("a");
  for (var i = 0; i < links.length; i++) {
    (function () {
      var ln = links[i];
      ln.onclick = function () {
        var query;
        //moodle is Special
        //get value from input
        if(ln.id=="cclcm-moodle"){
          var inputVal = $("#moodle-id").val().trim();
          chrome.storage.sync.set({"moodle-course-id": inputVal});
          query = inputVal;
        }
        else{
          var inputVal = $("#searchable-input").val().trim();
          query = encodeURI(inputVal);
        }
        navToPage(ln, query);
      };
    })();
  }
}

function CCAccess(ln, query){
  chrome.runtime.sendMessage(
    {
      greeting: "validate-page",
      query:query,
      linkId:ln.id
    });
  }

function navToPage(ln, query){
  chrome.runtime.sendMessage(
    {
      greeting: "navigateToUrl",
      query:query,
      linkId:ln.id
    });
  }

function log(e){
  chrome.runtime.sendMessage({
    greeting:"log",
    message:e
  });
}
