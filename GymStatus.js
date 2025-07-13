let req = new Request("https://connect.e-app.eu:57319/easyWeb.svc/eApps/widgets");
req.method = "post";
req.headers = {
"Connection": "keep-alive",
"Accept": "application/json, text/plain, */*",
"Accept-Encoding": "gzip, deflate, br",
"Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
"Content-Type": "text/plain",
"User-Agent": "Mozilla/5.0 (iPhone; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1 Edg/95.0.4638.0",
"Origin": "https://eliveauslastung.e-app.eu",
"Sec-Fetch-Site": "same-site",
"Sec-Fetch-Mode": "cors",
"Sec-Fetch-Dest": "empty",
"Referer": "https://eliveauslastung.e-app.eu/",
"Host": "connect.e-app.eu:57319",
"Content-Length": "75"
};

var studioS = "FSF-Essen1";

req.body = JSON.stringify({ call: "GeteLiveauslastung", useWS: 0, studio: ''+ studioS +''})

let res = await req.loadJSON();
var personen = Math.ceil(250/100 * res.Wert1);

if (config.runsInWidget) {
	
   let widget = createWidget('' + studioS + ' ist zu:', `${res.Wert1}% gefüllt \n${personen}/250 Personen`)

  Script.setWidget(widget)

}
else{
  console.log('' + studioS + ' ist zu: ' + res.Wert1 +'% gefüllt' )
  console.log(`Das sind: ` + personen +' Personen' )
}


Script.complete()
function createWidget(title, subtitle) {
  
  let w = new ListWidget()
    
  let nextRefresh = Date.now() + 1000*60*15
  
  w.refreshAfterDate = new Date(nextRefresh)
 let lightColor = Color.white()
 let darkColor = Color.black()
  w.backgroundColor = Color.dynamic(lightColor,darkColor)
  
   let titleTxt = w.addText(title)
   titleTxt.textColor = Color.dynamic(darkColor,lightColor)
   titleTxt.font = Font.systemFont(18)
   w.addSpacer(5)
   let subTxt = w.addText(subtitle)
   subTxt.textColor = Color.dynamic(darkColor,lightColor)
   subTxt.textOpacity = 0.8
   subTxt.font = Font.systemFont(15)
  
   return w
}

if (config.runsWithSiri) {
    Speech.speak('' + studioS + ' ist zu: ' + res.Wert1 +'% gefüllt')
}
