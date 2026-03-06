import{useState,useEffect,useCallback}from"react";

// ═══ API CONFIG ═══
const API_BASE="https://api.technicalguider.com/api";
const DEMO=true;

// ═══ GOOGLE SHEETS DIRECT CONNECT ═══
const SHEET_ID="1SHd_kEX-Y-lFTQrUZWgOYr2dLFciiA7HYDQkJ8uOcUY";
const SHEET_GID="860191075";
const SHEET_LIVE=true; // Set TRUE to fetch from Google Sheet

async function fetchGoogleSheet(){
  try{
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;
    const res=await fetch(url);
    if(!res.ok)throw new Error("Sheet fetch failed");
    const csv=await res.text();
    // Parse CSV
    const lines=csv.split("\n").filter(l=>l.trim());
    if(lines.length<2)return[];
    // Parse header
    const parseRow=(line)=>{
      const result=[];let cur="";let inQ=false;
      for(let i=0;i<line.length;i++){
        const c=line[i];
        if(c==='"'){inQ=!inQ}
        else if(c===','&&!inQ){result.push(cur.trim().replace(/^"|"$/g,""));cur=""}
        else{cur+=c}
      }
      result.push(cur.trim().replace(/^"|"$/g,""));
      return result;
    };
    const headers=parseRow(lines[0]).map(h=>h.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,""));
    const rows=[];
    for(let i=1;i<lines.length;i++){
      const vals=parseRow(lines[i]);
      if(vals.length<3)continue;
      const row={};
      headers.forEach((h,j)=>{row[h]=vals[j]||""});
      // Map to lead format — auto-detect common column names
      const get=(...keys)=>{for(const k of keys){const v=row[k]||row[k.replace(/_/g,"")];if(v)return v}return""};
      const score=parseInt(get("overall_score","score","website_score","total_score"))||0;
      const lead={
        id:i,
        name:get("lead_name","name","business_name","business","company","company_name")||"Lead "+i,
        url:get("website","url","site","domain","website_url"),
        city:get("city","location","area","district"),
        state:get("state"),
        type:get("category","type","industry","business_type","niche"),
        score:score,
        mobile:parseInt(get("mobile_score","mobile","mobile_speed"))||0,
        seo:get("seo_grade","seo","seo_score")||"F",
        risk:get("risk_level","risk","security_level")||(score>=60?"LOW":score>=35?"MEDIUM":"HIGH"),
        loss:get("revenue_impact","loss","monthly_loss","revenue_loss")||"0",
        ls:parseInt(get("lead_score","ls","priority","priority_score"))||50,
        views:parseInt(get("views","report_views","opens"))||0,
        lv:get("last_viewed","last_view","last_opened")||null,
        stage:get("stage","status","pipeline_stage")||"audited",
        owner:get("owner","assigned_to","assignee","team_member"),
        src:get("source","lead_source")||"Maps",
        ph:get("phone","phone_number","mobile_number","contact","number"),
        email:get("email","email_address","mail"),
        cms:get("cms","cms_type","platform")||"Unknown",
        lt:(get("load_time","speed","page_speed")||"0")+"s",
        ga:get("analytics","google_analytics","ga")==="true"||get("analytics","google_analytics","ga")==="yes"||get("analytics","google_analytics","ga")==="TRUE",
        pixel:get("pixel","meta_pixel","fb_pixel")==="true"||get("pixel","meta_pixel","fb_pixel")==="yes",
        ssl:get("ssl","https","ssl_secure")==="true"||get("ssl","https","ssl_secure")==="yes"||get("ssl","https","ssl_secure")==="TRUE",
        contact_person:get("contact_person","contact_name","person","owner_name"),
      };
      rows.push(lead);
    }
    console.log("📊 Loaded "+rows.length+" leads from Google Sheet");
    return rows;
  }catch(err){
    console.error("Sheet fetch error:",err);
    return null;
  }
}

const getToken=()=>{try{return localStorage.getItem("tg_token")}catch{return null}};
const setTokenLS=(t)=>{try{localStorage.setItem("tg_token",t)}catch{}};

async function apiCall(path,opts={}){
  if(DEMO)return null;
  try{
    const r=await fetch(`${API_BASE}${path}`,{...opts,headers:{"Content-Type":"application/json",...(getToken()?{Authorization:`Bearer ${getToken()}`}:{}),...opts.headers},body:opts.body?JSON.stringify(opts.body):undefined});
    if(r.status===401){try{localStorage.removeItem("tg_token")}catch{};return null}
    return await r.json();
  }catch{return null}
}

// ═══ DATA ═══
const LD=[
{id:1,name:"Raj Enterprises",url:"rajenterprises.com",city:"Delhi",type:"Ecommerce",score:34,mobile:28,seo:"F",risk:"HIGH",loss:"2,40,000",ls:87,views:0,lv:null,stage:"audited",owner:null,src:"Maps",ph:"+91-98765XXXXX",cms:"WordPress",lt:"9.2s",ga:false,pixel:false,ssl:false},
{id:2,name:"Sharma Astrology",url:"sharmaastro.in",city:"Jaipur",type:"Astrologer",score:22,mobile:18,seo:"F",risk:"HIGH",loss:"1,80,000",ls:92,views:5,lv:"2h ago",stage:"viewed",owner:"Rahul",src:"Maps",ph:"+91-91234XXXXX",cms:"HTML",lt:"11.4s",ga:false,pixel:false,ssl:false},
{id:3,name:"Delhi Dental",url:"delhidental.co.in",city:"Delhi",type:"Clinic",score:48,mobile:38,seo:"D",risk:"MEDIUM",loss:"1,20,000",ls:74,views:8,lv:"30m",stage:"responded",owner:"Priya",src:"Maps",ph:"+91-99887XXXXX",cms:"WordPress",lt:"5.8s",ga:false,pixel:false,ssl:true},
{id:4,name:"Spice Route",url:"spiceroute.in",city:"Mumbai",type:"Restaurant",score:29,mobile:22,seo:"F",risk:"HIGH",loss:"2,10,000",ls:81,views:0,lv:null,stage:"sent",owner:"Rahul",src:"FB Ads",ph:"+91-88776XXXXX",cms:"Wix",lt:"8.6s",ga:false,pixel:false,ssl:false},
{id:5,name:"GreenLeaf",url:"greenleaf.com",city:"Bangalore",type:"Real Estate",score:56,mobile:44,seo:"C",risk:"LOW",loss:"90,000",ls:45,views:12,lv:"1d",stage:"won",owner:"Priya",src:"Manual",ph:"+91-77665XXXXX",cms:"WordPress",lt:"4.2s",ga:true,pixel:false,ssl:true},
{id:6,name:"Vedic Jyotish",url:"vedicjyotish.org",city:"Varanasi",type:"Astrologer",score:19,mobile:12,seo:"F",risk:"HIGH",loss:"1,50,000",ls:95,views:0,lv:null,stage:"audited",owner:null,src:"Maps",ph:"+91-66554XXXXX",cms:"HTML",lt:"13.1s",ga:false,pixel:false,ssl:false},
{id:7,name:"TechNova",url:"technova.co",city:"Hyderabad",type:"Agency",score:71,mobile:62,seo:"B",risk:"LOW",loss:"45,000",ls:28,views:3,lv:"3d",stage:"lost",owner:"Rahul",src:"Manual",ph:"+91-55443XXXXX",cms:"Next.js",lt:"2.1s",ga:true,pixel:true,ssl:true},
{id:8,name:"Pure Ayurveda",url:"pureayurveda.in",city:"Pune",type:"Clinic",score:31,mobile:24,seo:"F",risk:"HIGH",loss:"1,65,000",ls:83,views:2,lv:"5h",stage:"viewed",owner:"Priya",src:"FB Ads",ph:"+91-44332XXXXX",cms:"WordPress",lt:"7.9s",ga:false,pixel:false,ssl:false},
{id:9,name:"Star Coaching",url:"starcoaching.in",city:"Delhi",type:"Education",score:27,mobile:20,seo:"F",risk:"HIGH",loss:"1,90,000",ls:88,views:0,lv:null,stage:"audited",owner:null,src:"Maps",ph:"+91-33221XXXXX",cms:"WordPress",lt:"10.5s",ga:false,pixel:false,ssl:false},
{id:10,name:"Royal Interiors",url:"royalinteriors.com",city:"Mumbai",type:"Real Estate",score:35,mobile:30,seo:"D",risk:"HIGH",loss:"1,75,000",ls:79,views:1,lv:"1d",stage:"sent",owner:null,src:"FB Ads",ph:"+91-22110XXXXX",cms:"Shopify",lt:"7.2s",ga:false,pixel:false,ssl:true},
];

const STG=["audited","sent","viewed","responded","call","proposal","won","lost"];
const SL={audited:"Audited",sent:"Sent",viewed:"Viewed",responded:"Replied",call:"Call Booked",proposal:"Proposal",won:"Won",lost:"Lost"};
const SC2={audited:"#8b95a5",sent:"#818cf8",viewed:"#fbbf24",responded:"#fb923c",call:"#a78bfa",proposal:"#f472b6",won:"#34d399",lost:"#f87171"};
const TEAM=[{n:"Rahul",l:4,d:2,rv:"₹55K"},{n:"Priya",l:3,d:1,rv:"₹35K"},{n:"Sahil",l:3,d:5,rv:"₹2.1L"}];
const CATS=["All","Astrologer","Restaurant","Clinic","Ecommerce","Real Estate","Agency","Education"];
const CITIES=['Agartala','Agra','Ahmedabad','Aizawl','Ajmer','Aligarh','Allahabad','Alwar','Ambala','Amravati','Amritsar','Asansol','Aurangabad','Baddi','Baramulla','Bardhaman','Bareilly','Bathinda','Belgaum','Bengaluru','Berhampur','Bhagalpur','Bharatpur','Bhavnagar','Bhilai','Bhopal','Bhubaneswar','Bikaner','Bilaspur','Bokaro','Chandigarh','Chennai','Coimbatore','Cuttack','Darbhanga','Dehradun','Delhi','Deoghar','Dhanbad','Dharamsala','Dharwad','Dibrugarh','Durg','Durgapur','Erode','Faridabad','Gangtok','Gaya','Ghaziabad','Gulbarga','Guntur','Gurugram','Guwahati','Gwalior','Haridwar','Hazaribagh','Hisar','Howrah','Hubballi','Hubli','Hyderabad','Imphal','Indore','Itanagar','Jabalpur','Jaipur','Jaisalmer','Jalandhar','Jammu','Jamnagar','Jamshedpur','Jodhpur','Jorhat','Kanpur','Kargil','Karimnagar','Karnal','Khammam','Kochi','Kohima','Kolhapur','Kolkata','Korba','Kota','Kozhikode','Kurnool','Leh','Lucknow','Ludhiana','Madurai','Malda','Mangalore','Meerut','Mohali','Moradabad','Mumbai','Muzaffarpur','Mysuru','Nagpur','Nashik','Nellore','New Delhi','Nizamabad','Noida','Panaji','Panipat','Pathankot','Patiala','Patna','Pune','Purnia','Raipur','Rajahmundry','Rajkot','Rajnandgaon','Ramagundam','Ranchi','Rewa','Rishikesh','Rohtak','Roorkee','Rourkela','Rudrapur','Sagar','Salem','Sambalpur','Shimla','Silchar','Siliguri','Solan','Solapur','Sonipat','Srinagar','Surat','Thiruvananthapuram','Thrissur','Tirunelveli','Tirupati','Trichy','Udaipur','Ujjain','Vadodara','Varanasi','Vellore','Vijayawada','Visakhapatnam','Warangal'];
const STATES=['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const TMPLS=[
  {id:"premium-v1",name:"Premium Audit",ver:8,pages:8,active:true,used:47,desc:"8-page dark hero with AI analysis",
   html:`<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:40px"><div style="background:#0f172a;color:#fff;padding:40px;border-radius:16px;margin-bottom:24px"><h1 style="margin:0 0 8px;font-size:28px">Website Audit Report</h1><p style="opacity:.6;margin:0">{{lead_name}} · {{website}}</p><div style="margin-top:24px;display:flex;gap:24px"><div><div style="font-size:52px;font-weight:800;color:#f97316">{{overall_score}}</div><div style="font-size:12px;opacity:.5">SCORE</div></div><div><div style="font-size:52px;font-weight:800;color:#fbbf24">{{mobile_score}}</div><div style="font-size:12px;opacity:.5">MOBILE</div></div></div></div><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;margin-bottom:16px"><h2 style="color:#f97316;margin:0 0 12px;font-size:18px">Executive Summary</h2><p style="color:#475569;line-height:1.8">{{ai_summary}}</p></div><div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px"><h2 style="color:#f97316;margin:0 0 16px;font-size:18px">Key Metrics</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:12px;border-bottom:1px solid #f1f5f9;font-weight:600">SEO Grade</td><td style="padding:12px;border-bottom:1px solid #f1f5f9">{{seo_grade}}</td></tr><tr><td style="padding:12px;border-bottom:1px solid #f1f5f9;font-weight:600">Security</td><td style="padding:12px;border-bottom:1px solid #f1f5f9">{{security_level}}</td></tr><tr><td style="padding:12px;font-weight:600">Monthly Loss</td><td style="padding:12px;color:#f97316;font-weight:700">₹{{revenue_impact}}</td></tr></table></div></div>`,
   prompt:`You are a website audit analyst for an Indian digital marketing agency.\nUse ONLY the data provided. NEVER invent metrics.\nIf any data is missing, say "Not detected".\nOutput ONLY valid JSON.\n\nBusiness: {{lead_name}}\nWebsite: {{website}}\nScore: {{overall_score}}/100\nMobile: {{mobile_score}}/100\nSEO: {{seo_grade}}\nSSL: {{https_secure}}\nLoad: {{load_time}}s\n\nGenerate:\n{\n  "executive_summary": "3-4 hard-hitting sentences",\n  "top_issues": ["issue1","issue2","issue3"],\n  "quick_wins": ["fix1","fix2","fix3"]\n}`},
  {id:"minimal-v1",name:"Minimal Clean",ver:1,pages:5,active:false,used:0,desc:"5-page light overview",html:"<div style='padding:40px;font-family:sans-serif'><h1>{{lead_name}} Audit</h1><p>Score: {{overall_score}}/100</p><p>{{ai_summary}}</p></div>",prompt:"Summarize audit for {{lead_name}}: Score {{overall_score}}/100"},
];

// Bookmark preset icons (Apple-style emoji)
const BM_ICONS=["📊","📋","🔗","⚡","🔧","📁","📌","🎯","💡","📝","🔄","📤","📥","🌐","💬","📞","🗂","📈","🛠","⭐","🔒","📎","🏠","💻","📱","🎨","🔑","📦","🧩","⏰","🚀","💰","🔍","📡","🤖","📣"];

const scC=s=>s>=70?"#34d399":s>=50?"#fbbf24":s>=30?"#fb923c":"#f87171";
const scL=s=>s>=70?"Good":s>=50?"Avg":s>=30?"Poor":"Critical";
const seC=g=>g==="F"?"#f87171":g==="D"?"#fb923c":g==="C"?"#fbbf24":"#34d399";

export default function App(){
const[dk,setDk]=useState(false);
const[pg,setPg]=useState("home");
// Auth
const[loggedIn,setLoggedIn]=useState(DEMO||!!getToken());
const[loginEmail,setLoginEmail]=useState("");
const[loginPass,setLoginPass]=useState("");
// Mobile responsive
const[mob,setMob]=useState(typeof window!=="undefined"&&window.innerWidth<768);
useState(()=>{const h=()=>setMob(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)});
// Dynamic data
const[allLeads,setAllLeads]=useState(LD);
const[det,setDet]=useState(null);
const[loading,setLoading]=useState(false);
// n8n Webhook URLs
const[n8nMaps,setN8nMaps]=useState("");
const[n8nAds,setN8nAds]=useState("");
const[engineKw,setEngineKw]=useState("");
const[engineLoc,setEngineLoc]=useState("Delhi");
const[engineType,setEngineType]=useState("city");
const[engineQty,setEngineQty]=useState(60);
const[engineSending,setEngineSending]=useState(false);
const[adKw,setAdKw]=useState("");
const[adLoc,setAdLoc]=useState("Delhi");
const[adSending,setAdSending]=useState(false);
// Live request data from sheets
const[formRequests,setFormRequests]=useState(null);
const[adsRequests,setAdsRequests]=useState(null);

// API data loader
const reloadLeads=useCallback(async()=>{
  if(DEMO)return;setLoading(true);
  const data=await apiCall("/leads");
  if(data?.leads)setAllLeads(data.leads.map(l=>({id:l.id,name:l.name,url:l.website,city:l.city,type:l.category,score:l.overall_score||0,mobile:l.mobile_score||0,seo:l.seo_grade||"F",risk:l.risk_level||"HIGH",loss:l.revenue_impact||"0",ls:l.lead_score||50,views:l.report_views||0,lv:l.last_viewed_at,stage:l.stage,owner:l.owner_name,src:l.source==="meta_ads"?"FB Ads":l.source==="maps"?"Maps":"Manual",ph:l.phone||"",cms:l.cms_type||"Unknown",lt:String(l.load_time||0)+"s",ga:l.has_analytics,pixel:l.has_pixel,ssl:l.has_ssl})));
  setLoading(false);
},[]);
useEffect(()=>{if(loggedIn&&!DEMO)reloadLeads()},[loggedIn]);

// Google Sheet direct fetch
useEffect(()=>{
  if(!SHEET_LIVE||!loggedIn)return;
  (async()=>{
    setLoading(true);
    const sheetData=await fetchGoogleSheet();
    if(sheetData&&sheetData.length>0){
      setAllLeads(sheetData);
      showT("📊 "+sheetData.length+" leads loaded from Google Sheet!");
    }
    setLoading(false);
  })();
},[loggedIn]);
const[sr,setSr]=useState("");
const[fC,setFC]=useState("All");
const[cmdCat,setCmdCat]=useState("All");
const[batch,setBatch]=useState(5);
const[isGen,setIsGen]=useState(false);
const[genP,setGenP]=useState(0);
const[hov,setHov]=useState(null);
const[lt,setLt]=useState("city");
const[adI,setAdI]=useState("All");
const[toast,setToast]=useState(null);
// Notifications
const[notifOpen,setNotifOpen]=useState(false);
const[notifs,setNotifs]=useState([
  {id:1,type:"hot",msg:"🔥 Sharma Astrology viewed report 5× in last hour",time:"2m ago",read:false},
  {id:2,type:"reply",msg:"💬 Delhi Dental replied on WhatsApp",time:"8m ago",read:false},
  {id:3,type:"payment",msg:"💰 ₹35,000 payment received — GreenLeaf",time:"1h ago",read:false},
  {id:4,type:"system",msg:"✅ Batch #47 completed: 5/5 reports generated",time:"2h ago",read:true},
  {id:5,type:"alert",msg:"⚠️ WhatsApp rate limit 80% reached",time:"3h ago",read:true},
  {id:6,type:"lead",msg:"📱 New lead from Meta Ads: Ravi Mehta, Delhi",time:"3h ago",read:true},
  {id:7,type:"drip",msg:"↻ Drip stopped: Karan Singh replied",time:"4h ago",read:true},
]);
// CSV Import
const[csvModal,setCsvModal]=useState(false);
const[csvData,setCsvData]=useState(null);
const[csvStep,setCsvStep]=useState(1);
// Expenses
const[expenses,setExpenses]=useState([
  {id:1,source:"Meta Ads",spent:"₹12,000",leads:23,cost:"₹522/lead",revenue:"₹80,000",roi:"567%",month:"Mar"},
  {id:2,source:"Google Ads",spent:"₹8,500",leads:14,cost:"₹607/lead",revenue:"₹55,000",roi:"547%",month:"Mar"},
  {id:3,source:"Google Maps",spent:"₹0",leads:89,cost:"₹0/lead",revenue:"₹1,60,000",roi:"∞",month:"Mar"},
  {id:4,source:"Manual Lists",spent:"₹2,000",leads:12,cost:"₹167/lead",revenue:"₹25,000",roi:"1150%",month:"Mar"},
]);
const[autoWA,setAutoWA]=useState(true);
const[autoEmail,setAutoEmail]=useState(false);
const[autoSeq,setAutoSeq]=useState(true);
// Template editor
const[tmpls,setTmpls]=useState(TMPLS);
const[editTmpl,setEditTmpl]=useState(null);
const[previewTmpl,setPreviewTmpl]=useState(null);
const[editTab,setEditTab]=useState("html");
// Pipeline view
const[pipeView,setPipeView]=useState("summary");
const[pipeFilter,setPipeFilter]=useState("all");
// Bookmarks
const[bookmarks,setBookmarks]=useState([
  {id:1,icon:"📊",name:"Main Google Sheet",url:"https://docs.google.com/spreadsheets/d/xxx",cat:"Sheets"},
  {id:2,icon:"🔄",name:"n8n — Report Generator",url:"https://n8n.example.com/workflow/1",cat:"Workflows"},
  {id:3,icon:"📤",name:"n8n — WhatsApp Sender",url:"https://n8n.example.com/workflow/2",cat:"Workflows"},
  {id:4,icon:"📁",name:"Google Drive — Reports",url:"https://drive.google.com/drive/folders/xxx",cat:"Storage"},
  {id:5,icon:"🤖",name:"Claude AI Console",url:"https://console.anthropic.com",cat:"Tools"},
  {id:6,icon:"📡",name:"Browserless Dashboard",url:"https://cloud.browserless.io",cat:"Tools"},
]);
const[addingBM,setAddingBM]=useState(false);
const[newBM,setNewBM]=useState({icon:"📌",name:"",url:"",cat:"General"});
const[sheetTab,setSheetTab]=useState("leads");
// Dynamic sheet tabs
const SHEET_TABS=["Form Request","Google Ads Form Request","Ads Data","No Website","Website No Phone","Leads Website","Website Not Working","Audit Website","Credentials","Personal"];
const[sheetTabData,setSheetTabData]=useState({});
const[sheetTabLoading,setSheetTabLoading]=useState(false);
const[syncInterval,setSyncInterval]=useState("manual");
const[syncTimer,setSyncTimer]=useState(null);
const[lastSynced,setLastSynced]=useState(null);

// Auto-sync timer
useEffect(()=>{
  if(syncTimer)clearInterval(syncTimer);
  if(syncInterval==="manual"||!SHEET_LIVE)return;
  const ms=parseInt(syncInterval)*60*1000;
  const id=setInterval(async()=>{
    const d=await fetchGoogleSheet();
    if(d&&d.length>0){setAllLeads(d);setLastSynced(new Date())}
  },ms);
  setSyncTimer(id);
  return()=>clearInterval(id);
},[syncInterval]);

async function fetchSheetTab(tabName){
  try{
    setSheetTabLoading(true);
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
    const res=await fetch(url);
    if(!res.ok)throw new Error("Failed");
    const csv=await res.text();
    const lines=csv.split("\n").filter(l=>l.trim());
    if(lines.length<1){setSheetTabLoading(false);return}
    const parseRow=(line)=>{
      const result=[];let cur="";let inQ=false;
      for(let i=0;i<line.length;i++){const c=line[i];if(c==='"')inQ=!inQ;else if(c===','&&!inQ){result.push(cur.trim().replace(/^"|"$/g,""));cur=""}else cur+=c}
      result.push(cur.trim().replace(/^"|"$/g,""));return result;
    };
    const headers=parseRow(lines[0]);
    const rows=[];
    for(let i=1;i<lines.length;i++){const vals=parseRow(lines[i]);if(vals.length>1)rows.push(vals)}
    setSheetTabData(p=>({...p,[tabName]:{headers,rows}}));
    showT("📊 "+rows.length+" rows loaded from "+tabName);
    setSheetTabLoading(false);
  }catch(e){console.error(e);showT("❌ Failed to load "+tabName);setSheetTabLoading(false)}
}
const[notes,setNotes]=useState({2:"Hot lead — called twice, interested in redesign",3:"Meeting scheduled 10 Mar",5:"Won! Payment received ₹35K"});
const[newNote,setNewNote]=useState("");
const[tagFilter,setTagFilter]=useState("all");
const[stageFilter,setStageFilter]=useState("all");
const[srcFilter,setSrcFilter]=useState("all");
const[sheetUrl,setSheetUrl]=useState("https://docs.google.com/spreadsheets/d/1SHd_kEX-Y-lFTQrUZWgOYr2dLFciiA7HYDQkJ8uOcUY/edit");
// Notepad
const[npNotes,setNpNotes]=useState([
  {id:1,title:"Project Plan — March",body:"• Launch 200 reports/day pipeline\n• Fix WhatsApp rate limiting\n• Hire 1 more sales exec\n• Target: ₹5L revenue this month",pinned:true,updated:"5 Mar 2:30 PM"},
  {id:2,title:"Client Follow-up Template",body:"Hi {{name}} ji,\nMaine aapki website audit ki hai. {{score}}/100 score aaya hai.\nKya hum 10 min ki call schedule kar sakte hain?",pinned:false,updated:"4 Mar 11 AM"},
  {id:3,title:"Pricing Sheet",body:"Website Redesign: ₹15K-50K\nSEO Monthly: ₹10K-25K\nGoogle Ads Setup: ₹8K\nSocial Media: ₹12K/mo\nFull Package: ₹35K-80K",pinned:true,updated:"3 Mar 9 AM"},
]);
const[npTodos,setNpTodos]=useState([
  {id:1,text:"Send 200 reports for Astrologers in Delhi",done:false,due:"Today"},
  {id:2,text:"Review campaign metrics — pause low performers",done:false,due:"Today"},
  {id:3,text:"Call Delhi Dental — high value lead",done:true,due:"Done"},
  {id:4,text:"Setup Gotenberg PDF service on VPS",done:false,due:"Tomorrow"},
  {id:5,text:"Create new template for Restaurants",done:false,due:"This week"},
]);
const[npActive,setNpActive]=useState(null);
const[npNewTitle,setNpNewTitle]=useState("");
const[npNewTodo,setNpNewTodo]=useState("");
const[noteFullView,setNoteFullView]=useState(null);
const[dateFilter,setDateFilter]=useState("all");
const[revenueFilter,setRevenueFilter]=useState("all");
const[revDateFilter,setRevDateFilter]=useState("all");
const[leadAction,setLeadAction]=useState(null);
const[waTab,setWaTab]=useState("templates");
const[waTmplCat,setWaTmplCat]=useState("All");
// Automation Rules
const[autoRules,setAutoRules]=useState([
  {id:1,source:"Meta Ads",enabled:true,firstAction:"whatsapp",firstTemplate:"Initial Outreach — Hindi",alsoEmail:true,emailTemplate:"Report Link Email",drip:"Standard 5-Day",delay:"instant",assignTo:"auto",category:"All",webhook:"https://n8n.example.com/webhook/meta-leads",notes:"Facebook lead form → instant WhatsApp + email"},
  {id:2,source:"Google Ads",enabled:true,firstAction:"email",firstTemplate:"Report Link Email",alsoEmail:false,emailTemplate:"",drip:"Aggressive 3-Day",delay:"5min",assignTo:"Rahul",category:"All",webhook:"https://n8n.example.com/webhook/gads-leads",notes:"Google Ads landing page form submissions"},
  {id:3,source:"Website Form",enabled:true,firstAction:"both",firstTemplate:"Initial Outreach — Hindi",alsoEmail:true,emailTemplate:"Welcome + Report",drip:"Standard 5-Day",delay:"instant",assignTo:"auto",category:"All",webhook:"https://n8n.example.com/webhook/website-form",notes:"Main website contact form"},
  {id:4,source:"Landing Page",enabled:false,firstAction:"whatsapp",firstTemplate:"Urgency Push",alsoEmail:false,emailTemplate:"",drip:"Aggressive 3-Day",delay:"instant",assignTo:"Priya",category:"Clinic",webhook:"",notes:"Campaign-specific landing pages"},
  {id:5,source:"Manual Entry",enabled:true,firstAction:"none",firstTemplate:"",alsoEmail:false,emailTemplate:"",drip:"none",delay:"",assignTo:"auto",category:"All",webhook:"",notes:"Manually added leads — no auto-action"},
]);
const[editRule,setEditRule]=useState(null);
const[autoLive,setAutoLive]=useState([
  {id:1,name:"Ravi Mehta",phone:"+91-98123XXXXX",source:"Meta Ads",time:"2 min ago",status:"wa_sent",drip:"Standard 5-Day",city:"Delhi"},
  {id:2,name:"Pooja Sharma",phone:"+91-87654XXXXX",source:"Google Ads",time:"8 min ago",status:"email_sent",drip:"Aggressive 3-Day",city:"Mumbai"},
  {id:3,name:"Amit Verma",phone:"+91-76543XXXXX",source:"Website Form",time:"25 min ago",status:"both_sent",drip:"Standard 5-Day",city:"Pune"},
  {id:4,name:"Neha Gupta",phone:"+91-65432XXXXX",source:"Meta Ads",time:"1h ago",status:"wa_sent",drip:"Standard 5-Day",city:"Jaipur"},
  {id:5,name:"Karan Singh",phone:"+91-54321XXXXX",source:"Meta Ads",time:"2h ago",status:"replied",drip:"Stopped",city:"Delhi"},
]);

const showT=m=>{setToast(m);setTimeout(()=>setToast(null),3000)};
const pc=STG.reduce((a,s)=>{a[s]=allLeads.filter(l=>l.stage===s).length;return a},{});
const queue=allLeads.filter(x=>x.stage!=="won"&&x.stage!=="lost"&&(cmdCat==="All"||x.type===cmdCat)).sort((a,b)=>b.ls-a.ls).slice(0,batch);
const filtered=allLeads.filter(x=>{
  if(fC!=="All"&&x.type!==fC)return false;
  if(stageFilter!=="all"&&x.stage!==stageFilter)return false;
  if(srcFilter!=="all"&&x.src!==srcFilter)return false;
  if(!sr)return true;
  const q=sr.toLowerCase();
  return x.name.toLowerCase().includes(q)||x.url.toLowerCase().includes(q)||x.city.toLowerCase().includes(q)||(x.ph||"").includes(q)||(x.owner||"").toLowerCase().includes(q)||x.type.toLowerCase().includes(q)||x.src.toLowerCase().includes(q);
});

const runGen=async()=>{
  setIsGen(true);setGenP(0);
  if(!DEMO){
    const result=await apiCall("/reports/generate/batch",{method:"POST",body:{leadIds:queue.map(q=>q.id),autoSend:autoWA,autoEmail,autoDrip:autoSeq}});
    if(result?.queued){
      for(let i=0;i<queue.length;i++){await new Promise(r=>setTimeout(r,1200));setGenP(((i+1)/queue.length)*100)}
      showT("✅ "+result.queued+" reports queued for generation"+(autoWA?" + WhatsApp":"")+(autoEmail?" + Email":""));
      await reloadLeads();
    }else showT("❌ Generation failed — check settings");
  }else{
    for(let i=0;i<queue.length;i++){await new Promise(r=>setTimeout(r,600));setGenP(((i+1)/queue.length)*100)}
    showT("✅ "+queue.length+" reports generated"+(autoWA?" + WhatsApp sent":"")+(autoEmail?" + Email sent":""));
  }
  setIsGen(false);
};

// Template preview render
const renderTmpl=(html)=>{
  const d={lead_name:"Sharma Astrology",website:"sharmaastro.in",overall_score:"22",mobile_score:"18",seo_grade:"F",security_level:"HIGH RISK",revenue_impact:"1,80,000",ai_summary:"Sharma Astrology scores 22/100 — critically low. Mobile score 18 means 78% of Jaipur visitors leave before seeing services. No SSL, no analytics, no SEO. Competitors are capturing all organic traffic.",load_time:"11.4",https_secure:"No"};
  let r=html;Object.entries(d).forEach(([k,v])=>{r=r.replace(new RegExp("\\{\\{"+k+"\\}\\}","g"),v)});return r;
};

// THEME
const T=dk?{
  bg:"#060810",sf:"#0c0f18",el:"#12161f",ra:"#191d28",bd:"rgba(255,255,255,.06)",tx:"#eef0f6",txS:"#8891a5",txM:"#4d5470",txF:"#2b3045",
  acc:"#f59e0b",acc2:"#f97316",gn:"#34d399",rd:"#f87171",yw:"#fbbf24",bl:"#818cf8",pk:"#f472b6",pr:"#a78bfa",
  sh:"0 0 0 1px rgba(255,255,255,.04),0 2px 8px rgba(0,0,0,.5)",shH:"0 0 0 1px rgba(255,255,255,.08),0 12px 40px rgba(0,0,0,.5)",gl:"rgba(12,15,24,.8)",
}:{
  bg:"#f4f1ec",sf:"#ffffff",el:"#ffffff",ra:"#f7f5f0",bd:"rgba(0,0,0,.07)",tx:"#1a1814",txS:"#6b6560",txM:"#a09a93",txF:"#d4d0ca",
  acc:"#e37008",acc2:"#f59e0b",gn:"#16a34a",rd:"#dc2626",yw:"#ca8a04",bl:"#4f46e5",pk:"#db2777",pr:"#7c3aed",
  sh:"0 0 0 1px rgba(0,0,0,.04),0 2px 12px rgba(0,0,0,.04)",shH:"0 0 0 1px rgba(0,0,0,.08),0 12px 40px rgba(0,0,0,.07)",gl:"rgba(255,255,255,.85)",
};
const ff="'Plus Jakarta Sans',-apple-system,sans-serif";
const accG=`linear-gradient(135deg,${T.acc},${T.acc2})`;
const B=(text,c)=><span style={{fontSize:11,fontWeight:600,padding:"4px 11px",borderRadius:6,background:(c||T.acc)+"14",color:c||T.acc}}>{text}</span>;
const IS={width:"100%",padding:"12px 16px",fontSize:14,fontFamily:ff,color:T.tx,background:T.el,border:"1.5px solid "+T.bd,borderRadius:12,outline:"none"};
const Check=({label,checked,onChange})=><div onClick={onChange} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderRadius:14,background:checked?T.acc+"10":T.el,border:"1.5px solid "+(checked?T.acc+"33":T.bd),cursor:"pointer",transition:"all .25s"}}><div style={{width:22,height:22,borderRadius:7,border:"2px solid "+(checked?T.acc:T.txF),background:checked?T.acc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>{checked&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</div><span style={{fontSize:13,fontWeight:500,color:checked?T.tx:T.txM}}>{label}</span></div>;

const NAV=[
  {id:"home",l:"Home",i:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
  {id:"pipeline",l:"Pipeline",i:"M22 12h-4l-3 9L9 3l-3 9H2"},
  {id:"generate",l:"Generate",i:"M5 3l14 9-14 9V3z"},
  {id:"leads",l:"Leads",i:"M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M14 3.5a4 4 0 110 7"},
  {id:"campaigns",l:"Campaigns",i:"M22 2L11 13M22 2l-7 20-4-9-9-4z"},
  {id:"tracking",l:"Tracking",i:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6"},
  {id:"revenue",l:"Revenue",i:"M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"},
  {id:"team",l:"Team",i:"M9 3a4 4 0 100 8 4 4 0 000-8zM16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"},
  {id:"templates",l:"Templates",i:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"},
  {id:"engine",l:"Engine",i:"M13 2L3 14h9l-1 10 10-12h-9l1-10z"},
  {id:"automations",l:"Automations",i:"M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 6v6l4 2"},
  {id:"adintel",l:"Ad Intel",i:"M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"},
  {id:"bookmarks",l:"Bookmarks",i:"M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"},
  {id:"notepad",l:"Notepad",i:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"},
  {id:"sheets",l:"Sheet Data",i:"M3 3h18v18H3zM3 9h18M3 15h18M9 3v18"},
  {id:"settings",l:"Settings",i:"M12 15a3 3 0 100-6 3 3 0 000 6z"},
];

// ═══ TEMPLATE MODALS ═══
const PreviewM=()=>{if(!previewTmpl)return null;return(
  <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div onClick={()=>setPreviewTmpl(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)"}}/>
    <div style={{position:"relative",width:mob?"100%":"90%",maxWidth:mob?"100%":820,maxHeight:mob?"100vh":"85vh",borderRadius:mob?0:24,background:T.sf,borderRadius:24,boxShadow:T.shH,overflow:"hidden",display:"flex",flexDirection:"column",animation:"rise .3s ease"}}>
      <div style={{padding:"18px 24px",borderBottom:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:700}}>{previewTmpl.name} — Preview</div>
        <button onClick={()=>setPreviewTmpl(null)} style={{width:32,height:32,borderRadius:8,border:"1px solid "+T.bd,background:T.el,cursor:"pointer",fontSize:14,color:T.txS,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{flex:1,overflow:"auto"}}><div style={{background:"#fff",minHeight:400}} dangerouslySetInnerHTML={{__html:renderTmpl(previewTmpl.html)}}/></div>
    </div>
  </div>
)};

const EditorM=()=>{if(!editTmpl)return null;
  const upd=(f,v)=>setEditTmpl({...editTmpl,[f]:v});
  const save=()=>{setTmpls(p=>p.map(t=>t.id===editTmpl.id?{...editTmpl,ver:editTmpl.ver+1}:t));setEditTmpl(null);showT("✅ Template saved v"+(editTmpl.ver+1))};
  return(
  <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div onClick={()=>setEditTmpl(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)"}}/>
    <div style={{position:"relative",width:mob?"100%":"95%",maxWidth:mob?"100%":1100,height:mob?"100vh":"90vh",borderRadius:mob?0:24,background:T.sf,borderRadius:24,boxShadow:T.shH,overflow:"hidden",display:"flex",flexDirection:"column",animation:"rise .3s ease"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontWeight:700}}>Edit: {editTmpl.name}</span>{B("v"+editTmpl.ver,T.bl)}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setPreviewTmpl(editTmpl)} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+T.bd,background:T.el,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>👁 Preview</button>
          <button onClick={save} style={{padding:"8px 16px",borderRadius:10,border:"none",background:accG,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>💾 Save</button>
          <button onClick={()=>setEditTmpl(null)} style={{width:32,height:32,borderRadius:8,border:"1px solid "+T.bd,background:T.el,cursor:"pointer",fontSize:14,color:T.txS,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid "+T.bd}}>
        {[["html","HTML Template"],["prompt","AI Prompt"],["info","Settings"]].map(([id,lb])=>(
          <button key={id} onClick={()=>setEditTab(id)} style={{padding:"12px 24px",border:"none",borderBottom:editTab===id?"2px solid "+T.acc:"2px solid transparent",background:"transparent",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,color:editTab===id?T.acc:T.txM}}>{lb}</button>
        ))}
      </div>
      <div style={{flex:1,overflow:"auto",padding:24}}>
        {editTab==="html"&&<div>
          <div style={{fontSize:12,color:T.txM,marginBottom:12}}>Use {"{{placeholders}}"} — they auto-fill with lead data.</div>
          <textarea value={editTmpl.html} onChange={e=>upd("html",e.target.value)} style={{...IS,height:380,fontFamily:"monospace",fontSize:12,lineHeight:1.6,resize:"vertical"}}/>
          <div style={{marginTop:14,display:"flex",gap:6,flexWrap:"wrap"}}>
            {["lead_name","website","overall_score","mobile_score","seo_grade","security_level","revenue_impact","ai_summary","load_time","https_secure"].map(p=>(
              <span key={p} onClick={()=>upd("html",editTmpl.html+"\n{{"+p+"}}")} style={{padding:"4px 10px",borderRadius:6,background:T.acc+"14",color:T.acc,fontSize:10.5,fontWeight:600,cursor:"pointer"}}>{"{{"+p+"}}"}</span>
            ))}
          </div>
        </div>}
        {editTab==="prompt"&&<div>
          <div style={{fontSize:12,color:T.txM,marginBottom:12}}>This prompt goes to Claude AI. Use {"{{vars}}"} for dynamic data.</div>
          <textarea value={editTmpl.prompt} onChange={e=>upd("prompt",e.target.value)} style={{...IS,height:320,fontFamily:"monospace",fontSize:12,lineHeight:1.6,resize:"vertical"}}/>
          <div style={{marginTop:14,padding:16,borderRadius:14,background:T.acc+"08",border:"1px solid "+T.acc+"22"}}>
            <div style={{fontSize:12,fontWeight:600,color:T.acc,marginBottom:6}}>💡 Tips</div>
            <div style={{fontSize:12,color:T.txS,lineHeight:1.7}}>• Always say "Use ONLY provided data"<br/>• End with "Output JSON only"<br/>• Specify fields: executive_summary, top_issues, quick_wins</div>
          </div>
        </div>}
        {editTab==="info"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:6}}>Name</div><input value={editTmpl.name} onChange={e=>upd("name",e.target.value)} style={IS}/></div>
          <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:6}}>Description</div><textarea value={editTmpl.desc} onChange={e=>upd("desc",e.target.value)} style={{...IS,height:80}}/></div>
          <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:6}}>Pages</div><input type="number" value={editTmpl.pages} onChange={e=>upd("pages",+e.target.value)} style={{...IS,width:100}}/></div>
        </div>}
      </div>
    </div>
  </div>
)};

// ═══ LOGIN SCREEN ═══
if(!loggedIn){
  return(
  <div style={{minHeight:"100vh",background:"#f4f1ec",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:ff}}>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>{`*{margin:0;padding:0;box-sizing:border-box}@keyframes rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}body{background:#f4f1ec}`}</style>
  <div style={{width:"100%",maxWidth:420,padding:40,animation:"rise .6s cubic-bezier(.16,1,.3,1)"}}>
    <div style={{textAlign:"center",marginBottom:40}}>
      <div style={{width:64,height:64,background:"linear-gradient(135deg,#f59e0b,#f97316)",borderRadius:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",marginBottom:20,boxShadow:"0 8px 40px rgba(245,158,11,.15)"}}>TG</div>
      <h1 style={{fontSize:28,fontWeight:800,color:"#0f172a",letterSpacing:-.5}}>Revenue Engine</h1>
      <p style={{fontSize:14,color:"#64748b",marginTop:8}}>Sign in to your dashboard</p>
    </div>
    <div style={{background:"#ffffff",border:"1px solid rgba(0,0,0,.06)",borderRadius:24,padding:32,boxShadow:"0 4px 32px rgba(0,0,0,.04)"}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13,fontWeight:600,color:"#64748b",marginBottom:8}}>Email</div>
        <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="sahil@technicalguider.com" style={{width:"100%",padding:"14px 18px",fontSize:14,background:"#f8fafc",border:"1.5px solid rgba(0,0,0,.08)",borderRadius:14,color:"#0f172a",outline:"none",fontFamily:ff}}/>
      </div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:13,fontWeight:600,color:"#64748b",marginBottom:8}}>Password</div>
        <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" style={{width:"100%",padding:"14px 18px",fontSize:14,background:"#f8fafc",border:"1.5px solid rgba(0,0,0,.08)",borderRadius:14,color:"#0f172a",outline:"none",fontFamily:ff}} onKeyDown={e=>{if(e.key==="Enter"){if(DEMO){setLoggedIn(true)}else{apiCall("/auth/login",{method:"POST",body:{email:loginEmail,password:loginPass}}).then(r=>{if(r?.token){setTokenLS(r.token);setLoggedIn(true)}else setLoginPass("")})}}}}/>
      </div>
      <button onClick={async()=>{if(DEMO){setLoggedIn(true);return}const r=await apiCall("/auth/login",{method:"POST",body:{email:loginEmail,password:loginPass}});if(r?.token){setTokenLS(r.token);setLoggedIn(true)}else setLoginPass("")}} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:ff,boxShadow:"0 6px 28px rgba(245,158,11,.2)"}}>
        {DEMO?"Enter Demo Mode":"Sign In"}
      </button>
      {DEMO&&<p style={{textAlign:"center",fontSize:12,color:"#94a3b8",marginTop:16}}>Demo mode — no backend required</p>}
    </div>
  </div></div>);
}

// ═══ LEAD DETAIL (Advanced) ═══
if(det){const d=det;const tools=[["Analytics",d.ga],["Pixel",d.pixel],["SSL",d.ssl],["CMS",d.cms!=="HTML"]];
return(
<div style={{minHeight:"100vh",width:"100%",background:T.bg,fontFamily:ff,color:T.tx,transition:"all .4s"}}>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>{`*{margin:0;padding:0;box-sizing:border-box}html,body,#root{width:100%}@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}body{background:${T.bg}}`}</style>
<div style={{padding:mob?"20px 16px":"36px 40px",animation:"rise .5s cubic-bezier(.16,1,.3,1) both"}}>
  {/* Header */}
  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:36}}>
    <button onClick={()=>setDet(null)} style={{padding:"10px 18px",borderRadius:12,border:"1.5px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:ff,color:T.txS}}>← Back</button>
    <div style={{flex:1}}><h1 style={{fontSize:26,fontWeight:800,letterSpacing:-.6}}>{d.name}</h1><p style={{fontSize:13,color:T.txM,marginTop:4}}>{d.url} · {d.city} · {d.type}</p></div>
    <span onClick={()=>{setDet(null);setFC(d.type);setPg("leads")}} style={{fontSize:11,fontWeight:600,padding:"4px 11px",borderRadius:6,background:T.bl+"14",color:T.bl,cursor:"pointer"}}>{d.type}</span>
    <span onClick={()=>{setDet(null);setPg("pipeline")}} style={{fontSize:11,fontWeight:600,padding:"4px 11px",borderRadius:6,background:(SC2[d.stage]||T.acc)+"14",color:SC2[d.stage]||T.acc,cursor:"pointer"}}>{SL[d.stage]}</span>
    {B("Score: "+d.score,scC(d.score))}{B("LS:"+d.ls,d.ls>80?T.acc:T.yw)}
  </div>
  {/* Score + Metrics */}
  <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"180px 1fr",gap:16,marginBottom:20}}>
    <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:24,boxShadow:T.sh,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:36}}>
      <div style={{fontSize:68,fontWeight:800,color:scC(d.score),lineHeight:1,letterSpacing:-3}}>{d.score}</div>
      <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:2,marginTop:12}}>Web Score</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10}}>
      {[["Mobile",d.mobile,scC(d.mobile)],["SEO",d.seo,seC(d.seo)],["Risk",d.risk,d.risk==="HIGH"?T.rd:d.risk==="MEDIUM"?T.yw:T.gn],["Revenue","₹"+d.loss,T.acc],["Views",d.views||"0",d.views>3?T.gn:T.txM],["Last View",d.lv||"Never",d.lv?T.yw:T.rd],["Source",d.src,T.bl],["Owner",d.owner||"Unassigned",T.pr]].map(([l,v,c],i)=>(
        <div key={i} onClick={()=>{if(l==="Source"){setDet(null);setPg("leads");showT("Filtered by "+d.src)}if(l==="Views"&&d.views>0){setDet(null);setPg("tracking")}}} style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:16,boxShadow:T.sh,padding:"14px 16px",cursor:(l==="Source"||l==="Views")?"pointer":"default",transition:"all .2s"}}>
          <div style={{fontSize:9.5,fontWeight:600,color:T.txF,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7}}>{l}</div>
          <div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div>
        </div>
      ))}
    </div>
  </div>
  {/* Actions + Quick Actions Dropdown */}
  <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
    {["📤 Send Report","💬 WhatsApp","📧 Email","📞 Book Call","📝 Proposal","✅ Won","❌ Lost","🔄 Regen"].map((a,i)=>(
      <button key={i} onClick={async()=>{
        showT(a+" → sending...");
        if(!DEMO){
          if(i===0||i===1)await apiCall(`/whatsapp/send/${d.id}`,{method:"POST",body:{}});
          if(i===5)await apiCall(`/leads/${d.id}`,{method:"PATCH",body:{stage:"won"}});
          if(i===6)await apiCall(`/leads/${d.id}`,{method:"PATCH",body:{stage:"lost"}});
          if(i===7)await apiCall(`/reports/generate/${d.id}`,{method:"POST"});
          await reloadLeads();
        }
        showT("✅ "+a+" → "+d.name);
      }} style={{padding:"9px 16px",borderRadius:12,border:"1px solid "+T.bd,background:i===0?accG:T.sf,color:i===0?"#fff":T.txS,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:ff}}>{a}</button>
    ))}
    {/* Quick Actions Dropdown */}
    <div style={{position:"relative"}}>
      <button onClick={()=>setLeadAction(leadAction===d.id?null:d.id)} style={{padding:"9px 16px",borderRadius:12,border:"1px solid "+T.pr+"33",background:T.pr+"0A",color:T.pr,fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:ff}}>⚡ Quick Actions ▾</button>
      {leadAction===d.id&&<div style={{position:"absolute",top:"100%",left:0,marginTop:6,background:T.sf,border:"1px solid "+T.bd,borderRadius:16,boxShadow:T.shH,padding:8,minWidth:240,zIndex:50,animation:"fadeScale .2s ease"}}>
        {[["📅 Invite to Meeting","Meeting invite sent!"],["⭐ Send Testimonial","Testimonial shared!"],["🔄 Send Follow-up","Follow-up sent!"],["⏰ Set Reminder","Reminder set!"],["📊 Send Case Study","Case study shared!"],["🎁 Send Special Offer","Offer sent!"],["📞 Schedule Callback","Callback scheduled!"],["📋 Request Feedback","Feedback request sent!"]].map(([label,toast2],i)=>(
          <div key={i} onClick={()=>{showT("✅ "+toast2+" → "+d.name);setLeadAction(null)}} style={{padding:"10px 14px",borderRadius:10,cursor:"pointer",fontSize:13,color:T.txS,fontWeight:500,transition:"all .15s"}} onMouseEnter={e=>e.target.style.background=T.pr+"0A"} onMouseLeave={e=>e.target.style.background="transparent"}>{label}</div>
        ))}
      </div>}
    </div>
  </div>
  {/* Manual Payment Entry */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:22,boxShadow:T.sh,marginBottom:16}}>
    <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>💰 Record Payment</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
      <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Amount (₹)</div><input placeholder="25000" style={IS}/></div>
      <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Payment Method</div><select style={IS}><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Razorpay</option><option>PhonePe</option><option>Google Pay</option><option>Cheque</option></select></div>
      <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Notes</div><input placeholder="Advance payment for website" style={IS}/></div>
      <button onClick={async()=>{if(!DEMO)await apiCall(`/leads/${d.id}/payments`,{method:"POST",body:{amount:25000,method:"upi",notes:"Payment"}});showT("✅ Payment ₹25,000 recorded for "+d.name)}} style={{padding:"12px 22px",borderRadius:12,border:"none",background:T.gn,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,height:46}}>Record</button>
    </div>
    <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
      <div style={{padding:"8px 14px",borderRadius:10,background:T.gn+"0A",border:"1px solid "+T.gn+"18",fontSize:12,color:T.gn}}>₹15,000 — UPI — 2 Mar — Advance</div>
      <div style={{padding:"8px 14px",borderRadius:10,background:T.gn+"0A",border:"1px solid "+T.gn+"18",fontSize:12,color:T.gn}}>₹10,000 — Cash — 5 Mar — Final</div>
    </div>
  </div>
  {/* Tech Stack */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:22,boxShadow:T.sh,marginBottom:16}}>
    <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Technical Stack</div>
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:10}}>
      {[["Google Analytics",d.ga],["Meta Pixel",d.pixel],["SSL Certificate",d.ssl],["Modern CMS",d.cms!=="HTML"],["Contact Form",true],["WhatsApp Button",false],["Schema Markup",false],["Sitemap",false]].map(([n,v],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:v?T.gn+"08":T.rd+"08",border:"1px solid "+(v?T.gn+"18":T.rd+"18")}}>
          <div style={{width:8,height:8,borderRadius:4,background:v?T.gn:T.rd}}/>
          <span style={{fontSize:12,color:v?T.gn:T.rd,fontWeight:500}}>{n}</span>
        </div>
      ))}
    </div>
    <div style={{display:"flex",gap:12,marginTop:14}}>
      <div style={{padding:"8px 14px",borderRadius:8,background:T.el,border:"1px solid "+T.bd,fontSize:12,color:T.txS}}>CMS: <strong>{d.cms}</strong></div>
      <div style={{padding:"8px 14px",borderRadius:8,background:T.el,border:"1px solid "+T.bd,fontSize:12,color:T.txS}}>Load: <strong style={{color:parseFloat(d.lt)>5?T.rd:T.gn}}>{d.lt}</strong></div>
      <div style={{padding:"8px 14px",borderRadius:8,background:T.el,border:"1px solid "+T.bd,fontSize:12,color:T.txS}}>Phone: <strong>{d.ph}</strong></div>
    </div>
  </div>
  {/* Custom Notes */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:22,boxShadow:T.sh,marginBottom:16}}>
    <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>📝 Notes</div>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <input value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add a note about this lead…" style={{...IS,flex:1}} onKeyDown={e=>{if(e.key==="Enter"&&newNote.trim()){setNotes(p=>({...p,[d.id]:(p[d.id]?p[d.id]+"\n":"")+"["+new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})+"] "+newNote}));setNewNote("");showT("📝 Note saved!")}}}/>
      <button onClick={async()=>{if(newNote.trim()){if(!DEMO)await apiCall(`/leads/${d.id}/notes`,{method:"POST",body:{content:newNote}});setNotes(p=>({...p,[d.id]:(p[d.id]?p[d.id]+"\n":"")+"["+new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})+"] "+newNote}));setNewNote("");showT("📝 Note saved!")}}} style={{padding:"12px 22px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Add Note</button>
    </div>
    {notes[d.id]?<div style={{padding:16,borderRadius:14,background:dk?T.el:T.ra,border:"1px solid "+T.bd}}>
      {notes[d.id].split("\n").map((note,i)=><div key={i} style={{padding:"8px 0",borderBottom:i<notes[d.id].split("\n").length-1?"1px solid "+T.bd:"none",fontSize:13,color:T.txS,lineHeight:1.6}}>{note}</div>)}
    </div>:<div style={{padding:16,textAlign:"center",color:T.txF,fontSize:13}}>No notes yet. Add your first note above.</div>}
  </div>
  {/* Timeline */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:22,boxShadow:T.sh}}>
    <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Activity Timeline</div>
    {[{t:"Today 2:38 PM",m:"Report generated (Premium Audit v8)",c:T.gn},{t:"Today 2:39 PM",m:"WhatsApp sent to "+d.ph,c:T.bl},{t:d.lv?"Today "+d.lv:"—",m:d.views>0?"Report opened "+d.views+" time"+(d.views>1?"s":""):"Report not viewed yet",c:d.views>0?T.yw:T.rd},{t:"Scheduled",m:"Follow-up #1 queued for tomorrow 10:00 AM",c:T.txM},{t:"Scheduled",m:"Follow-up #2 queued for Day 3",c:T.txF}].map((e,i)=>(
      <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<4?"1px solid "+T.bd:"none"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{width:10,height:10,borderRadius:5,background:e.c,boxShadow:`0 0 6px ${e.c}44`}}/>
          {i<4&&<div style={{width:1,flex:1,background:T.bd}}/>}
        </div>
        <div><div style={{fontSize:13,color:T.txS}}>{e.m}</div><div style={{fontSize:11,color:T.txF,marginTop:3}}>{e.t}</div></div>
      </div>
    ))}
  </div>
</div></div>)}

// ═══ MAIN RENDER ═══
return(
<div style={{display:"flex",minHeight:"100vh",width:"100%",background:T.bg,fontFamily:ff,color:T.tx,transition:"all .4s"}}>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body,#root{width:100%;min-height:100vh}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${dk?"rgba(255,255,255,.06)":"rgba(0,0,0,.06)"};border-radius:6px}
::-webkit-scrollbar-thumb:hover{background:${dk?"rgba(255,255,255,.14)":"rgba(0,0,0,.14)"}}
::selection{background:${T.acc};color:#fff}
body{background:${T.bg};transition:background .6s cubic-bezier(.4,0,.2,1)}

@keyframes rise{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}
@keyframes riseFast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes glow{0%,100%{box-shadow:0 0 24px ${T.acc}18,0 0 60px ${T.acc}06}50%{box-shadow:0 0 44px ${T.acc}33,0 0 100px ${T.acc}0D}}
@keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
@keyframes fadeScale{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes subtlePing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
@keyframes softBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}

.hov{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s cubic-bezier(.16,1,.3,1),border-color .4s;will-change:transform}
.hov:hover{transform:translateY(-4px) scale(1.004);
  box-shadow:${dk
    ?"0 0 0 1px rgba(255,255,255,.07),0 24px 64px rgba(0,0,0,.35),0 0 48px "+T.acc+"06"
    :"0 0 0 1px rgba(0,0,0,.05),0 24px 64px rgba(0,0,0,.06),0 0 48px "+T.acc+"04"};
  border-color:${T.acc}15!important}
.hov:active{transform:translateY(-1px) scale(.997);transition:.12s}

button{transition:all .25s cubic-bezier(.16,1,.3,1)!important;position:relative;overflow:hidden}
button:hover{filter:brightness(1.07);transform:translateY(-1px)}
button:active{transform:scale(.96) translateY(0)!important;filter:brightness(.97)}
button::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent 60%);opacity:0;transition:opacity .3s}
button:hover::after{opacity:1}

input,select,textarea{transition:all .3s cubic-bezier(.16,1,.3,1)!important}
input:focus,select:focus,textarea:focus{border-color:${T.acc}55!important;box-shadow:0 0 0 4px ${T.acc}0D,0 0 24px ${T.acc}06!important;outline:none}

tr{transition:all .2s}
tr:hover td{background:${dk?"rgba(245,158,11,.02)":"rgba(245,158,11,.012)"}!important}

span[style*="borderRadius: 6"]:hover,span[style*="borderRadius:6"]:hover{filter:brightness(1.2) saturate(1.15);cursor:pointer;transform:scale(1.05);transition:all .2s cubic-bezier(.16,1,.3,1)}

.dot{position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:
    radial-gradient(${dk?"rgba(255,255,255,.014)":"rgba(0,0,0,.01)"} 1px,transparent 1px),
    radial-gradient(ellipse at 15% 85%,${T.acc}05,transparent 55%),
    radial-gradient(ellipse at 85% 15%,${dk?"rgba(99,102,241,.035)":"rgba(99,102,241,.018)"},transparent 55%),
    radial-gradient(ellipse at 50% 50%,${dk?"rgba(167,139,250,.02)":"rgba(167,139,250,.008)"},transparent 70%);
  background-size:28px 28px,100% 100%,100% 100%,100% 100%}
.dot::after{content:'';position:fixed;inset:0;pointer-events:none;
  opacity:${dk?".03":".018"};mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:180px 180px}

.glow-accent{box-shadow:0 0 80px ${T.acc}08,0 0 160px ${T.acc}03}

/* ═══ MOBILE RESPONSIVE ═══ */
@media(max-width:768px){
  aside{display:none!important}
  main{margin-left:0!important}
  header{padding:10px 16px!important;gap:10px!important}
  .dot::after{display:none}
  .mob-hide{display:none!important}
  table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}
  thead,tbody,tr,th,td{white-space:nowrap}
  h1{font-size:22px!important}
}
@media(max-width:640px){
  header input{font-size:12px!important}
  h1{font-size:20px!important}
}
`}</style>
<PreviewM/><EditorM/>
{/* Note Full Page View */}
{noteFullView&&(()=>{const n=npNotes.find(x=>x.id===noteFullView);if(!n)return null;return(
  <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div onClick={()=>setNoteFullView(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)"}}/>
    <div style={{position:"relative",width:mob?"100%":"90%",maxWidth:mob?"100%":900,height:mob?"100vh":"85vh",borderRadius:mob?0:24,background:T.sf,borderRadius:24,boxShadow:T.shH,overflow:"hidden",display:"flex",flexDirection:"column",animation:"fadeScale .3s cubic-bezier(.16,1,.3,1)"}}>
      <div style={{padding:"20px 28px",borderBottom:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>📝</span>
          <input value={n.title} onChange={e=>setNpNotes(p=>p.map(x=>x.id===n.id?{...x,title:e.target.value}:x))} style={{fontSize:22,fontWeight:700,border:"none",background:"transparent",outline:"none",color:T.tx,fontFamily:ff,width:mob?200:400}}/>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:T.txF}}>Last edited: {n.updated}</span>
          <span style={{fontSize:14,cursor:"pointer"}} onClick={()=>setNpNotes(p=>p.map(x=>x.id===n.id?{...x,pinned:!x.pinned}:x))}>{n.pinned?"📌":"📍"}</span>
          <button onClick={()=>setNoteFullView(null)} style={{width:36,height:36,borderRadius:10,border:"1px solid "+T.bd,background:T.el,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.txS}}>✕</button>
        </div>
      </div>
      <textarea value={n.body} onChange={e=>setNpNotes(p=>p.map(x=>x.id===n.id?{...x,body:e.target.value,updated:"Just now"}:x))} style={{flex:1,padding:"28px 32px",fontSize:15,lineHeight:2,fontFamily:"'Plus Jakarta Sans',monospace",color:T.tx,background:"transparent",border:"none",outline:"none",resize:"none"}} placeholder="Start writing…"/>
      <div style={{padding:"12px 28px",borderTop:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:T.txF}}>{n.body.split("\n").length} lines · {n.body.length} chars</span>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:6,height:6,borderRadius:3,background:T.gn}}/><span style={{fontSize:11,color:T.gn}}>Auto-saved</span></div>
      </div>
    </div>
  </div>);
})()}
{/* CSV Import Modal */}
{csvModal&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
  <div onClick={()=>{setCsvModal(false);setCsvStep(1);setCsvData(null)}} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)"}}/>
  <div style={{position:"relative",width:mob?"100%":"90%",maxWidth:mob?"100%":700,borderRadius:mob?0:24,background:T.sf,borderRadius:24,boxShadow:T.shH,overflow:"hidden",animation:"fadeScale .3s cubic-bezier(.16,1,.3,1)"}}>
    <div style={{padding:"20px 28px",borderBottom:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontSize:18,fontWeight:700}}>📥 Import Leads</div>
      <button onClick={()=>{setCsvModal(false);setCsvStep(1);setCsvData(null)}} style={{width:36,height:36,borderRadius:10,border:"1px solid "+T.bd,background:T.el,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:T.txS}}>✕</button>
    </div>
    <div style={{padding:24}}>
      {/* Steps */}
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {[["1","Upload CSV"],["2","Map Columns"],["3","Review & Import"]].map(([n,l],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
            <div style={{width:28,height:28,borderRadius:14,background:csvStep>=parseInt(n)?T.acc:T.el,color:csvStep>=parseInt(n)?"#fff":T.txM,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .3s"}}>{n}</div>
            <span style={{fontSize:12,fontWeight:600,color:csvStep>=parseInt(n)?T.tx:T.txM}}>{l}</span>
            {i<2&&<div style={{flex:1,height:2,background:csvStep>parseInt(n)?T.acc:T.bd,borderRadius:1,transition:"all .3s"}}/>}
          </div>
        ))}
      </div>

      {csvStep===1&&<div>
        <div style={{border:"2px dashed "+T.bd,borderRadius:20,padding:"48px 32px",textAlign:"center",background:T.el,cursor:"pointer",transition:"all .2s"}} onClick={()=>{setCsvData({rows:47,dupes:3,cols:["name","website","city","phone","category"]});setCsvStep(2)}}>
          <div style={{fontSize:40,marginBottom:16,opacity:.3}}>📄</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Drop your CSV file here</div>
          <div style={{fontSize:13,color:T.txM}}>or click to browse · Supports .csv, .xlsx, .tsv</div>
          <div style={{fontSize:11,color:T.txF,marginTop:16}}>Required columns: name, website, city/location · Optional: phone, category, email</div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={()=>{setCsvData({rows:47,dupes:3,cols:["name","website","city","phone","category"]});setCsvStep(2)}} style={{padding:"10px 20px",borderRadius:12,border:"1px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>📋 Paste from clipboard</button>
          <button onClick={()=>{setCsvData({rows:47,dupes:3,cols:["name","website","city","phone","category"]});setCsvStep(2)}} style={{padding:"10px 20px",borderRadius:12,border:"1px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>🔗 Google Sheet URL</button>
        </div>
      </div>}

      {csvStep===2&&csvData&&<div>
        <div style={{padding:20,background:T.gn+"08",border:"1px solid "+T.gn+"18",borderRadius:16,marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:600,color:T.gn}}>✅ File parsed successfully</div>
          <div style={{fontSize:13,color:T.txS,marginTop:4}}>{csvData.rows} rows found · {csvData.dupes} potential duplicates detected · {csvData.cols.length} columns</div>
        </div>
        <div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:12}}>Map your columns:</div>
        {[["Business Name","name"],["Website URL","website"],["City/Location","city"],["Phone Number","phone"],["Category","category"]].map(([label,col],i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:mob?"1fr":"160px 1fr",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid "+T.bd}}>
            <span style={{fontSize:13,fontWeight:600,color:T.txS}}>{label}</span>
            <select style={{...IS,padding:"8px 12px",fontSize:12}}>
              <option>{col}</option>{csvData.cols.filter(c=>c!==col).map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:20}}>
          <button onClick={()=>setCsvStep(1)} style={{padding:"10px 20px",borderRadius:12,border:"1px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>← Back</button>
          <button onClick={()=>setCsvStep(3)} style={{padding:"10px 20px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Continue →</button>
        </div>
      </div>}

      {csvStep===3&&csvData&&<div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:24}}>
          <div style={{padding:20,borderRadius:16,background:T.gn+"08",border:"1px solid "+T.gn+"18",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:T.gn}}>{csvData.rows-csvData.dupes}</div>
            <div style={{fontSize:12,color:T.txM,marginTop:4}}>New leads to import</div>
          </div>
          <div style={{padding:20,borderRadius:16,background:T.yw+"08",border:"1px solid "+T.yw+"18",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:T.yw}}>{csvData.dupes}</div>
            <div style={{fontSize:12,color:T.txM,marginTop:4}}>Duplicates (will skip)</div>
          </div>
          <div style={{padding:20,borderRadius:16,background:T.bl+"08",border:"1px solid "+T.bl+"18",textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:T.bl}}>{csvData.cols.length}</div>
            <div style={{fontSize:12,color:T.txM,marginTop:4}}>Columns mapped</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div onClick={()=>{}} style={{width:22,height:22,borderRadius:7,border:"2px solid "+T.acc,background:T.acc,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
          <span style={{fontSize:13,color:T.txS}}>Auto-generate audit reports for imported leads</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setCsvStep(2)} style={{padding:"10px 20px",borderRadius:12,border:"1px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>← Back</button>
          <button onClick={()=>{setCsvModal(false);setCsvStep(1);setCsvData(null);showT("✅ "+String(csvData.rows-csvData.dupes)+" leads imported successfully!")}} style={{padding:"12px 24px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:ff,boxShadow:`0 4px 20px ${T.acc}33`}}>🚀 Import {csvData.rows-csvData.dupes} Leads</button>
        </div>
      </div>}
    </div>
  </div>
</div>}
{toast&&<div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:200,padding:"16px 32px",borderRadius:20,background:dk?"rgba(12,15,24,.9)":"rgba(255,255,255,.95)",border:"1px solid "+T.acc+"22",boxShadow:`0 12px 48px ${dk?"rgba(0,0,0,.5)":"rgba(0,0,0,.1)"},0 0 80px ${T.acc}08`,fontSize:14,fontWeight:600,animation:"fadeScale .4s cubic-bezier(.16,1,.3,1)",backdropFilter:"blur(20px) saturate(1.4)",display:"flex",alignItems:"center",gap:12}}>
  <div style={{width:8,height:8,borderRadius:4,background:T.gn,boxShadow:`0 0 12px ${T.gn}66`}}/>
  {toast}
</div>}
<div className="dot"/>

{/* SIDEBAR */}
<aside style={{width:72,background:T.sf,borderRight:"1px solid "+T.bd,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:18,paddingBottom:14,gap:2,position:"fixed",left:0,top:0,bottom:0,zIndex:30,boxShadow:dk?"6px 0 40px rgba(0,0,0,.35),1px 0 0 rgba(245,158,11,.03)":"6px 0 40px rgba(0,0,0,.04),1px 0 0 rgba(0,0,0,.02)"}}>
  <div style={{width:42,height:42,background:accG,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",marginBottom:16,boxShadow:`0 4px 28px ${T.acc}44,0 0 80px ${T.acc}11,inset 0 1px 0 rgba(255,255,255,.15)`,animation:"float 4s ease-in-out infinite"}}>TG</div>
  <div style={{flex:1,display:"flex",flexDirection:"column",gap:1,width:"100%",padding:"0 10px",overflowY:"auto"}}>
    {NAV.map(n=>{const a=pg===n.id;const h=hov===n.id;return(
      <div key={n.id} onClick={()=>setPg(n.id)} onMouseEnter={()=>setHov(n.id)} onMouseLeave={()=>setHov(null)} style={{width:52,height:44,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",background:a?T.acc+"12":h?(dk?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)"):"transparent",transition:"all .2s"}}>
        <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={a?T.acc:h?T.txS:T.txM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={n.i}/></svg>
        {a&&<><div style={{position:"absolute",left:-10,top:"50%",transform:"translateY(-50%)",width:3,height:18,borderRadius:2,background:T.acc,boxShadow:`0 0 14px ${T.acc}88`}}/><div style={{position:"absolute",left:-10,top:"50%",transform:"translateY(-50%)",width:3,height:18,borderRadius:2,background:T.acc,animation:"subtlePing 2s cubic-bezier(0,0,.2,1) infinite"}}/></>}
        {h&&<div style={{position:"absolute",left:60,top:"50%",transform:"translateY(-50%)",background:T.el,border:"1px solid "+T.bd,borderRadius:10,padding:"6px 14px",fontSize:11.5,fontWeight:600,color:T.tx,whiteSpace:"nowrap",boxShadow:T.shH,zIndex:50,animation:"rise .12s ease"}}>{n.l}</div>}
      </div>
    )})}
  </div>
  <div style={{width:28,height:1,background:T.bd,marginBottom:8}}/>
  <div onClick={()=>setDk(!dk)} style={{width:42,height:42,borderRadius:14,background:dk?T.el:T.ra,border:"1px solid "+T.bd,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,transition:"all .5s cubic-bezier(.68,-.55,.27,1.55)",transform:dk?"rotate(0deg)":"rotate(360deg)",boxShadow:dk?`0 0 20px rgba(245,158,11,.08)`:`0 0 20px rgba(99,102,241,.06)`}}>
    {dk?"☀️":"🌙"}
  </div>
</aside>

{/* MAIN */}
<main style={{flex:1,marginLeft:mob?0:72,marginBottom:mob?68:0,display:"flex",flexDirection:"column",overflow:"hidden",transition:"margin .3s",width:mob?"100%":"calc(100% - 72px)",minWidth:0}}>
<header style={{padding:"12px 32px",background:dk?"rgba(12,15,24,.75)":"rgba(255,255,255,.82)",backdropFilter:"blur(32px) saturate(1.4)",borderBottom:"1px solid "+T.bd,display:"flex",alignItems:"center",gap:16,position:"sticky",top:0,zIndex:20}}>
  <div style={{flex:1,position:"relative"}}>
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.txM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"/></svg>
    <input placeholder="Search leads, pages, actions…" value={sr} onChange={e=>setSr(e.target.value)} style={{...IS,paddingLeft:44,background:dk?T.el:T.ra,width:"100%"}}/>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
    <div className="mob-hide" style={{display:"flex",gap:5,padding:"8px 14px",background:dk?T.el:T.ra,borderRadius:10,border:"1px solid "+T.bd,alignItems:"center"}}><div style={{width:8,height:8,borderRadius:4,background:T.gn,boxShadow:`0 0 6px ${T.gn}55`}}/><span style={{fontSize:11,color:T.txM,fontWeight:500,marginLeft:4}}>All Systems OK</span></div>
    {/* CSV Import */}
    <button onClick={()=>setCsvModal(true)} className="hov" style={{padding:"8px 14px",borderRadius:10,border:"1px solid "+T.bd,background:T.sf,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>📥 Import</button>
    {/* Notification Bell */}
    <div style={{position:"relative"}}>
      <div onClick={()=>setNotifOpen(!notifOpen)} style={{width:40,height:40,borderRadius:12,background:dk?T.el:T.ra,border:"1px solid "+T.bd,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,position:"relative"}}>
        🔔
        {notifs.filter(n=>!n.read).length>0&&<div style={{position:"absolute",top:-2,right:-2,width:18,height:18,borderRadius:9,background:T.rd,color:"#fff",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${T.rd}44`}}>{notifs.filter(n=>!n.read).length}</div>}
      </div>
      {/* Notification Panel */}
      {notifOpen&&<div style={{position:"absolute",top:"100%",right:0,marginTop:8,width:400,maxHeight:500,background:dk?"rgba(12,15,24,.92)":"rgba(255,255,255,.96)",backdropFilter:"blur(24px) saturate(1.3)",border:"1px solid "+T.bd,borderRadius:18,boxShadow:dk?"0 20px 60px rgba(0,0,0,.5),0 0 60px "+T.acc+"06":"0 20px 60px rgba(0,0,0,.08)",overflow:"hidden",zIndex:100,animation:"fadeScale .25s cubic-bezier(.16,1,.3,1)"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:15,fontWeight:700}}>Notifications</span>
          <button onClick={()=>{setNotifs(p=>p.map(n=>({...n,read:true})));showT("✅ All marked read")}} style={{fontSize:11,color:T.acc,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:ff}}>Mark all read</button>
        </div>
        <div style={{maxHeight:400,overflow:"auto"}}>
          {notifs.map(n=>(
            <div key={n.id} onClick={()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))} style={{padding:"14px 20px",borderBottom:"1px solid "+T.bd,cursor:"pointer",background:n.read?"transparent":(T.acc+"06"),display:"flex",gap:12,alignItems:"flex-start",transition:"background .2s"}}>
              <div style={{width:8,height:8,borderRadius:4,marginTop:6,background:n.read?T.txF:n.type==="hot"?T.rd:n.type==="reply"?T.gn:n.type==="payment"?T.gn:n.type==="alert"?T.yw:T.bl,flexShrink:0,boxShadow:n.read?"none":`0 0 6px ${T.acc}44`}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:n.read?T.txM:T.tx,lineHeight:1.5,fontWeight:n.read?400:500}}>{n.msg}</div>
                <div style={{fontSize:11,color:T.txF,marginTop:4}}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </div>
    <button onClick={()=>setPg("generate")} style={{padding:"10px 22px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,boxShadow:`0 4px 20px ${T.acc}33,0 0 40px ${T.acc}08`,display:"flex",alignItems:"center",gap:8,animation:"glow 3s ease-in-out infinite"}}>▶ Generate</button>
  </div>
</header>

<div style={{flex:1,overflow:"auto",padding:mob?"16px 14px 80px":"28px 28px 48px"}}>
<div key={pg+String(dk)} style={{position:"relative",zIndex:1,animation:"rise .6s cubic-bezier(.16,1,.3,1) both",width:"100%"}}>

{/* ═══ HOME ═══ */}
{pg==="home"&&<div style={{display:"flex",flexDirection:"column",gap:22}}>
  {loading&&<div style={{textAlign:"center",padding:40,color:T.acc,fontSize:16,fontWeight:600}}>📊 Loading data from Google Sheet...</div>}
  {/* AI Briefing */}
  <div className="glow-accent" style={{background:`linear-gradient(135deg,${T.acc}0C,${dk?"rgba(99,102,241,.04)":"rgba(99,102,241,.02)"},${T.acc}06)`,border:"1px solid "+T.acc+"22",borderRadius:20,padding:mob?"22px":"28px 36px",animation:"fadeScale .6s cubic-bezier(.16,1,.3,1) both",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${T.acc}0A,transparent 70%)`,pointerEvents:"none"}}/>
    <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${dk?"rgba(99,102,241,.06)":"rgba(99,102,241,.03)"},transparent 70%)`,pointerEvents:"none"}}/>
    <div style={{display:"flex",gap:20}}><div style={{width:52,height:52,borderRadius:18,background:accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>✦</div><div><div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Good afternoon, Sahil</div><div style={{fontSize:15,color:T.txS,lineHeight:1.9}}><strong style={{color:T.acc}}>3 hot leads</strong> viewed 3+ times. <strong style={{color:T.gn}}>5 replies</strong> waiting. 2 calls today. MTD: <strong style={{color:T.gn}}>₹2.4L</strong> from 6 deals. <strong style={{color:T.yw}}>Priority:</strong> Follow up Delhi Dental (opened 8× today).</div></div></div>
  </div>

  {/* KPIs Row 1 */}
  <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)",gap:mob?10:16}}>
    {[{l:"Reports Today",v:"12",s:"+4 vs yesterday",c:T.gn,e:"📄"},{l:"WhatsApp Sent",v:"47",s:"98% delivered",c:T.bl,e:"📤"},{l:"Reports Opened",v:"31",s:"66% open rate",c:T.yw,e:"👁"},{l:"Replies Received",v:"5",s:"10.6% reply rate",c:T.acc,e:"💬"},{l:"Revenue MTD",v:"₹2.4L",s:"6 deals closed",c:T.gn,e:"💰"}].map((k,i)=>(
      <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"24px",boxShadow:T.sh,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${k.c},${k.c}66,transparent)`,opacity:.35}}/>
        <div style={{position:"absolute",top:-30,right:-20,width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${k.c}06,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>{k.l}</div>
            <div style={{fontSize:32,fontWeight:800,letterSpacing:-2,lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:12,color:T.txM,marginTop:10}}>{k.s}</div>
          </div>
          <span style={{fontSize:22,opacity:.07}}>{k.e}</span>
        </div>
      </div>
    ))}
  </div>

  {/* Quick Actions Bar */}
  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    {[["▶ Generate Reports","generate",accG,"#fff"],["📊 View Pipeline","pipeline",T.sf,T.tx],["📤 New Campaign","campaigns",T.sf,T.tx],["📋 Sheet Data","sheets",T.sf,T.tx],["💰 Record Payment","revenue",T.sf,T.tx]].map(([l,target,bg,c],i)=>(
      <button key={i} onClick={()=>setPg(target)} className="hov" style={{padding:"10px 20px",borderRadius:14,border:i===0?"none":"1px solid "+T.bd,background:bg,color:c,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:ff,boxShadow:i===0?`0 4px 16px ${T.acc}33`:T.sh}}>{l}</button>
    ))}
  </div>

  {/* Row 2: Pipeline + Conversion + Hot Leads */}
  <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:16}}>
    {/* Pipeline Mini */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Pipeline</div><span onClick={()=>setPg("pipeline")} style={{fontSize:11,color:T.acc,fontWeight:600,cursor:"pointer"}}>Open →</span></div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {STG.slice(0,7).map(s=>{const cnt=pc[s]||0;return(
          <div key={s} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setPg("pipeline")}>
            <div style={{width:8,height:8,borderRadius:4,background:SC2[s],flexShrink:0}}/>
            <span style={{fontSize:12,color:T.txS,flex:1}}>{SL[s]}</span>
            <div style={{flex:2,height:6,background:T.el,borderRadius:3,overflow:"hidden"}}><div style={{width:Math.max(cnt/allLeads.length*100,5)+"%",height:"100%",background:SC2[s],borderRadius:3}}/></div>
            <span style={{fontSize:13,fontWeight:700,color:SC2[s],width:20,textAlign:"right"}}>{cnt}</span>
          </div>
        )})}
      </div>
    </div>

    {/* Conversion Funnel */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:18}}>Conversion Funnel</div>
      {[["Sent → Opened","66%",T.yw],["Opened → Replied","16%",T.acc],["Replied → Call","60%",T.pr],["Call → Won","53%",T.gn],["Overall","4.2%",T.gn]].map(([l,v,c],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<4?"1px solid "+T.bd:"none"}}>
          <span style={{fontSize:12,color:T.txS,flex:1}}>{l}</span>
          <div style={{width:60,height:6,background:T.el,borderRadius:3,overflow:"hidden"}}><div style={{width:parseFloat(v)+"%",height:"100%",background:c,borderRadius:3}}/></div>
          <span style={{fontSize:13,fontWeight:700,color:c,width:36,textAlign:"right"}}>{v}</span>
        </div>
      ))}
    </div>

    {/* Hot Leads */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>🔥 Hot Leads</div><span onClick={()=>setPg("tracking")} style={{fontSize:11,color:T.acc,fontWeight:600,cursor:"pointer"}}>All →</span></div>
      {allLeads.filter(l=>l.views>=2).sort((a,b)=>b.views-a.views).slice(0,4).map((l,i)=>(
        <div key={i} onClick={()=>setDet(l)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid "+T.bd,cursor:"pointer"}}>
          {l.views>=3?<div style={{width:8,height:8,borderRadius:4,background:T.rd,animation:"pulse 1.5s infinite"}}/>:<div style={{width:8,height:8,borderRadius:4,background:T.yw}}/>}
          <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:600}}>{l.name}</div><div style={{fontSize:10.5,color:T.txM}}>{l.views}× · {l.lv}</div></div>
          <button onClick={e=>{e.stopPropagation();showT("✅ Sent!")}} style={{padding:"5px 12px",borderRadius:8,border:"1px solid "+T.acc+"33",background:T.acc+"0A",color:T.acc,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Follow up</button>
        </div>
      ))}
    </div>
  </div>

  {/* Row 3: Revenue mini + Team + Campaigns */}
  <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:16}}>
    {/* Revenue */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Revenue</div><span onClick={()=>setPg("revenue")} style={{fontSize:11,color:T.acc,fontWeight:600,cursor:"pointer"}}>Details →</span></div>
      <div style={{fontSize:36,fontWeight:800,color:T.gn,letterSpacing:-2,marginBottom:12}}>₹2.4L</div>
      {[["Clinic","₹1.2L",T.gn,80],["Astrologer","₹80K",T.acc,53],["Restaurant","₹60K",T.bl,40]].map(([c,r,cl,w],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span style={{fontSize:11,width:75,color:T.txS}}>{c}</span>
          <div style={{flex:1,height:5,background:T.el,borderRadius:3,overflow:"hidden"}}><div style={{width:w+"%",height:"100%",background:cl,borderRadius:3}}/></div>
          <span style={{fontSize:11,fontWeight:700,width:45,textAlign:"right"}}>{r}</span>
        </div>
      ))}
    </div>

    {/* Team */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Team</div><span onClick={()=>setPg("team")} style={{fontSize:11,color:T.acc,fontWeight:600,cursor:"pointer"}}>All →</span></div>
      {[{n:"Sahil",d:5,r:"₹2.1L",rt:"1.2h"},{n:"Rahul",d:2,r:"₹55K",rt:"3.1h"},{n:"Priya",d:1,r:"₹35K",rt:"2.8h"}].map((m,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<2?"1px solid "+T.bd:"none"}}>
          <div style={{width:30,height:30,borderRadius:10,background:accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{m.n[0]}</div>
          <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:600}}>{m.n}</div></div>
          <span style={{fontSize:11,fontWeight:700,color:T.gn}}>{m.r}</span>
          <span style={{fontSize:10,color:T.txM}}>{m.d} deals</span>
        </div>
      ))}
    </div>

    {/* Campaigns Mini */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Campaigns</div><span onClick={()=>setPg("campaigns")} style={{fontSize:11,color:T.acc,fontWeight:600,cursor:"pointer"}}>All →</span></div>
      {[{n:"Astrologer · Delhi",s:"live",rd:74,sn:120},{n:"Clinics · Multi",s:"done",rd:52,sn:80},{n:"Restaurants",s:"paused",rd:28,sn:45}].map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<2?"1px solid "+T.bd:"none"}}>
          <div style={{width:8,height:8,borderRadius:4,background:c.s==="live"?T.gn:c.s==="paused"?T.yw:T.txM}}/>
          <div style={{flex:1,fontSize:12.5,fontWeight:500}}>{c.n}</div>
          <span style={{fontSize:11,color:T.txM}}>{Math.round(c.rd/c.sn*100)}% read</span>
        </div>
      ))}
    </div>
  </div>

  {/* Row 4: Recent Activity + Notes */}
  <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:18}}>Recent Activity</div>
      {[{t:"2:38 PM",m:"5 reports generated",c:T.gn},{t:"2:37 PM",m:"WhatsApp: Sharma Astrology opened 5×",c:T.yw},{t:"2:36 PM",m:"Reply from Delhi Dental Care",c:T.acc},{t:"2:35 PM",m:"Payment ₹35K recorded — GreenLeaf",c:T.gn},{t:"2:30 PM",m:"Campaign paused: Restaurant Mumbai",c:T.yw}].map((a,i)=>(
        <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<4?"1px solid "+T.bd:"none",alignItems:"flex-start"}}>
          <div style={{width:8,height:8,borderRadius:4,marginTop:5,background:a.c,flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:12.5,color:T.txS}}>{a.m}</div><div style={{fontSize:10.5,color:T.txF,marginTop:3}}>{a.t}</div></div>
        </div>
      ))}
    </div>
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:18}}>Upcoming Tasks</div>
      {[{t:"Follow up Sharma Astrology",due:"Today 4 PM",who:"Rahul",c:T.rd},{t:"Call Delhi Dental Care",due:"Today 5 PM",who:"Sahil",c:T.acc},{t:"Send proposal Pure Ayurveda",due:"Tomorrow",who:"Priya",c:T.bl},{t:"Campaign review — Restaurants",due:"Tomorrow",who:"Sahil",c:T.yw}].map((task,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<3?"1px solid "+T.bd:"none"}}>
          <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+T.bd,flexShrink:0,cursor:"pointer"}}/>
          <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:500}}>{task.t}</div><div style={{fontSize:10.5,color:T.txM,marginTop:2}}>{task.who} · {task.due}</div></div>
          <div style={{width:6,height:6,borderRadius:3,background:task.c}}/>
        </div>
      ))}
    </div>
  </div>
</div>}

{/* ═══ PIPELINE — Redesigned for 1000+ scale ═══ */}
{pg==="pipeline"&&<div style={{display:"flex",flexDirection:"column",gap:24}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div><h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8,marginBottom:4}}>Pipeline</h1><p style={{fontSize:14,color:T.txS}}>Today's funnel across all reports</p></div>
    <div style={{display:"flex",gap:4,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd}}>
      {[["summary","Summary"],["table","Table"]].map(([v,l])=><button key={v} onClick={()=>setPipeView(v)} style={{padding:"8px 18px",borderRadius:10,border:"none",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",background:pipeView===v?T.sf:"transparent",color:pipeView===v?T.tx:T.txM,boxShadow:pipeView===v?T.sh:"none"}}>{l}</button>)}
    </div>
  </div>

  {/* Funnel Visualization */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:24,padding:32,boxShadow:T.sh}}>
    <div style={{display:"flex",alignItems:"flex-end",gap:12,justifyContent:"space-between",marginBottom:32}}>
      {STG.map((s,i)=>{const count=pc[s]||0;const maxH=120;const h=Math.max(20,count/Math.max(...Object.values(pc),1)*maxH);
        return(<div key={s} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{fontSize:24,fontWeight:800,color:SC2[s]}}>{count}</div>
          <div style={{width:"100%",height:h,borderRadius:12,background:`linear-gradient(180deg,${SC2[s]},${SC2[s]}88)`,transition:"height .6s cubic-bezier(.16,1,.3,1)",boxShadow:`0 4px 20px ${SC2[s]}22`}}/>
          <div style={{fontSize:11,fontWeight:600,color:SC2[s],textAlign:"center"}}>{SL[s]}</div>
        </div>);
      })}
    </div>
    {/* Conversion rates */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {[["Sent→Opened",pc.viewed&&pc.sent?Math.round(pc.viewed/pc.sent*100):0],["Opened→Replied",pc.responded&&pc.viewed?Math.round(pc.responded/pc.viewed*100):0],["Total→Won",pc.won?Math.round(pc.won/allLeads.length*100):0]].map(([l,v],i)=>(
        <div key={i} style={{padding:"10px 18px",borderRadius:12,background:T.el,border:"1px solid "+T.bd,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:T.txM}}>{l}</span>
          <span style={{fontSize:16,fontWeight:800,color:v>20?T.gn:v>10?T.yw:T.rd}}>{v}%</span>
        </div>
      ))}
    </div>
  </div>

  {pipeView==="summary"&&<div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:14}}>
    {STG.map(s=>{const stLeads=allLeads.filter(l=>l.stage===s);const revTotal=stLeads.reduce((a,l)=>a+parseInt(l.loss.replace(/,/g,"")),0);
      return(<div key={s} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:22,boxShadow:T.sh}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:10,height:10,borderRadius:5,background:SC2[s],boxShadow:`0 0 8px ${SC2[s]}66`}}/><span style={{fontSize:13,fontWeight:700,color:SC2[s]}}>{SL[s]}</span><span style={{marginLeft:"auto",fontSize:22,fontWeight:800,color:SC2[s]}}>{stLeads.length}</span></div>
        <div style={{fontSize:12,color:T.txM,marginBottom:8}}>Revenue: <strong style={{color:T.acc}}>₹{(revTotal/100000).toFixed(1)}L</strong></div>
        {stLeads.slice(0,3).map((l,i)=><div key={i} onClick={()=>setDet(l)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid "+T.bd,cursor:"pointer",fontSize:12}}><span style={{fontWeight:700,color:scC(l.score),width:22}}>{l.score}</span><span style={{flex:1,color:T.txS}}>{l.name}</span>{l.views>=3&&<span style={{fontSize:10,color:T.rd}}>🔥</span>}</div>)}
        {stLeads.length>3&&<div style={{fontSize:11,color:T.txM,marginTop:6}}>+{stLeads.length-3} more</div>}
      </div>);
    })}
  </div>}

  {pipeView==="table"&&<div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,overflow:"hidden",boxShadow:T.sh}}>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Lead","Score","LS","Stage","Views","Revenue","Owner"].map(h=><th key={h} style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,padding:"14px 18px",textAlign:"left",borderBottom:"1.5px solid "+T.bd,background:dk?T.el:T.ra}}>{h}</th>)}</tr></thead>
    <tbody>{allLeads.sort((a,b)=>STG.indexOf(a.stage)-STG.indexOf(b.stage)).map((d,i)=><tr key={i} onClick={()=>setDet(d)} style={{cursor:"pointer"}}><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd}}><div style={{fontSize:13,fontWeight:600}}>{d.name}</div><div style={{fontSize:11,color:T.txM,marginTop:2}}>{d.type} · {d.city}</div></td><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd}}><span style={{fontSize:18,fontWeight:800,color:scC(d.score)}}>{d.score}</span></td><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd}}>{B(d.ls,d.ls>80?T.acc:T.yw)}</td><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd}}>{B(SL[d.stage],SC2[d.stage])}</td><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd,color:d.views>3?T.gn:d.views>0?T.yw:T.txF,fontWeight:600}}>{d.views||"—"}{d.views>=3&&" 🔥"}</td><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd,fontWeight:700,color:T.acc}}>₹{d.loss}</td><td style={{padding:"14px 18px",borderBottom:"1px solid "+T.bd,color:T.txS,fontSize:12}}>{d.owner||"—"}</td></tr>)}</tbody></table>
  </div>}
</div>}

{/* ═══ GENERATE (batch fixed) ═══ */}
{pg==="generate"&&<div style={{display:"flex",flexDirection:"column",gap:24}}>
  <h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8}}>Generate Reports</h1>
  {isGen&&<div style={{height:6,background:T.el,borderRadius:6,overflow:"hidden",border:"1px solid "+T.bd}}><div style={{width:genP+"%",height:"100%",background:accG,borderRadius:6,transition:"width .5s"}}/></div>}
  <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 360px",gap:24}}>
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Configuration</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:16}}>
          {[["Template",<select key="t" style={IS}>{tmpls.filter(x=>x.active).map(x=><option key={x.id}>{x.name} v{x.ver}</option>)}</select>],["AI Mode",<select key="a" style={IS}><option>Light</option><option>Deep</option><option>Off</option></select>],["Output",<select key="o" style={IS}><option>HTML + PDF</option><option>HTML</option><option>PDF</option></select>]].map(([l,el],i)=><div key={i}><div style={{fontSize:13,fontWeight:500,color:T.txM,marginBottom:10}}>{l}</div>{el}</div>)}
        </div>
      </div>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Filters</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:16}}>
          <div><div style={{fontSize:13,fontWeight:500,color:T.txM,marginBottom:10}}>Category</div><select value={cmdCat} onChange={e=>setCmdCat(e.target.value)} style={IS}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><div style={{fontSize:13,fontWeight:500,color:T.txM,marginBottom:10}}>Priority</div><select style={IS}><option>Lead Score ↓</option><option>Revenue ↓</option></select></div>
          <div><div style={{fontSize:13,fontWeight:500,color:T.txM,marginBottom:10}}>Batch Size</div><input type="number" value={batch} onChange={e=>setBatch(Math.max(1,Math.min(50,+e.target.value||1)))} style={IS}/></div>
        </div>
      </div>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Auto-Delivery</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <Check label="📤 WhatsApp" checked={autoWA} onChange={()=>setAutoWA(!autoWA)}/>
          <Check label="📧 Email" checked={autoEmail} onChange={()=>setAutoEmail(!autoEmail)}/>
          <Check label="↻ Sequence" checked={autoSeq} onChange={()=>setAutoSeq(!autoSeq)}/>
        </div>
      </div>
      <button onClick={runGen} disabled={isGen||!queue.length} style={{padding:"18px 36px",borderRadius:16,border:"none",background:(isGen||!queue.length)?T.bd:accG,color:(isGen||!queue.length)?T.txM:"#fff",fontSize:16,fontWeight:700,cursor:(isGen||!queue.length)?"not-allowed":"pointer",fontFamily:ff,boxShadow:(isGen||!queue.length)?"none":`0 6px 28px ${T.acc}33`,textAlign:"center",animation:(!isGen&&queue.length)?"glow 2s infinite":"none"}}>{isGen?`${Math.round(genP)}%`:`🚀 Generate + Send ${queue.length} Reports`}</button>
    </div>
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:20}}>Queue · {queue.length} leads</div>
      <div style={{maxHeight:500,overflow:"auto"}}>{queue.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.bd}}><span style={{fontSize:20,fontWeight:800,color:scC(d.score),width:34,textAlign:"center"}}>{d.score}</span><div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:600}}>{d.name}</div><div style={{fontSize:11,color:T.txM,marginTop:3}}>{d.url} · {d.city}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.acc}}>₹{d.loss}</div><div style={{fontSize:10,color:T.pr,marginTop:2}}>LS:{d.ls}</div></div></div>)}</div>
    </div>
  </div>
</div>}

{/* ═══ LEADS ═══ */}
{pg==="leads"&&<div style={{display:"flex",flexDirection:"column",gap:18}}>
  <h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8}}>Leads ({filtered.length})</h1>
  {/* Advanced Search */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"18px 22px",boxShadow:T.sh}}>
    <input value={sr} onChange={e=>setSr(e.target.value)} placeholder="🔍 Search by name, URL, city, phone, owner, category, source…" style={{...IS,fontSize:15,padding:"14px 20px",borderRadius:14,background:dk?T.el:T.ra,border:"2px solid "+T.bd,width:"100%"}}/>
    {sr&&<div style={{fontSize:11,color:T.txM,marginTop:8}}>Searching across: name, website, city, phone, owner, category, source</div>}
  </div>
  {/* Tag Filters */}
  <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
    {/* Category */}
    <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd}}>
      {CATS.map(c=><button key={c} onClick={()=>setFC(c)} style={{padding:"7px 14px",borderRadius:9,border:"none",fontSize:11.5,fontWeight:600,fontFamily:ff,cursor:"pointer",background:fC===c?T.acc+"18":"transparent",color:fC===c?T.acc:T.txM,transition:"all .15s"}}>{c}</button>)}
    </div>
    {/* Stage */}
    <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd}}>
      <button onClick={()=>setStageFilter("all")} style={{padding:"7px 12px",borderRadius:9,border:"none",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",background:stageFilter==="all"?T.bl+"18":"transparent",color:stageFilter==="all"?T.bl:T.txM}}>All Stages</button>
      {STG.map(s=><button key={s} onClick={()=>setStageFilter(stageFilter===s?"all":s)} style={{padding:"7px 10px",borderRadius:9,border:"none",fontSize:10.5,fontWeight:600,fontFamily:ff,cursor:"pointer",background:stageFilter===s?(SC2[s]+"18"):"transparent",color:stageFilter===s?SC2[s]:T.txM}}>{SL[s]}</button>)}
    </div>
    {/* Source */}
    <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd}}>
      {["all","Maps","FB Ads","Manual"].map(s=><button key={s} onClick={()=>setSrcFilter(s)} style={{padding:"7px 12px",borderRadius:9,border:"none",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",background:srcFilter===s?T.pr+"18":"transparent",color:srcFilter===s?T.pr:T.txM}}>{s==="all"?"All Sources":s}</button>)}
    </div>
    {/* Active filter count */}
    {(fC!=="All"||stageFilter!=="all"||srcFilter!=="all"||sr)&&<button onClick={()=>{setFC("All");setStageFilter("all");setSrcFilter("all");setSr("")}} style={{padding:"7px 14px",borderRadius:9,border:"1px solid "+T.rd+"33",background:T.rd+"0A",color:T.rd,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:ff}}>✕ Clear</button>}
    {/* Date Filter */}
    <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd,marginLeft:"auto"}}>
      {[["all","All Time"],["today","Today"],["week","This Week"],["month","This Month"]].map(([v,l])=><button key={v} onClick={()=>setDateFilter(v)} style={{padding:"7px 12px",borderRadius:9,border:"none",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",background:dateFilter===v?T.acc+"18":"transparent",color:dateFilter===v?T.acc:T.txM}}>{l}</button>)}
    </div>
  </div>
  {/* Table */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,overflow:"hidden",boxShadow:T.sh}}>
    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Lead","Score","Lead Score","Stage","Views","Revenue","Source","Owner",""].map(h=><th key={h} style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,padding:"14px 18px",textAlign:"left",borderBottom:"1.5px solid "+T.bd,background:dk?T.el:T.ra}}>{h}</th>)}</tr></thead>
    <tbody>{filtered.map((d,i)=><tr key={i} onClick={()=>setDet(d)} style={{cursor:"pointer"}}>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd}}>
        <div style={{fontSize:14,fontWeight:600}}>{d.name}</div>
        <div style={{display:"flex",gap:4,marginTop:4}}>
          <span onClick={e=>{e.stopPropagation();setFC(d.type)}} style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:T.bl+"14",color:T.bl,cursor:"pointer"}}>{d.type}</span>
          <span style={{fontSize:10,color:T.txM}}>{d.city}</span>
        </div>
      </td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd}}><span style={{fontSize:20,fontWeight:800,color:scC(d.score)}}>{d.score}</span></td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd}}>{B(d.ls,d.ls>80?T.acc:T.yw)}</td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd}}><span onClick={e=>{e.stopPropagation();setStageFilter(d.stage)}} style={{fontSize:11,fontWeight:600,padding:"4px 11px",borderRadius:6,background:(SC2[d.stage]||T.acc)+"14",color:SC2[d.stage]||T.acc,cursor:"pointer"}}>{SL[d.stage]}</span></td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd,fontWeight:600,color:d.views>3?T.gn:d.views>0?T.yw:T.txF}}>{d.views||"—"}{d.views>=3&&" 🔥"}</td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd,fontWeight:700,color:T.acc}}>₹{d.loss}</td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd}}><span onClick={e=>{e.stopPropagation();setSrcFilter(d.src)}} style={{fontSize:11,fontWeight:600,padding:"4px 11px",borderRadius:6,background:T.pr+"14",color:T.pr,cursor:"pointer"}}>{d.src}</span></td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd,color:T.txS,fontSize:12}}>{d.owner||"—"}</td>
      <td style={{padding:"16px 18px",borderBottom:"1px solid "+T.bd,color:T.txF}}>›</td>
    </tr>)}</tbody></table>
  </div>
</div>}

{/* ═══ TEMPLATES (with Editor + Preview + WA Tab) ═══ */}
{pg==="templates"&&<div style={{display:"flex",flexDirection:"column",gap:22}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8}}>Templates</h1>
    <button style={{padding:"10px 22px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>+ New</button>
  </div>
  {/* Tab bar */}
  <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:14,padding:4,border:"1px solid "+T.bd,alignSelf:"flex-start"}}>
    {[["templates","Report Templates"],["wa","WhatsApp Templates"]].map(([id,lb])=>(
      <button key={id} onClick={()=>setWaTab(id)} style={{padding:"10px 22px",borderRadius:10,border:"none",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer",background:waTab===id?T.sf:"transparent",color:waTab===id?T.tx:T.txM,boxShadow:waTab===id?T.sh:"none",transition:"all .2s"}}>{lb}</button>
    ))}
  </div>

  {waTab==="templates"&&<div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20}}>
    {tmpls.map(t=>(
      <div key={t.id} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:24,overflow:"hidden",boxShadow:T.sh,opacity:t.active?1:.55}}>
        <div style={{height:160,background:t.active?`linear-gradient(135deg,#0B1120 0%,#1a1f3a 50%,${T.acc}22 100%)`:(dk?T.el:T.ra),display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
          <div style={{fontSize:48,opacity:.08}}>📄</div>
          <div style={{position:"absolute",top:16,right:16,display:"flex",gap:6}}>
            {B(t.active?"Active":"Draft",t.active?T.gn:T.txM)}
            {B("v"+t.ver,T.bl)}
          </div>
          <div style={{position:"absolute",bottom:16,left:16,display:"flex",gap:8}}>
            {B(t.pages+" pages",T.txM)}
            {B(t.used+"× used",T.acc)}
          </div>
        </div>
        <div style={{padding:24}}>
          <div style={{fontSize:22,fontWeight:700,marginBottom:8}}>{t.name}</div>
          <p style={{fontSize:14,color:T.txS,lineHeight:1.7,marginBottom:22}}>{t.desc}</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setPreviewTmpl(t)} className="hov" style={{flex:1,padding:"14px",borderRadius:14,border:"1px solid "+T.bd,background:T.sf,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>👁 Preview</button>
            <button onClick={()=>{setEditTmpl({...t});setEditTab("html")}} className="hov" style={{flex:1,padding:"14px",borderRadius:14,border:"1px solid "+T.acc+"33",background:T.acc+"0A",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.acc}}>✏️ Edit HTML & Prompt</button>
          </div>
        </div>
      </div>
    ))}
  </div>}

  {waTab==="wa"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Category filter */}
    <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd,alignSelf:"flex-start"}}>
      {["All","First Contact","Follow-up","Urgency","Response","Closing","Post-Sale"].map(c=>(
        <button key={c} onClick={()=>setWaTmplCat(c)} style={{padding:"7px 14px",borderRadius:9,border:"none",fontSize:11.5,fontWeight:600,fontFamily:ff,cursor:"pointer",background:waTmplCat===c?T.gn+"18":"transparent",color:waTmplCat===c?T.gn:T.txM}}>{c}</button>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14}}>
      {[
        {n:"Initial Outreach — Hindi",cat:"First Contact",rate:"14%",desc:"Namaste {{name}} ji, maine aapki website {{website}} audit ki hai aur {{score}}/100 score aaya. Aapki website se customers ja rahe hain. Kya hum baat kar sakte hain?",vars:["name","website","score"]},
        {n:"Follow-up — Day 1 Soft",cat:"Follow-up",rate:"8%",desc:"Hi {{name}}, kal maine aapko ek website audit report bheja tha. Kya aapne dekha? Agar koi doubt hai toh call schedule kar sakte hain.",vars:["name"]},
        {n:"Follow-up — Day 3 Urgency",cat:"Urgency",rate:"6%",desc:"{{name}} ji, aapki website abhi bhi ₹{{loss}}/month ka business kho rahi hai. Competitors aage badh rahe hain. Limited time offer: 20% off on redesign.",vars:["name","loss"]},
        {n:"Pricing Response",cat:"Response",rate:"22%",desc:"{{name}} ji, humari pricing: Website ₹15-50K, SEO ₹10-25K/mo, Ads ₹8K setup. Aapke liye best package: {{package}}. Shall I send detailed proposal?",vars:["name","package"]},
        {n:"Invite to Meeting",cat:"Closing",rate:"18%",desc:"{{name}} ji, kya aap kal {{time}} pe 15 min ki call le sakte hain? Main specifically aapke {{issue}} ke baare mein strategy discuss karunga.",vars:["name","time","issue"]},
        {n:"Send Testimonial",cat:"Closing",rate:"12%",desc:"{{name}} ji, humare ek client {{client_name}} ne similar issues face kiye the. Ab unka business {{result}} grow hua hai. Unka video testimonial bhej raha hoon.",vars:["name","client_name","result"]},
        {n:"Payment Reminder",cat:"Post-Sale",rate:"92%",desc:"Hi {{name}}, aapka project start ho chuka hai. Advance payment of ₹{{amount}} pending hai. UPI: {{upi_id}}. Payment hone ke baad work aage badhega.",vars:["name","amount","upi_id"]},
        {n:"Project Update",cat:"Post-Sale",rate:"95%",desc:"{{name}} ji, aapka website project {{progress}}% complete hai. Next milestone: {{next}}. Estimated delivery: {{date}}.",vars:["name","progress","next","date"]},
      ].filter(t=>waTmplCat==="All"||t.cat===waTmplCat).map((t,i)=>(
        <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:24,boxShadow:T.sh}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,alignItems:"center"}}>
            <span style={{fontSize:15,fontWeight:600}}>{t.n}</span>
            {B(t.rate+" reply",T.gn)}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {B(t.cat,T.bl)}
            <span style={{fontSize:11,color:T.txM}}>{t.vars.length} variables</span>
          </div>
          <div style={{fontSize:13,color:T.txM,lineHeight:1.7,padding:16,background:dk?T.el:T.ra,borderRadius:14,border:"1px solid "+T.bd,fontStyle:"italic",marginBottom:14}}>{t.desc}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {t.vars.map(v=><span key={v} style={{padding:"3px 8px",borderRadius:4,background:T.acc+"14",color:T.acc,fontSize:10,fontWeight:600}}>{"{{"+v+"}}"}</span>)}
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={()=>showT("✏️ Editing: "+t.n)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+T.bd,background:T.sf,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>Edit</button>
            <button onClick={()=>showT("📤 Test sent!")} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid "+T.gn+"33",background:T.gn+"0A",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.gn}}>Test Send</button>
          </div>
        </div>
      ))}
    </div>
  </div>}
</div>}

{/* ═══ BOOKMARKS ═══ */}
{pg==="bookmarks"&&<div style={{display:"flex",flexDirection:"column",gap:24}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div><h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8,marginBottom:4}}>Bookmarks</h1><p style={{fontSize:14,color:T.txS}}>Quick access to your tools & workflows</p></div>
    <button onClick={()=>setAddingBM(true)} style={{padding:"10px 22px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>+ Add Bookmark</button>
  </div>

  {/* Add form */}
  {addingBM&&<div style={{background:T.sf,border:"1px solid "+T.acc+"33",borderRadius:18,padding:24,boxShadow:T.sh}}>
    <div style={{fontSize:14,fontWeight:700,marginBottom:18}}>Add New Bookmark</div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:8}}>Choose Icon</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {BM_ICONS.map(ic=><div key={ic} onClick={()=>setNewBM({...newBM,icon:ic})} style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,cursor:"pointer",background:newBM.icon===ic?T.acc+"14":T.el,border:newBM.icon===ic?"2px solid "+T.acc:"2px solid "+T.bd,transition:"all .2s"}}>{ic}</div>)}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:18}}>
      <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:6}}>Name</div><input value={newBM.name} onChange={e=>setNewBM({...newBM,name:e.target.value})} placeholder="My Sheet" style={IS}/></div>
      <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:6}}>URL</div><input value={newBM.url} onChange={e=>setNewBM({...newBM,url:e.target.value})} placeholder="https://..." style={IS}/></div>
      <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:6}}>Category</div><select value={newBM.cat} onChange={e=>setNewBM({...newBM,cat:e.target.value})} style={IS}><option>General</option><option>Sheets</option><option>Workflows</option><option>Storage</option><option>Tools</option><option>Notes</option></select></div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={()=>{if(newBM.name&&newBM.url){setBookmarks(p=>[...p,{...newBM,id:Date.now()}]);setNewBM({icon:"📌",name:"",url:"",cat:"General"});setAddingBM(false);showT("✅ Bookmark added!")}}} style={{padding:"10px 22px",borderRadius:10,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Add</button>
      <button onClick={()=>setAddingBM(false)} style={{padding:"10px 22px",borderRadius:10,border:"1px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:ff,color:T.txS}}>Cancel</button>
    </div>
  </div>}

  {/* Bookmark grid */}
  {[...new Set(bookmarks.map(b=>b.cat))].map(cat=>(
    <div key={cat}>
      <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>{cat}</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:14}}>
        {bookmarks.filter(b=>b.cat===cat).map(bm=>(
          <a key={bm.id} href={bm.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",color:"inherit"}}>
            <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:20,padding:"22px 24px",boxShadow:T.sh,display:"flex",alignItems:"center",gap:16,cursor:"pointer"}}>
              <div style={{width:52,height:52,borderRadius:16,background:dk?T.el:T.ra,border:"1px solid "+T.bd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{bm.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{bm.name}</div>
                <div style={{fontSize:11.5,color:T.txM,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bm.url.replace("https://","").split("/")[0]}</div>
              </div>
              <div style={{color:T.txF,fontSize:14}}>↗</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  ))}
</div>}

{/* ═══ GOOGLE SHEETS VIEWER — Premium ═══ */}
{pg==="sheets"&&<div style={{display:"flex",flexDirection:"column",gap:18}}>
  {/* Header */}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <div style={{width:48,height:48,borderRadius:16,background:"linear-gradient(135deg,#34A853,#0F9D58)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 24px rgba(52,168,83,.25)"}}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18"/></svg>
      </div>
      <div><h1 style={{fontSize:26,fontWeight:800,letterSpacing:-.8,marginBottom:2}}>Sheet Data</h1><p style={{fontSize:13,color:T.txM}}>Live connected — {SHEET_TABS.length+1} tabs</p></div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={async()=>{showT("🔄 Syncing...");const d=await fetchGoogleSheet();if(d&&d.length>0){setAllLeads(d);setLastSynced(new Date());showT("✅ "+d.length+" leads synced!")}}} className="hov" style={{padding:"10px 20px",borderRadius:12,border:"1px solid "+T.bd,background:T.sf,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS,display:"flex",alignItems:"center",gap:6}}>↻ Sync</button>
      {sheetUrl&&<a href={sheetUrl} target="_blank" rel="noreferrer" className="hov" style={{padding:"10px 20px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#34A853,#0F9D58)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff,textDecoration:"none",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 16px rgba(52,168,83,.2)"}}>↗ Open in Sheets</a>}
    </div>
  </div>
  {/* Status + Sync Controls */}
  <div style={{display:"flex",gap:14,alignItems:"center",padding:"12px 20px",background:T.gn+"08",border:"1px solid "+T.gn+"18",borderRadius:14,flexWrap:"wrap"}}>
    <div style={{position:"relative"}}><div style={{width:10,height:10,borderRadius:5,background:T.gn}}/><div style={{position:"absolute",inset:-3,borderRadius:8,border:"2px solid "+T.gn,animation:"subtlePing 2s infinite"}}/></div>
    <span style={{fontSize:13,color:T.gn,fontWeight:700}}>Live Connected</span>
    <div style={{width:1,height:16,background:T.gn+"22"}}/>
    <span style={{fontSize:12,color:T.txM}}>{allLeads.length} leads</span>
    <div style={{width:1,height:16,background:T.gn+"22"}}/>
    <span style={{fontSize:12,color:T.txM}}>{lastSynced?"Last synced: "+lastSynced.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"Not synced yet"}</span>
    <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:T.txF}}>Auto-sync:</span>
      <select value={syncInterval} onChange={e=>{setSyncInterval(e.target.value);if(e.target.value!=="manual")showT("⏰ Auto-sync set to "+e.target.value+" min")}} style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+T.bd,background:dk?T.el:T.ra,color:T.tx,fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",outline:"none"}}>
        <option value="manual">Manual</option>
        <option value="1">Every 1 min</option>
        <option value="5">Every 5 min</option>
        <option value="10">Every 10 min</option>
        <option value="15">Every 15 min</option>
        <option value="30">Every 30 min</option>
      </select>
      {syncInterval!=="manual"&&<div style={{width:6,height:6,borderRadius:3,background:T.gn,animation:"pulse 2s infinite"}}/>}
    </div>
  </div>
  {/* Tabs */}
  <div style={{display:"flex",gap:4,padding:5,background:dk?T.el:T.ra,borderRadius:16,border:"1px solid "+T.bd,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
    <button onClick={()=>setSheetTab("leads")} className="hov" style={{padding:"10px 20px",borderRadius:12,border:"none",fontSize:12.5,fontWeight:700,fontFamily:ff,cursor:"pointer",whiteSpace:"nowrap",background:sheetTab==="leads"?`linear-gradient(135deg,${T.acc},#e8660a)`:"transparent",color:sheetTab==="leads"?"#fff":T.txM,boxShadow:sheetTab==="leads"?`0 4px 16px ${T.acc}33`:"none",transition:"all .25s cubic-bezier(.16,1,.3,1)",display:"flex",alignItems:"center",gap:6}}>📊 Leads Data <span style={{padding:"2px 8px",borderRadius:6,background:sheetTab==="leads"?"rgba(255,255,255,.2)":T.bd,fontSize:10,fontWeight:700}}>{allLeads.length}</span></button>
    {SHEET_TABS.map((tab,ti)=>{const icons=["📋","🔍","📊","🚫","📵","🌐","⚠️","✅","🔑","👤"];const hd=sheetTabData[tab];return(
      <button key={tab} onClick={()=>{setSheetTab(tab);if(!sheetTabData[tab])fetchSheetTab(tab)}} className="hov" style={{padding:"10px 16px",borderRadius:12,border:"none",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",whiteSpace:"nowrap",background:sheetTab===tab?T.sf:"transparent",color:sheetTab===tab?T.tx:T.txM,boxShadow:sheetTab===tab?T.sh:"none",transition:"all .25s",display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:13}}>{icons[ti]||"📄"}</span>{tab}{hd&&<span style={{padding:"1px 6px",borderRadius:5,background:T.gn+"14",color:T.gn,fontSize:9,fontWeight:700}}>{hd.rows.length}</span>}</button>
    )})}
  </div>
  {/* Table */}
  <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,overflow:"hidden",boxShadow:T.sh,position:"relative"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:sheetTab==="leads"?`linear-gradient(90deg,${T.acc},${T.acc}66,transparent)`:"linear-gradient(90deg,#34A853,#34A85366,transparent)",opacity:.4}}/>
    {sheetTab==="leads"&&<div style={{overflow:"auto",maxHeight:"65vh"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:1200}}>
        <thead><tr>{["#","Name","Website / URL","City","Category","Score","Phone","Source","Stage","Owner"].map(h=>(
          <th key={h} style={{fontSize:10,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:1.2,padding:"14px 16px",textAlign:"left",borderBottom:"2px solid "+T.bd,background:dk?"rgba(15,17,23,.95)":"rgba(248,250,252,.95)",backdropFilter:"blur(8px)",whiteSpace:"nowrap",position:"sticky",top:0,zIndex:2}}>{h}</th>
        ))}</tr></thead>
        <tbody>{allLeads.map((d,i)=>(
          <tr key={i} onClick={()=>setDet(d)} style={{cursor:"pointer",borderBottom:"1px solid "+T.bd,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=dk?"rgba(245,158,11,.02)":"rgba(245,158,11,.015)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"12px 16px",fontSize:11,color:T.txF,fontFamily:"monospace"}}>{i+1}</td>
            <td style={{padding:"12px 16px",fontSize:13,fontWeight:600}}>{d.name}</td>
            <td style={{padding:"12px 16px",fontSize:11.5,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.url?<a href={d.url.startsWith("http")?d.url:"https://"+d.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:T.bl,textDecoration:"none",fontFamily:"monospace"}}>{d.url}</a>:<span style={{color:T.txF}}>—</span>}</td>
            <td style={{padding:"12px 16px",fontSize:12,color:T.txS}}>{d.city||"—"}</td>
            <td style={{padding:"12px 16px"}}>{d.type?<span style={{padding:"3px 10px",borderRadius:6,background:T.bl+"12",color:T.bl,fontSize:11,fontWeight:600}}>{d.type}</span>:""}</td>
            <td style={{padding:"12px 16px"}}>{d.score?<span style={{fontSize:15,fontWeight:800,color:scC(d.score)}}>{d.score}</span>:<span style={{color:T.txF}}>—</span>}</td>
            <td style={{padding:"12px 16px",fontSize:11,color:T.txM,fontFamily:"monospace"}}>{d.ph||"—"}</td>
            <td style={{padding:"12px 16px"}}>{d.src?<span style={{padding:"3px 10px",borderRadius:6,background:T.pr+"12",color:T.pr,fontSize:10.5,fontWeight:600}}>{d.src}</span>:""}</td>
            <td style={{padding:"12px 16px"}}><span style={{padding:"3px 10px",borderRadius:6,background:(SC2[d.stage]||T.txM)+"14",color:SC2[d.stage]||T.txM,fontSize:10.5,fontWeight:600}}>{SL[d.stage]||d.stage}</span></td>
            <td style={{padding:"12px 16px",fontSize:12,color:T.txS}}>{d.owner||"—"}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>}
    {sheetTab!=="leads"&&<div style={{overflow:"auto",maxHeight:"65vh"}}>
      {sheetTabLoading&&<div style={{padding:"60px 40px",textAlign:"center"}}><div style={{width:40,height:40,border:"3px solid "+T.bd,borderTopColor:T.acc,borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px"}}/><div style={{fontSize:15,fontWeight:600,color:T.txS}}>Loading {sheetTab}...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
      {!sheetTabLoading&&!sheetTabData[sheetTab]&&<div style={{padding:"60px 40px",textAlign:"center"}}><div style={{fontSize:48,marginBottom:16,opacity:.15}}>📄</div><div style={{fontSize:16,fontWeight:600,color:T.txS}}>Click to load data</div><div style={{fontSize:13,color:T.txF,marginTop:6}}>Tab "{sheetTab}" will be fetched from Google Sheet</div></div>}
      {sheetTabData[sheetTab]&&<table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr><th style={{fontSize:10,fontWeight:700,color:T.txM,padding:"14px 16px",textAlign:"left",borderBottom:"2px solid "+T.bd,background:dk?"rgba(15,17,23,.95)":"rgba(248,250,252,.95)",position:"sticky",top:0,zIndex:2,fontFamily:"monospace"}}>#</th>
          {sheetTabData[sheetTab].headers.map((h,i)=>(<th key={i} style={{fontSize:10,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:.5,padding:"14px 16px",textAlign:"left",borderBottom:"2px solid "+T.bd,background:dk?"rgba(15,17,23,.95)":"rgba(248,250,252,.95)",whiteSpace:"nowrap",position:"sticky",top:0,zIndex:2,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis"}}>{h||"Col "+(i+1)}</th>))}
        </tr></thead>
        <tbody>{sheetTabData[sheetTab].rows.map((row,i)=>(
          <tr key={i} style={{borderBottom:"1px solid "+T.bd,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=dk?"rgba(255,255,255,.015)":"rgba(0,0,0,.01)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"11px 16px",fontSize:10,color:T.txF,fontFamily:"monospace"}}>{i+1}</td>
            {row.map((cell,j)=>{const isUrl=cell&&(cell.startsWith("http")||cell.startsWith("www.")||cell.includes(".com")||cell.includes(".in")||cell.includes(".org")||cell.includes("maps.google"));const isPhone=cell&&/^\+?\d[\d\s\-]{8,}$/.test(cell.trim());const isEmail=cell&&cell.includes("@")&&cell.includes(".");return(
              <td key={j} style={{padding:"11px 16px",fontSize:12,color:j===0?T.tx:T.txS,fontWeight:j===0?600:400,maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {isUrl?<a href={cell.startsWith("http")?cell:"https://"+cell} target="_blank" rel="noreferrer" style={{color:T.bl,textDecoration:"none"}} title={cell}>{cell.length>40?cell.substring(0,40)+"…":cell}</a>
                :isPhone?<a href={"tel:"+cell.replace(/\s/g,"")} style={{color:T.acc,textDecoration:"none",fontFamily:"monospace"}}>{cell}</a>
                :isEmail?<a href={"mailto:"+cell} style={{color:T.pr,textDecoration:"none"}}>{cell}</a>
                :cell||"—"}
              </td>
            )})}
          </tr>
        ))}</tbody>
      </table>}
    </div>}
  </div>
  {/* Footer */}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px"}}>
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      <span style={{fontSize:12,color:T.txM,fontWeight:500}}>{sheetTab==="leads"?allLeads.length+" leads":sheetTabData[sheetTab]?sheetTabData[sheetTab].rows.length+" rows · "+sheetTabData[sheetTab].headers.length+" columns":"—"}</span>
      {sheetTabData[sheetTab]&&<span style={{padding:"3px 10px",borderRadius:6,background:T.gn+"12",color:T.gn,fontSize:10,fontWeight:600}}>Cached</span>}
    </div>
    <span style={{fontSize:11,color:T.txF,fontFamily:"monospace"}}>Sheet: {SHEET_ID.substring(0,16)}…</span>
  </div>
</div>}


{/* ═══ OTHER PAGES ═══ */}
{["campaigns","tracking","revenue","team","sequences","engine","automations","adintel","notepad","settings"].includes(pg)&&<div style={{display:"flex",flexDirection:"column",gap:24}}>
  {pg!=="engine"&&pg!=="adintel"&&<h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8,textTransform:"capitalize"}}>{pg==="automations"?"Automation Hub":pg}</h1>}

  {pg==="tracking"&&<>
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)",gap:14}}>
      {[{l:"Total Views",v:"156",c:T.yw,s:"all reports"},{l:"Unique Opens",v:"31",c:T.bl,s:"66% open rate"},{l:"Hot Leads (3+)",v:"8",c:T.rd,s:"immediate follow-up"},{l:"Avg Time on Report",v:"3.2m",c:T.gn,s:"per session"},{l:"Never Opened",v:"16",c:T.txM,s:"needs re-send"}].map((k,i)=>(
        <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"24px 20px",boxShadow:T.sh,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:.2}}/>
          <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>{k.l}</div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:-1.5,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:12,color:T.txM,marginTop:8}}>{k.s}</div>
        </div>
      ))}
    </div>
    {/* Open rate by category */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Open Rate by Category</div>
        {[["Clinic","78%",T.gn,78],["Astrologer","62%",T.acc,62],["Restaurant","45%",T.yw,45],["Real Estate","71%",T.bl,71],["Ecommerce","38%",T.rd,38]].map(([c,r,cl,w],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <span style={{fontSize:12,fontWeight:500,width:90,color:T.txS}}>{c}</span>
            <div style={{flex:1,height:8,background:T.el,borderRadius:4,overflow:"hidden"}}><div style={{width:w+"%",height:"100%",background:cl,borderRadius:4,transition:"width .8s"}}/></div>
            <span style={{fontSize:13,fontWeight:700,color:cl,width:40,textAlign:"right"}}>{r}</span>
          </div>
        ))}
      </div>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>View Heatmap (by Time)</div>
        <div style={{display:"grid",gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(6,1fr)",gap:4}}>
          {["9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM","8PM"].map((t2,i)=>{const intensity=[20,45,80,60,30,55,90,75,40,25,15,10][i];return(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{height:40,borderRadius:6,background:T.acc,opacity:intensity/100,marginBottom:4}}/>
              <span style={{fontSize:9,color:T.txF}}>{t2}</span>
            </div>
          )})}
        </div>
        <div style={{fontSize:11,color:T.txM,marginTop:14}}>🔥 Peak viewing: 11 AM & 3 PM — best time to send reports</div>
      </div>
    </div>
    {/* Live feed */}
    <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Live View Feed</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:8,height:8,borderRadius:4,background:T.rd,animation:"pulse 1.5s infinite"}}/><span style={{fontSize:11,color:T.rd,fontWeight:600}}>Live</span></div>
      </div>
      {allLeads.sort((a,b)=>(b.views||0)-(a.views||0)).map((d,i)=>(
        <div key={i} onClick={()=>setDet(d)} className="hov" style={{display:"flex",alignItems:"center",gap:14,padding:"16px 0",borderBottom:"1px solid "+T.bd,cursor:"pointer"}}>
          {d.views>=3?<div style={{position:"relative"}}><div style={{width:12,height:12,borderRadius:6,background:T.rd}}/><div style={{position:"absolute",inset:-4,borderRadius:10,border:"2px solid "+T.rd,animation:"subtlePing 2s infinite"}}/></div>:<div style={{width:12,height:12,borderRadius:6,background:d.views>0?T.yw:T.txF}}/>}
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:600}}>{d.name}</span>
              {B(d.type,T.bl)}
              {B(d.src,T.pr)}
            </div>
            <div style={{fontSize:12,color:T.txM,marginTop:4}}>{d.url} · {d.city} · {d.owner||"Unassigned"}</div>
          </div>
          <div style={{textAlign:"right",marginRight:8}}>
            <div style={{fontSize:22,fontWeight:800,color:d.views>3?T.gn:d.views>0?T.yw:T.txF}}>{d.views}</div>
            <div style={{fontSize:11,color:T.txM}}>{d.lv||"Never"}</div>
          </div>
          {d.views>=3&&<div style={{padding:"6px 12px",borderRadius:8,background:T.rd+"0A",border:"1px solid "+T.rd+"18",fontSize:11,fontWeight:700,color:T.rd}}>🔥 HOT</div>}
          {d.views===0&&<button onClick={e=>{e.stopPropagation();showT("📤 Re-sent to "+d.name)}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+T.acc+"33",background:T.acc+"0A",color:T.acc,fontSize:10.5,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Re-send</button>}
        </div>
      ))}
    </div>
  </>}

  {pg==="revenue"&&<>
    {/* Filters */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd}}>
        {[["all","All Time"],["today","Today"],["week","This Week"],["month","This Month"],["quarter","Quarter"]].map(([v,l])=><button key={v} onClick={()=>setRevDateFilter(v)} style={{padding:"7px 14px",borderRadius:9,border:"none",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",background:revDateFilter===v?T.gn+"18":"transparent",color:revDateFilter===v?T.gn:T.txM}}>{l}</button>)}
      </div>
      <div style={{display:"flex",gap:3,background:dk?T.el:T.ra,borderRadius:12,padding:3,border:"1px solid "+T.bd}}>
        {["all","Maps","FB Ads","Manual"].map(s=><button key={s} onClick={()=>setRevenueFilter(s)} style={{padding:"7px 14px",borderRadius:9,border:"none",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",background:revenueFilter===s?T.pr+"18":"transparent",color:revenueFilter===s?T.pr:T.txM}}>{s==="all"?"All Sources":s}</button>)}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)",gap:14}}>
      {[{l:"Revenue MTD",v:"₹2,40,000",c:T.gn,s:"6 deals closed"},{l:"Pipeline Value",v:"₹12.6L",c:T.bl,s:"34 leads in pipe"},{l:"Avg Deal Size",v:"₹40,000",c:T.acc,s:"across all deals"},{l:"Conversion Rate",v:"4.2%",c:T.yw,s:"from reports sent"},{l:"Revenue/Send",v:"₹140",c:T.pr,s:"per WhatsApp msg"}].map((k,i)=>(
        <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"24px 20px",boxShadow:T.sh,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:.2}}/>
          <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>{k.l}</div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:-1.5,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:12,color:T.txM,marginTop:10}}>{k.s}</div>
        </div>
      ))}
    </div>
    {/* Revenue by category + source */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Revenue by Category</div>
        {[["Clinic","₹1,20,000",T.gn,80,3],["Astrologer","₹80,000",T.acc,53,2],["Restaurant","₹60,000",T.bl,40,1],["Real Estate","₹35,000",T.pk,23,1],["Ecommerce","₹0",T.txM,0,0]].map(([c,r,cl,w,deals],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:500,width:90,color:T.txS}}>{c}</span>
            <div style={{flex:1,height:10,background:T.el,borderRadius:5,overflow:"hidden"}}><div style={{width:Math.max(w,2)+"%",height:"100%",background:cl,borderRadius:5,transition:"width 1s cubic-bezier(.16,1,.3,1)"}}/></div>
            <span style={{fontSize:13,fontWeight:700,width:80,textAlign:"right"}}>{r}</span>
            <span style={{fontSize:10,color:T.txM,width:40,textAlign:"right"}}>{deals} deals</span>
          </div>
        ))}
      </div>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Revenue by Lead Source</div>
        {[["Google Maps","₹1,60,000",T.gn,"67%","4.8% conv"],["Facebook Ads","₹55,000",T.bl,"23%","3.1% conv"],["Manual Lists","₹25,000",T.pr,"10%","2.2% conv"]].map(([src,rev,c,pct,conv],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:i<2?"1px solid "+T.bd:"none"}}>
            <div style={{width:10,height:10,borderRadius:5,background:c}}/>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{src}</div><div style={{fontSize:12,color:T.txM,marginTop:2}}>{pct} of revenue · {conv}</div></div>
            <span style={{fontSize:16,fontWeight:800,color:c}}>{rev}</span>
          </div>
        ))}
      </div>
    </div>
    {/* Deal History + Manual Payment */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>Recent Deals</div>
        {[{n:"Delhi Dental Care",a:"₹35,000",d:"3 Mar",m:"UPI",cat:"Clinic"},{n:"GreenLeaf Properties",a:"₹35,000",d:"28 Feb",m:"Bank Transfer",cat:"Real Estate"},{n:"Sharma Astrology",a:"₹20,000",d:"25 Feb",m:"Cash",cat:"Astrologer"},{n:"Pure Ayurveda",a:"₹15,000",d:"22 Feb",m:"UPI",cat:"Clinic"}].map((deal,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:i<3?"1px solid "+T.bd:"none"}}>
            <div style={{width:40,height:40,borderRadius:12,background:T.gn+"0A",border:"1px solid "+T.gn+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💰</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{deal.n}</div><div style={{fontSize:12,color:T.txM,marginTop:2}}>{deal.d} · {deal.m} · {deal.cat}</div></div>
            <span style={{fontSize:16,fontWeight:800,color:T.gn}}>{deal.a}</span>
          </div>
        ))}
      </div>
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:22}}>💰 Record Manual Payment</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Lead Name</div><select style={IS}>{allLeads.map(l=><option key={l.id}>{l.name}</option>)}</select></div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12}}>
            <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Amount (₹)</div><input placeholder="25000" style={IS}/></div>
            <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Method</div><select style={IS}><option>UPI</option><option>Cash</option><option>Bank Transfer</option><option>Razorpay</option><option>PhonePe</option><option>Cheque</option></select></div>
          </div>
          <div><div style={{fontSize:12,color:T.txM,marginBottom:6}}>Notes</div><input placeholder="Advance for website project" style={IS}/></div>
          <button onClick={()=>showT("✅ Payment recorded!")} style={{padding:"14px",borderRadius:12,border:"none",background:T.gn,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Record Payment</button>
        </div>
      </div>
    </div>
    {/* AI Insights */}
    <div className="hov" style={{background:`linear-gradient(135deg,${T.acc}06,${T.pr}06)`,border:"1px solid "+T.acc+"18",borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{fontSize:11,fontWeight:600,color:T.acc,textTransform:"uppercase",letterSpacing:1.5,marginBottom:20}}>🤖 AI Revenue Insights</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:12}}>
        {["📊 Clinics convert 3× better than Restaurants — shift budget there","🕐 Tuesday 11 AM sends get 2× more replies than Friday","📍 Delhi leads close 40% faster than Mumbai leads","💡 Score < 30 leads convert at 8% — they NEED your services","🔥 Leads viewing 3+ times close at 35% — follow up IMMEDIATELY","📱 62% of report views on mobile — ensure mobile-perfect templates"].map((t,i)=>(
          <div key={i} style={{padding:"14px 16px",borderRadius:14,background:T.sf,border:"1px solid "+T.bd,fontSize:13,color:T.txS,lineHeight:1.65}}>{t}</div>
        ))}
      </div>
    </div>
    {/* Expense Tracker */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>💸 Ad Spend vs Revenue (ROI Tracker)</div>
        <button onClick={()=>showT("➕ Add expense entry")} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+T.bd,background:T.sf,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>+ Add Expense</button>
      </div>
      <div style={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>{["Source","Ad Spend","Leads","Cost/Lead","Revenue","ROI","Month"].map(h=><th key={h} style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,padding:"12px 16px",textAlign:"left",borderBottom:"1.5px solid "+T.bd,background:dk?T.el:T.ra}}>{h}</th>)}</tr></thead>
          <tbody>{expenses.map((e,i)=>{const roiNum=e.roi==="∞"?9999:parseFloat(e.roi);return(
            <tr key={i}>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd,fontWeight:600,fontSize:13}}>{e.source}</td>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd,color:T.rd,fontWeight:600}}>{e.spent}</td>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd,fontSize:14,fontWeight:700}}>{e.leads}</td>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd,color:T.txS}}>{e.cost}</td>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd,color:T.gn,fontWeight:700}}>{e.revenue}</td>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd}}><span style={{padding:"4px 12px",borderRadius:8,fontWeight:700,fontSize:12,background:roiNum>500?T.gn+"14":roiNum>200?T.yw+"14":T.rd+"14",color:roiNum>500?T.gn:roiNum>200?T.yw:T.rd}}>{e.roi}</span></td>
              <td style={{padding:"14px 16px",borderBottom:"1px solid "+T.bd,color:T.txM,fontSize:12}}>{e.month}</td>
            </tr>
          )})}</tbody>
          <tfoot><tr>
            <td style={{padding:"14px 16px",fontWeight:700,borderTop:"2px solid "+T.bd}}>Total</td>
            <td style={{padding:"14px 16px",fontWeight:700,color:T.rd,borderTop:"2px solid "+T.bd}}>₹22,500</td>
            <td style={{padding:"14px 16px",fontWeight:700,borderTop:"2px solid "+T.bd}}>138</td>
            <td style={{padding:"14px 16px",fontWeight:600,color:T.txS,borderTop:"2px solid "+T.bd}}>₹163/lead</td>
            <td style={{padding:"14px 16px",fontWeight:700,color:T.gn,borderTop:"2px solid "+T.bd}}>₹3,20,000</td>
            <td style={{padding:"14px 16px",fontWeight:700,borderTop:"2px solid "+T.bd}}><span style={{padding:"4px 12px",borderRadius:8,background:T.gn+"14",color:T.gn,fontWeight:700,fontSize:13}}>1322%</span></td>
            <td style={{padding:"14px 16px",borderTop:"2px solid "+T.bd}}></td>
          </tr></tfoot>
        </table>
      </div>
      <div style={{marginTop:16,padding:16,borderRadius:14,background:T.gn+"06",border:"1px solid "+T.gn+"18",fontSize:13,color:T.gn,fontWeight:600}}>
        📊 Insight: Google Maps leads cost ₹0 and bring 50% revenue — maximize this source. Meta Ads ROI is strong at 567% — scale budget.
      </div>
    </div>
    {/* AI WhatsApp Briefing Config */}
    <div className="hov" style={{background:`linear-gradient(135deg,${T.acc}06,${T.pr}04)`,border:"1px solid "+T.acc+"18",borderRadius:18,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:42,height:42,borderRadius:14,background:accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
          <div><div style={{fontSize:16,fontWeight:700}}>AI Daily Briefing</div><div style={{fontSize:12,color:T.txS,marginTop:2}}>Get a WhatsApp summary every morning</div></div>
        </div>
        <div style={{width:48,height:26,borderRadius:13,background:T.gn,cursor:"pointer",padding:3}}>
          <div style={{width:20,height:20,borderRadius:10,background:"#fff",boxShadow:"0 2px 4px rgba(0,0,0,.15)",transform:"translateX(22px)",transition:"transform .3s"}}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:14}}>
        <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:8}}>Send Time</div><select style={{...IS,fontSize:12,padding:"10px 14px"}}><option>9:00 AM IST</option><option>8:00 AM IST</option><option>10:00 AM IST</option></select></div>
        <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:8}}>Send To</div><input defaultValue="+91-98765XXXXX" style={{...IS,fontSize:12,padding:"10px 14px"}}/></div>
        <div><div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:8}}>Include</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{["Pipeline","Revenue","Hot Leads","Tasks"].map(t2=><span key={t2} style={{padding:"4px 10px",borderRadius:6,background:T.gn+"14",color:T.gn,fontSize:10.5,fontWeight:600}}>{t2}</span>)}</div></div>
      </div>
      <div style={{marginTop:16,padding:16,borderRadius:14,background:T.sf,border:"1px solid "+T.bd,fontSize:12,color:T.txS,lineHeight:1.8,fontStyle:"italic"}}>
        <strong style={{color:T.acc}}>Preview:</strong> "Good morning Sahil! 📊 Yesterday: 12 reports sent, 8 opened (67%), 2 replied. 🔥 3 hot leads need follow-up. 💰 MTD: ₹2.4L from 6 deals. 📞 Today: 2 calls scheduled. Priority: Follow up Delhi Dental (opened 8×)."
      </div>
    </div>
  </>}

  {pg==="campaigns"&&<>
    {/* Campaign KPIs */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)",gap:14}}>
      {[{l:"Total Sent",v:"245",c:T.bl},{l:"Delivered",v:"240",c:T.bl,s:"98%"},{l:"Read",v:"154",c:T.yw,s:"63%"},{l:"Replied",v:"25",c:T.gn,s:"10.2%"},{l:"Opt-out",v:"3",c:T.rd,s:"1.2%"}].map((k,i)=>(
        <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"24px 20px",boxShadow:T.sh,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:.2}}/>
          <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>{k.l}</div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:-1.5,lineHeight:1}}>{k.v}</div>
          {k.s&&<div style={{fontSize:12,color:T.txM,marginTop:8}}>{k.s}</div>}
        </div>
      ))}
    </div>
    {/* Individual Campaigns */}
    {[
      {n:"Astrologer Outreach — Delhi NCR",s:"live",tpl:"Astro Hindi v2",sn:120,dl:118,rd:74,rp:14,optout:1,created:"Today 10:30 AM",schedule:"10 AM-6 PM IST",rate:"50/hr"},
      {n:"Clinic Cold Reach — Pune + Delhi",s:"done",tpl:"Clinic Intro v1",sn:80,dl:78,rd:52,rp:8,optout:2,created:"Yesterday 11 AM",schedule:"Completed",rate:"50/hr"},
      {n:"Restaurant Deep Push — Mumbai",s:"paused",tpl:"Restaurant Urgency v1",sn:45,dl:44,rd:28,rp:3,optout:0,created:"2 days ago",schedule:"Paused by admin",rate:"30/hr"},
    ].map((c,i)=>(
      <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:0,boxShadow:T.sh,overflow:"hidden"}}>
        {/* Campaign header */}
        <div style={{padding:"22px 28px",borderBottom:"1px solid "+T.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>{c.n}</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {B(c.s,c.s==="live"?T.gn:c.s==="paused"?T.yw:T.txM)}
              <span style={{fontSize:12,color:T.txM}}>Template: {c.tpl}</span>
              <span style={{fontSize:12,color:T.txM}}>· {c.created}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {c.s==="live"&&<button onClick={()=>showT("⏸ Campaign paused")} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+T.yw+"33",background:T.yw+"0A",color:T.yw,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>⏸ Pause</button>}
            {c.s==="paused"&&<button onClick={()=>showT("▶ Campaign resumed")} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+T.gn+"33",background:T.gn+"0A",color:T.gn,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>▶ Resume</button>}
            <button onClick={()=>showT("📊 Exporting CSV…")} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+T.bd,background:T.sf,color:T.txS,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Export</button>
          </div>
        </div>
        {/* Stats */}
        <div style={{padding:"22px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(6,1fr)",gap:10}}>
            {[["Sent",c.sn,T.bl],["Delivered",c.dl,T.bl],["Read",c.rd,T.yw],["Replied",c.rp,T.gn],["Rate",Math.round(c.rp/c.sn*100)+"%",T.acc],["Opt-out",c.optout,T.rd]].map(([l,v,cl],j)=>(
              <div key={j} style={{textAlign:"center",padding:"14px 8px",background:T.el,borderRadius:14,border:"1px solid "+T.bd}}>
                <div style={{fontSize:22,fontWeight:800,color:cl}}>{v}</div>
                <div style={{fontSize:10,color:T.txM,marginTop:6}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{marginTop:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.txM,marginBottom:6}}>
              <span>Delivery Progress</span><span>{c.dl}/{c.sn} ({Math.round(c.dl/c.sn*100)}%)</span>
            </div>
            <div style={{height:6,background:T.el,borderRadius:3,overflow:"hidden"}}>
              <div style={{width:Math.round(c.dl/c.sn*100)+"%",height:"100%",background:c.s==="live"?`linear-gradient(90deg,${T.bl},${T.gn})`:T.txM,borderRadius:3,transition:"width 1s"}}/>
            </div>
          </div>
          {/* Meta */}
          <div style={{display:"flex",gap:16,marginTop:14,fontSize:12,color:T.txM}}>
            <span>⏰ Schedule: {c.schedule}</span>
            <span>🚀 Rate: {c.rate}</span>
          </div>
        </div>
      </div>
    ))}
    {/* New Campaign Button */}
    <button onClick={()=>showT("🆕 New campaign — select leads first from Leads page")} style={{padding:"18px",borderRadius:16,border:"2px dashed "+T.bd,background:"transparent",color:T.txM,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:ff,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>+ Create New Campaign</button>
  </>}

  {pg==="team"&&<>
    {/* Team KPIs */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(4,1fr)",gap:14}}>
      {[{l:"Team Revenue",v:"₹2.4L",c:T.gn,s:"this month"},{l:"Deals Closed",v:"8",c:T.acc,s:"by all members"},{l:"Avg Response",v:"2.4h",c:T.yw,s:"time to first reply"},{l:"Active Leads",v:"10",c:T.bl,s:"in pipeline"}].map((k,i)=>(
        <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"24px 20px",boxShadow:T.sh,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:.2}}/>
          <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>{k.l}</div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:-1.5,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:12,color:T.txM,marginTop:8}}>{k.s}</div>
        </div>
      ))}
    </div>
    {/* Team Members */}
    {[
      {n:"Sahil",role:"Founder",leads:3,active:2,deals:5,rev:"₹2,10,000",conv:"16.7%",avgTime:"1.2h",tasks:[{t:"Follow up Delhi Dental",due:"Today"},{t:"Send proposal to Pure Ayurveda",due:"Tomorrow"}]},
      {n:"Rahul",role:"Sales Executive",leads:4,active:3,deals:2,rev:"₹55,000",conv:"8.3%",avgTime:"3.1h",tasks:[{t:"Call Sharma Astrology",due:"Today"},{t:"WhatsApp Spice Route",due:"Today"}]},
      {n:"Priya",role:"Sales Executive",leads:3,active:2,deals:1,rev:"₹35,000",conv:"5.5%",avgTime:"2.8h",tasks:[{t:"Send report to Pure Ayurveda",due:"Today"},{t:"Follow up GreenLeaf",due:"Tomorrow"}]},
    ].map((m,i)=>(
      <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:0,boxShadow:T.sh,overflow:"hidden"}}>
        <div style={{padding:"22px 28px",borderBottom:"1px solid "+T.bd,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:16,background:accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff"}}>{m.n[0]}</div>
          <div style={{flex:1}}><div style={{fontSize:18,fontWeight:700}}>{m.n}</div><div style={{fontSize:13,color:T.txM,marginTop:2}}>{m.role}</div></div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>showT("📋 Assigning leads to "+m.n)} style={{padding:"8px 16px",borderRadius:10,border:"1px solid "+T.bd,background:T.sf,color:T.txS,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Assign Leads</button>
          </div>
        </div>
        <div style={{padding:"22px 28px"}}>
          <div style={{display:"grid",gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(6,1fr)",gap:10,marginBottom:20}}>
            {[["Total Leads",m.leads,T.bl],["Active",m.active,T.yw],["Deals Won",m.deals,T.gn],["Revenue",m.rev,T.acc],["Conv Rate",m.conv,parseFloat(m.conv)>10?T.gn:T.yw],["Avg Response",m.avgTime,parseFloat(m.avgTime)<2?T.gn:T.yw]].map(([l,v,c],j)=>(
              <div key={j} style={{textAlign:"center",padding:"12px 6px",background:T.el,borderRadius:14,border:"1px solid "+T.bd}}>
                <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
                <div style={{fontSize:9.5,color:T.txM,marginTop:5}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Tasks */}
          <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Current Tasks</div>
          {m.tasks.map((task,j)=>(
            <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:j<m.tasks.length-1?"1px solid "+T.bd:"none"}}>
              <div style={{width:20,height:20,borderRadius:6,border:"2px solid "+T.bd,cursor:"pointer",flexShrink:0}}/>
              <span style={{fontSize:13,color:T.tx,flex:1}}>{task.t}</span>
              {B(task.due,task.due==="Today"?T.acc:T.txM)}
            </div>
          ))}
          {/* Assigned Leads */}
          <div style={{fontSize:10.5,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,marginTop:16}}>Assigned Leads</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {allLeads.filter(l=>l.owner===m.n).map((l,j)=>(
              <div key={j} onClick={()=>setDet(l)} style={{padding:"8px 14px",borderRadius:10,background:T.el,border:"1px solid "+T.bd,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                <span style={{fontWeight:700,color:scC(l.score)}}>{l.score}</span>
                <span style={{fontWeight:500}}>{l.name}</span>
                {B(SL[l.stage],SC2[l.stage])}
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </>}

  {pg==="sequences"&&<div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>{[{n:"Standard 5-Day",st:5,ac:34,rt:"15%"},{n:"Aggressive 3-Day",st:3,ac:12,rt:"20%"}].map((s,i)=><div key={i} className="hov" style={{padding:20,background:T.el,borderRadius:18,border:"1px solid "+T.bd,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:16,fontWeight:600}}>{s.n}</div>{B(s.rt,T.gn)}</div><div style={{fontSize:13,color:T.txM}}>{s.st} steps · {s.ac} active</div></div>)}</div>}

  {pg==="sequences"&&<div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>{[{n:"Standard 5-Day",st:5,ac:34,rt:"15%"},{n:"Aggressive 3-Day",st:3,ac:12,rt:"20%"}].map((s,i)=><div key={i} className="hov" style={{padding:20,background:T.el,borderRadius:18,border:"1px solid "+T.bd,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:16,fontWeight:600}}>{s.n}</div>{B(s.rt,T.gn)}</div><div style={{fontSize:13,color:T.txM}}>{s.st} steps · {s.ac} active</div></div>)}</div>}

  {/* ═══ AUTOMATIONS HUB ═══ */}
  {pg==="automations"&&<div style={{display:"flex",flexDirection:"column",gap:22}}>
    <p style={{fontSize:15,color:T.txS,marginTop:-16}}>When a lead arrives from any source — automatically send first message + start drip campaign.</p>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:mob?"repeat(2,1fr)":"repeat(5,1fr)",gap:14}}>
      {[{l:"Today Incoming",v:"23",c:T.bl,s:"from all sources"},{l:"Auto-Sent",v:"21",c:T.gn,s:"WhatsApp + Email"},{l:"Drips Active",v:"34",c:T.acc,s:"across all campaigns"},{l:"Auto-Replied",v:"5",c:T.pr,s:"drip stopped"},{l:"Sources Active",v:autoRules.filter(r=>r.enabled).length.toString(),c:T.gn,s:"of "+autoRules.length}].map((k,i)=>(
        <div key={i} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:"22px 18px",boxShadow:T.sh,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.c,opacity:.2}}/>
          <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>{k.l}</div>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:-1.5,lineHeight:1}}>{k.v}</div>
          <div style={{fontSize:11,color:T.txM,marginTop:8}}>{k.s}</div>
        </div>
      ))}
    </div>

    {/* Source Rules + Live Feed */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 400px",gap:18}}>
      {/* Rules */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Source Routing Rules</div>
          <button onClick={()=>showT("➕ Add new source rule")} style={{padding:"8px 16px",borderRadius:10,border:"none",background:accG,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>+ Add Source</button>
        </div>

        {autoRules.map((rule,i)=>(
          <div key={rule.id} className="hov" style={{background:T.sf,border:"1px solid "+(rule.enabled?T.bd:T.rd+"22"),borderRadius:18,overflow:"hidden",boxShadow:T.sh,opacity:rule.enabled?1:.6}}>
            {/* Rule Header */}
            <div style={{padding:"20px 24px",borderBottom:"1px solid "+T.bd,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:42,height:42,borderRadius:14,background:rule.source==="Meta Ads"?T.bl+"12":rule.source==="Google Ads"?T.gn+"12":rule.source==="Website Form"?T.acc+"12":rule.source==="Landing Page"?T.pr+"12":T.txM+"12",border:"1px solid "+(rule.source==="Meta Ads"?T.bl+"22":rule.source==="Google Ads"?T.gn+"22":T.acc+"22"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {rule.source==="Meta Ads"?"📱":rule.source==="Google Ads"?"🔍":rule.source==="Website Form"?"🌐":rule.source==="Landing Page"?"📄":"✏️"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700}}>{rule.source}</div>
                <div style={{fontSize:12,color:T.txM,marginTop:2}}>{rule.notes}</div>
              </div>
              <div onClick={()=>{const updated=autoRules.map(r=>r.id===rule.id?{...r,enabled:!r.enabled}:r);setAutoRules(updated);showT(rule.enabled?"⏸ "+rule.source+" paused":"▶ "+rule.source+" activated")}} style={{width:48,height:26,borderRadius:13,background:rule.enabled?T.gn:T.txF,cursor:"pointer",padding:3,transition:"all .3s"}}>
                <div style={{width:20,height:20,borderRadius:10,background:"#fff",boxShadow:"0 2px 4px rgba(0,0,0,.15)",transform:rule.enabled?"translateX(22px)":"translateX(0)",transition:"transform .3s cubic-bezier(.68,-.55,.27,1.55)"}}/>
              </div>
            </div>

            {/* Rule Config */}
            <div style={{padding:"20px 24px"}}>
              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                {/* First Action */}
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>First Action</div>
                  <div style={{display:"flex",gap:4}}>
                    {[["whatsapp","📤 WA",T.gn],["email","📧 Email",T.bl],["both","📤📧 Both",T.acc],["none","⏸ None",T.txM]].map(([v,l,c])=>(
                      <div key={v} onClick={()=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,firstAction:v}:r))} style={{padding:"6px 10px",borderRadius:8,fontSize:10.5,fontWeight:600,cursor:"pointer",background:rule.firstAction===v?c+"14":"transparent",color:rule.firstAction===v?c:T.txF,border:"1px solid "+(rule.firstAction===v?c+"22":T.bd)}}>{l}</div>
                    ))}
                  </div>
                </div>
                {/* Template */}
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>WA Template</div>
                  <select value={rule.firstTemplate} onChange={e=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,firstTemplate:e.target.value}:r))} style={{...IS,fontSize:12,padding:"8px 12px"}}>
                    <option>Initial Outreach — Hindi</option><option>Follow-up — Day 1 Soft</option><option>Urgency Push</option><option>Pricing Response</option><option>Invite to Meeting</option>
                  </select>
                </div>
                {/* Drip Campaign */}
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>Drip Campaign</div>
                  <select value={rule.drip} onChange={e=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,drip:e.target.value}:r))} style={{...IS,fontSize:12,padding:"8px 12px"}}>
                    <option>Standard 5-Day</option><option>Aggressive 3-Day</option><option>Gentle 7-Day</option><option value="none">No Drip</option>
                  </select>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:12}}>
                {/* Delay */}
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>Send Delay</div>
                  <select value={rule.delay} onChange={e=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,delay:e.target.value}:r))} style={{...IS,fontSize:12,padding:"8px 12px"}}>
                    <option value="instant">⚡ Instant</option><option value="5min">5 minutes</option><option value="15min">15 minutes</option><option value="1hr">1 hour</option><option value="schedule">Next send window</option>
                  </select>
                </div>
                {/* Assign To */}
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>Assign To</div>
                  <select value={rule.assignTo} onChange={e=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,assignTo:e.target.value}:r))} style={{...IS,fontSize:12,padding:"8px 12px"}}>
                    <option value="auto">🤖 Auto (round-robin)</option><option>Sahil</option><option>Rahul</option><option>Priya</option>
                  </select>
                </div>
                {/* Category */}
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>Category Filter</div>
                  <select value={rule.category} onChange={e=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,category:e.target.value}:r))} style={{...IS,fontSize:12,padding:"8px 12px"}}>
                    {CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Webhook */}
              <div style={{marginTop:14}}>
                <div style={{fontSize:11,fontWeight:600,color:T.txM,marginBottom:6}}>Webhook URL (n8n / Zapier)</div>
                <input value={rule.webhook} onChange={e=>setAutoRules(p=>p.map(r=>r.id===rule.id?{...r,webhook:e.target.value}:r))} placeholder="https://n8n.example.com/webhook/…" style={{...IS,fontSize:12,padding:"8px 12px",fontFamily:"monospace"}}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Incoming Feed */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Live Incoming</div>
            <div style={{width:8,height:8,borderRadius:4,background:T.gn,animation:"pulse 1.5s infinite"}}/>
          </div>
        </div>
        <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,boxShadow:T.sh,overflow:"hidden"}}>
          {autoLive.map((lead,i)=>(
            <div key={lead.id} className="hov" style={{padding:"18px 22px",borderBottom:"1px solid "+T.bd,display:"flex",gap:14,alignItems:"flex-start",animation:`slideIn .3s ease ${i*.08}s both`}}>
              <div style={{width:40,height:40,borderRadius:14,background:lead.source==="Meta Ads"?T.bl+"12":lead.source==="Google Ads"?T.gn+"12":T.acc+"12",border:"1px solid "+(lead.source==="Meta Ads"?T.bl+"22":lead.source==="Google Ads"?T.gn+"22":T.acc+"22"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {lead.source==="Meta Ads"?"📱":lead.source==="Google Ads"?"🔍":"🌐"}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:14,fontWeight:600}}>{lead.name}</div>
                  <span style={{fontSize:10,color:T.txF}}>{lead.time}</span>
                </div>
                <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
                  {B(lead.source,lead.source==="Meta Ads"?T.bl:lead.source==="Google Ads"?T.gn:T.acc)}
                  {B(lead.city,T.txM)}
                  {lead.status==="wa_sent"&&B("📤 WA Sent",T.gn)}
                  {lead.status==="email_sent"&&B("📧 Email Sent",T.bl)}
                  {lead.status==="both_sent"&&B("📤📧 Both Sent",T.acc)}
                  {lead.status==="replied"&&B("💬 Replied!",T.pr)}
                </div>
                <div style={{fontSize:11,color:T.txM,marginTop:6}}>Drip: {lead.drip} · {lead.phone}</div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{background:T.acc+"06",border:"1px solid "+T.acc+"18",borderRadius:18,padding:22}}>
          <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:10}}>⚡ How it works</div>
          <div style={{fontSize:12,color:T.txS,lineHeight:1.8}}>
            1. Lead fills form on your Meta Ad / Google Ad / Website<br/>
            2. Webhook sends lead data to your n8n<br/>
            3. n8n pushes to this dashboard via API<br/>
            4. Rules check → source matched → auto-send WhatsApp/Email<br/>
            5. Drip campaign starts automatically<br/>
            6. Lead replies → drip stops → notification to you
          </div>
        </div>

        {/* Webhook endpoints */}
        <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:22,boxShadow:T.sh}}>
          <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Your Webhook Endpoints</div>
          {[["Meta Lead Ads","POST /api/leads/meta"],["Google Ads","POST /api/leads/google"],["Website Form","POST /api/leads/website"],["Custom / Zapier","POST /api/leads/custom"]].map(([s,url],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<3?"1px solid "+T.bd:"none"}}>
              <span style={{fontSize:12,fontWeight:600,color:T.txS,width:120}}>{s}</span>
              <code style={{fontSize:11,color:T.acc,background:T.acc+"08",padding:"4px 10px",borderRadius:6,fontFamily:"monospace",flex:1}}>{url}</code>
              <button onClick={()=>showT("📋 Copied!")} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+T.bd,background:T.sf,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txM}}>Copy</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>}

  {pg==="engine"&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {/* Hero Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:T.acc,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>— Google Maps Lead Engine —</div>
        <h1 style={{fontSize:30,fontWeight:800,letterSpacing:-1,lineHeight:1.2,marginBottom:6}}>Hunt Leads<br/>Across <span style={{color:T.acc}}>All India</span></h1>
        <p style={{fontSize:13,color:T.txM,maxWidth:400,lineHeight:1.6}}>Select any city or entire state — our grid engine covers every corner and delivers enriched leads with phone & website to your Google Sheet.</p>
      </div>
      {n8nMaps?<span style={{padding:"8px 18px",borderRadius:10,background:T.gn+"0A",border:"1px solid "+T.gn+"18",fontSize:12,fontWeight:600,color:T.gn,display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:4,background:T.gn}}/>n8n Connected</span>:<span style={{padding:"8px 18px",borderRadius:10,background:T.yw+"0A",border:"1px solid "+T.yw+"18",fontSize:12,fontWeight:600,color:T.yw}}>⚠ Set webhook in Settings</span>}
    </div>

    {/* Stats from Sheet */}
    <div style={{display:"flex",gap:2,background:T.sf,border:"1px solid "+T.bd,borderRadius:16,overflow:"hidden"}}>
      {[{l:"REQUESTS",v:sheetTabData["Form Request"]?sheetTabData["Form Request"].rows.length:"—"},{l:"COMPLETED",v:sheetTabData["Form Request"]?sheetTabData["Form Request"].rows.filter(r=>(r[7]||"").toUpperCase()==="DONE").length:"—"},{l:"MODE",v:"⚡",sub:"Auto"}].map((s,i)=>(
        <div key={i} style={{flex:1,textAlign:"center",padding:"18px 12px",borderRight:i<2?"1px solid "+T.bd:"none"}}>
          <div style={{fontSize:26,fontWeight:800,color:i===2?T.acc:T.tx}}>{s.v}</div>
          <div style={{fontSize:10,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginTop:4}}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:18}}>
      {/* Request Form */}
      <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:28,boxShadow:T.sh}}>
        <div style={{fontSize:11,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:20}}>New Request</div>
        
        {/* City / State Toggle */}
        <div style={{display:"flex",background:dk?T.el:T.ra,borderRadius:14,padding:4,gap:4,marginBottom:22,border:"1px solid "+T.bd}}>
          {[["city","🏙 City"],["state","🗺 State"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setEngineType(v);setEngineLoc(v==="city"?"Delhi":"Delhi")}} style={{flex:1,padding:"12px",borderRadius:10,border:engineType===v?"2px solid "+T.acc:"2px solid transparent",fontSize:13,fontWeight:700,fontFamily:ff,cursor:"pointer",background:engineType===v?T.sf:"transparent",color:engineType===v?T.tx:T.txM,boxShadow:engineType===v?T.sh:"none",transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {/* Location */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.acc}}/>{engineType==="city"?"City":"State"}
          </div>
          <select value={engineLoc} onChange={e=>setEngineLoc(e.target.value)} style={{...IS,fontSize:14}}>
            <option value="">Select {engineType}…</option>
            {(engineType==="city"?CITIES:STATES).map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Keyword */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.acc}}/>Keyword
          </div>
          <input value={engineKw} onChange={e=>setEngineKw(e.target.value)} placeholder="e.g. interior designer, hospital, gym" style={{...IS,fontSize:14}}/>
        </div>

        {/* Quantity */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Quantity (approx leads)</div>
          <input type="number" value={engineQty} onChange={e=>setEngineQty(e.target.value)} style={{...IS,width:140,fontSize:14}}/>
        </div>

        {/* Submit */}
        <button disabled={!engineKw||!engineLoc||!n8nMaps||engineSending} onClick={async()=>{
          if(!n8nMaps){showT("⚠ Set n8n Maps webhook URL in Settings first");return}
          setEngineSending(true);
          try{
            const r=await fetch(n8nMaps,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({keyword:engineKw,location:engineLoc,quantity:parseInt(engineQty)||60})});
            if(r.ok){showT("🚀 Lead hunt started! "+engineKw+" in "+engineLoc);setEngineKw("");fetchSheetTab("Form Request")}
            else showT("❌ Failed — check n8n webhook")
          }catch(e){showT("❌ "+e.message)}
          setEngineSending(false);
        }} style={{width:"100%",padding:18,borderRadius:14,border:"none",background:(!engineKw||!engineLoc||!n8nMaps)?dk?"#333":"#ccc":accG,color:"#fff",fontSize:16,fontWeight:700,cursor:(!engineKw||!engineLoc||!n8nMaps)?"not-allowed":"pointer",fontFamily:ff,opacity:engineSending?.6:1,transition:"all .2s",boxShadow:engineKw&&n8nMaps?`0 6px 24px ${T.acc}33`:"none"}}>
          {engineSending?"⏳ Sending to n8n...":"🚀 Start Lead Hunt"}
        </button>
      </div>

      {/* Live Request History */}
      <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:28,boxShadow:T.sh,display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>Request History</div>
          <button onClick={async()=>{showT("🔄 Loading...");await fetchSheetTab("Form Request")}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+T.bd,background:"transparent",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>↻ Refresh</button>
        </div>
        <div style={{flex:1,overflow:"auto",maxHeight:420}}>
          {!sheetTabData["Form Request"]&&<div style={{padding:40,textAlign:"center",color:T.txM,fontSize:13}}>Click Refresh to load requests from Sheet</div>}
          {sheetTabData["Form Request"]&&sheetTabData["Form Request"].rows.slice(-20).reverse().map((row,i)=>{
            const kw=row[0]||"";const loc=row[1]||"";const status=(row[7]||"").toUpperCase();const done=row[8]||"0";
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 0",borderBottom:"1px solid "+T.bd,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background=T.acc+"04"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{width:34,height:34,borderRadius:10,background:status==="DONE"?T.gn+"0A":status==="PENDING"?T.acc+"0A":T.txF+"08",border:"1px solid "+(status==="DONE"?T.gn:status==="PENDING"?T.acc:T.txF)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{status==="DONE"?"✅":status==="PENDING"?"⏳":"📋"}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{kw}</div><div style={{fontSize:11,color:T.txM,marginTop:2}}>{loc}</div></div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {status==="DONE"&&<div style={{fontSize:18,fontWeight:800,color:T.gn}}>{done}</div>}
                {status==="PENDING"&&<div style={{fontSize:11,color:T.acc,fontWeight:600}}>Processing…</div>}
                {status!==""&&status!=="DONE"&&status!=="PENDING"&&<div style={{fontSize:11,color:T.txM}}>{status}</div>}
                <div style={{fontSize:10,color:T.txM}}>{status==="DONE"?"leads":""}</div>
              </div>
            </div>)
          })}
        </div>
      </div>
    </div>
  </div>}

  {pg==="adintel"&&<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><h1 style={{fontSize:26,fontWeight:800,letterSpacing:-.8,marginBottom:4}}>Ad Intelligence</h1><p style={{fontSize:13,color:T.txM}}>Google Ads competitor research → n8n + SerpAPI</p></div>
      {n8nAds?<span style={{padding:"6px 14px",borderRadius:8,background:T.gn+"0A",border:"1px solid "+T.gn+"18",fontSize:11,fontWeight:600,color:T.gn}}>● n8n Connected</span>:<span style={{padding:"6px 14px",borderRadius:8,background:T.rd+"0A",border:"1px solid "+T.rd+"18",fontSize:11,fontWeight:600,color:T.rd}}>⚠ Set webhook in Settings</span>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:16}}>
      {/* Search Form */}
      <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:20}}>New Search</div>
        <div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:T.txS,marginBottom:6}}>Keyword / Service</div><input value={adKw} onChange={e=>setAdKw(e.target.value)} placeholder="e.g. advocate, digital marketing, hospital" style={IS}/></div>
        <div style={{marginBottom:20}}><div style={{fontSize:12,fontWeight:600,color:T.txS,marginBottom:6}}>Location</div><select value={adLoc} onChange={e=>setAdLoc(e.target.value)} style={IS}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
        <button disabled={!adKw||!n8nAds||adSending} onClick={async()=>{
          if(!n8nAds){showT("⚠ Set n8n Google Ads webhook URL in Settings first");return}
          setAdSending(true);
          try{
            const r=await fetch(n8nAds,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows:[{keyword:adKw,location:adLoc}]})});
            if(r.ok){showT("🔍 Ad search queued! "+adKw+" in "+adLoc+" — n8n will process in 5 min");setAdKw("")}
            else showT("❌ Failed — check n8n webhook")
          }catch(e){showT("❌ Error: "+e.message)}
          setAdSending(false);
        }} style={{width:"100%",padding:16,borderRadius:14,border:"none",background:(!adKw||!n8nAds)?"#555":`linear-gradient(135deg,${T.pr},#a78bfa)`,color:"#fff",fontSize:15,fontWeight:700,cursor:(!adKw||!n8nAds)?"not-allowed":"pointer",fontFamily:ff,opacity:adSending?.6:1}}>
          {adSending?"⏳ Sending...":"🔍 Find Competitor Ads"}
        </button>
        {!n8nAds&&<div style={{marginTop:12,padding:12,borderRadius:10,background:T.yw+"0A",border:"1px solid "+T.yw+"18",fontSize:12,color:T.yw}}>⚠ Go to Settings → set "n8n Google Ads Webhook URL" to connect</div>}
      </div>
      {/* Search History from Sheet */}
      <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:24,boxShadow:T.sh}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700}}>Search History</div>
          <button onClick={async()=>{showT("🔄 Loading...");await fetchSheetTab("Google Ads Form Request");setAdsRequests(true)}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid "+T.bd,background:T.sf,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:ff,color:T.txS}}>↻ Refresh</button>
        </div>
        {!sheetTabData["Google Ads Form Request"]&&<div style={{padding:30,textAlign:"center",color:T.txM,fontSize:13}}>Click Refresh to load from Google Sheet</div>}
        {sheetTabData["Google Ads Form Request"]&&<div style={{maxHeight:400,overflow:"auto"}}>
          {sheetTabData["Google Ads Form Request"].rows.slice(-15).reverse().map((row,i)=>{
            const kw=row[0]||"";const loc=row[1]||"";const status=row[2]||"";const adsFound=row[3]||"";const lastSearch=row[4]||"";
            const isDone=status.toLowerCase().includes("found")||status.toLowerCase().includes("done");
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.bd}}>
              <div style={{width:36,height:36,borderRadius:10,background:isDone?T.pr+"0A":status.toLowerCase()==="pending"?T.acc+"0A":T.txF+"0A",border:"1px solid "+(isDone?T.pr:status.toLowerCase()==="pending"?T.acc:T.txF)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{isDone?"🔍":status.toLowerCase()==="pending"?"⏳":"📋"}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{kw}</div><div style={{fontSize:11,color:T.txM,marginTop:2}}>{loc} · {lastSearch||status}</div></div>
              <div style={{textAlign:"right",flexShrink:0}}>{isDone&&<div style={{fontSize:16,fontWeight:800,color:T.pr}}>{adsFound}</div>}{status.toLowerCase()==="pending"&&<div style={{fontSize:11,color:T.acc,fontWeight:600}}>Queued</div>}<div style={{fontSize:10,color:T.txM}}>{isDone?"ads found":""}</div></div>
            </div>)
          })}
        </div>}
      </div>
    </div>
  </div>}

  {pg==="notepad"&&<div style={{display:"flex",flexDirection:"column",gap:22}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><h1 style={{fontSize:28,fontWeight:800,letterSpacing:-.8,marginBottom:4}}>Notepad</h1><p style={{fontSize:14,color:T.txS}}>Personal notes & to-dos — saved to cloud</p></div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <div style={{width:8,height:8,borderRadius:4,background:T.gn}}/>
        <span style={{fontSize:12,color:T.gn,fontWeight:500}}>Auto-saved</span>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:18}}>
      {/* Notes Panel */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>📝 Notes ({npNotes.length})</div>
          <div style={{display:"flex",gap:6}}>
            <input value={npNewTitle} onChange={e=>setNpNewTitle(e.target.value)} placeholder="New note title…" style={{...IS,width:180,fontSize:12,padding:"8px 12px"}}/>
            <button onClick={()=>{if(npNewTitle.trim()){const n={id:Date.now(),title:npNewTitle,body:"",pinned:false,updated:"Just now"};setNpNotes(p=>[n,...p]);setNpActive(n.id);setNpNewTitle("");showT("📝 Note created!")}}} style={{padding:"8px 16px",borderRadius:10,border:"none",background:accG,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>+ Add</button>
          </div>
        </div>

        {/* Pinned */}
        {npNotes.filter(n=>n.pinned).length>0&&<div>
          <div style={{fontSize:10,color:T.txM,marginBottom:6}}>📌 Pinned</div>
          {npNotes.filter(n=>n.pinned).map(n=>(
            <div key={n.id} onClick={()=>{if(npActive!==n.id)setNpActive(n.id)}} className="hov" style={{background:npActive===n.id?T.acc+"08":T.sf,border:"1px solid "+(npActive===n.id?T.acc+"33":T.bd),borderRadius:18,padding:20,marginBottom:8,cursor:"pointer",boxShadow:npActive===n.id?`0 0 40px ${T.acc}08,${T.sh}`:T.sh,transition:"all .3s cubic-bezier(.16,1,.3,1)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:npActive===n.id?12:0}}>
                <div style={{fontSize:15,fontWeight:600}}>{n.title}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:10,color:T.txF}}>{n.updated}</span>
                  <span style={{fontSize:14,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setNpNotes(p=>p.map(x=>x.id===n.id?{...x,pinned:!x.pinned}:x))}}>📌</span>
                  <span style={{fontSize:12,cursor:"pointer",padding:"2px 8px",borderRadius:6,background:T.bl+"14",color:T.bl}} onClick={e=>{e.stopPropagation();setNoteFullView(n.id)}}>⛶</span>
                  <span style={{fontSize:14,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setNpActive(null)}}>▲</span>
                </div>
              </div>
              {npActive===n.id&&<textarea onClick={e=>e.stopPropagation()} value={n.body} onChange={e=>setNpNotes(p=>p.map(x=>x.id===n.id?{...x,body:e.target.value,updated:"Just now"}:x))} style={{...IS,height:180,fontFamily:"monospace",fontSize:13,lineHeight:1.7,resize:"vertical",marginTop:8,background:dk?T.el:T.ra,borderColor:T.acc+"22"}}/>}
              {npActive!==n.id&&<div style={{fontSize:12.5,color:T.txM,marginTop:6,lineHeight:1.5,overflow:"hidden",maxHeight:40}}>{n.body.substring(0,100)}{n.body.length>100?"…":""}</div>}
            </div>
          ))}
        </div>}

        {/* Other notes */}
        {npNotes.filter(n=>!n.pinned).map(n=>(
          <div key={n.id} onClick={()=>{if(npActive!==n.id)setNpActive(n.id)}} className="hov" style={{background:npActive===n.id?T.acc+"08":T.sf,border:"1px solid "+(npActive===n.id?T.acc+"33":T.bd),borderRadius:18,padding:20,cursor:"pointer",boxShadow:npActive===n.id?`0 0 40px ${T.acc}08,${T.sh}`:T.sh,transition:"all .3s cubic-bezier(.16,1,.3,1)",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:npActive===n.id?12:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{n.title}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:10,color:T.txF}}>{n.updated}</span>
                <span style={{fontSize:14,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setNpNotes(p=>p.map(x=>x.id===n.id?{...x,pinned:!x.pinned}:x))}}>📌</span>
                {npActive===n.id&&<span style={{fontSize:12,cursor:"pointer",padding:"2px 8px",borderRadius:6,background:T.bl+"14",color:T.bl}} onClick={e=>{e.stopPropagation();setNoteFullView(n.id)}}>⛶</span>}
                {npActive===n.id&&<span style={{fontSize:14,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setNpActive(null)}}>▲</span>}
                <span style={{fontSize:14,cursor:"pointer",color:T.rd}} onClick={e=>{e.stopPropagation();if(npActive===n.id)setNpActive(null);setNpNotes(p=>p.filter(x=>x.id!==n.id));showT("🗑 Deleted")}}>×</span>
              </div>
            </div>
            {npActive===n.id&&<textarea onClick={e=>e.stopPropagation()} value={n.body} onChange={e=>setNpNotes(p=>p.map(x=>x.id===n.id?{...x,body:e.target.value,updated:"Just now"}:x))} style={{...IS,height:180,fontFamily:"monospace",fontSize:13,lineHeight:1.7,resize:"vertical",marginTop:8,background:dk?T.el:T.ra,borderColor:T.acc+"22"}}/>}
            {npActive!==n.id&&n.body&&<div style={{fontSize:12.5,color:T.txM,marginTop:6,lineHeight:1.5,overflow:"hidden",maxHeight:40}}>{n.body.substring(0,100)}{n.body.length>100?"…":""}</div>}
          </div>
        ))}
      </div>

      {/* To-Do Panel */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5}}>✅ To-Do ({npTodos.filter(t=>!t.done).length} remaining)</div>

        {/* Add todo */}
        <div style={{display:"flex",gap:8}}>
          <input value={npNewTodo} onChange={e=>setNpNewTodo(e.target.value)} placeholder="Add a task…" style={{...IS,flex:1}} onKeyDown={e=>{if(e.key==="Enter"&&npNewTodo.trim()){setNpTodos(p=>[{id:Date.now(),text:npNewTodo,done:false,due:"Today"},...p]);setNpNewTodo("");showT("✅ Task added!")}}}/>
          <button onClick={()=>{if(npNewTodo.trim()){setNpTodos(p=>[{id:Date.now(),text:npNewTodo,done:false,due:"Today"},...p]);setNpNewTodo("");showT("✅ Added!")}}} style={{padding:"12px 20px",borderRadius:12,border:"none",background:accG,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Add</button>
        </div>

        {/* Active tasks */}
        <div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:22,boxShadow:T.sh}}>
          <div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:14}}>Active</div>
          {npTodos.filter(t=>!t.done).map(todo=>(
            <div key={todo.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+T.bd}}>
              <div onClick={()=>setNpTodos(p=>p.map(x=>x.id===todo.id?{...x,done:true}:x))} style={{width:22,height:22,borderRadius:7,border:"2px solid "+T.acc,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5,fontWeight:500}}>{todo.text}</div>
              </div>
              {B(todo.due,todo.due==="Today"?T.acc:todo.due==="Tomorrow"?T.bl:T.txM)}
              <span onClick={()=>setNpTodos(p=>p.filter(x=>x.id!==todo.id))} style={{fontSize:14,color:T.rd,cursor:"pointer",opacity:.5}}>×</span>
            </div>
          ))}
          {npTodos.filter(t=>!t.done).length===0&&<div style={{padding:20,textAlign:"center",color:T.txF,fontSize:13}}>🎉 All done!</div>}
        </div>

        {/* Completed tasks */}
        {npTodos.filter(t=>t.done).length>0&&<div style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:22,boxShadow:T.sh}}>
          <div style={{fontSize:12,fontWeight:600,color:T.txM,marginBottom:14}}>Completed ({npTodos.filter(t=>t.done).length})</div>
          {npTodos.filter(t=>t.done).map(todo=>(
            <div key={todo.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+T.bd,opacity:.5}}>
              <div onClick={()=>setNpTodos(p=>p.map(x=>x.id===todo.id?{...x,done:false}:x))} style={{width:22,height:22,borderRadius:7,background:T.gn,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{fontSize:13,textDecoration:"line-through",color:T.txM}}>{todo.text}</span>
              <span onClick={()=>setNpTodos(p=>p.filter(x=>x.id!==todo.id))} style={{marginLeft:"auto",fontSize:14,color:T.rd,cursor:"pointer",opacity:.5}}>×</span>
            </div>
          ))}
          <button onClick={()=>{setNpTodos(p=>p.filter(x=>!x.done));showT("🗑 Cleared completed")}} style={{marginTop:12,padding:"8px 16px",borderRadius:10,border:"1px solid "+T.rd+"33",background:T.rd+"0A",color:T.rd,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Clear completed</button>
        </div>}
      </div>
    </div>
  </div>}

  {pg==="settings"&&<div style={{maxWidth:mob?"100%":900}}>
    {/* n8n Webhooks */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:mob?18:24,boxShadow:T.sh,marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:24}}>n8n Automation Webhooks</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"200px 1fr",gap:mob?8:16,alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.bd}}>
        <span style={{fontSize:14,color:T.txS,fontWeight:600}}>Maps Lead Engine</span>
        <input value={n8nMaps} onChange={e=>setN8nMaps(e.target.value)} placeholder="https://your-n8n.com/webhook/maps-v14" style={{...IS,fontFamily:"monospace",fontSize:12}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"200px 1fr",gap:mob?8:16,alignItems:"center",padding:"14px 0"}}>
        <span style={{fontSize:14,color:T.txS,fontWeight:600}}>Google Ads Finder</span>
        <input value={n8nAds} onChange={e=>setN8nAds(e.target.value)} placeholder="https://your-n8n.com/webhook/google-ads-form" style={{...IS,fontFamily:"monospace",fontSize:12}}/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        {n8nMaps&&<span style={{padding:"4px 12px",borderRadius:6,background:T.gn+"12",color:T.gn,fontSize:10,fontWeight:600}}>● Maps Connected</span>}
        {n8nAds&&<span style={{padding:"4px 12px",borderRadius:6,background:T.gn+"12",color:T.gn,fontSize:10,fontWeight:600}}>● Ads Connected</span>}
        {!n8nMaps&&!n8nAds&&<span style={{fontSize:12,color:T.yw}}>⚠ Paste your n8n webhook URLs above</span>}
      </div>
    </div>
    {/* Google Sheets Config */}
    <div className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:mob?18:28,boxShadow:T.sh,marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:24}}>Google Sheets</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"200px 1fr",gap:mob?8:16,alignItems:"center",padding:"14px 0",borderBottom:"1px solid "+T.bd}}>
        <span style={{fontSize:14,color:T.txS,fontWeight:600}}>Sheet URL</span>
        <input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/xxx/edit" style={{...IS,fontFamily:"monospace",fontSize:12}}/>
      </div>
      {[["Sheet ID","1abc…xyz"],["Tab Name","Leads"],["Drive Folder (HTML)","folder_html_id"],["Drive Folder (PDF)","folder_pdf_id"]].map(([k,v],i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:mob?"1fr":"200px 1fr",gap:mob?8:16,alignItems:"center",padding:"14px 0",borderBottom:i<3?"1px solid "+T.bd:"none"}}><span style={{fontSize:14,color:T.txS}}>{k}</span><input defaultValue={v} style={IS}/></div>
      ))}
      <button onClick={()=>showT("✅ Sheet connection tested!")} style={{marginTop:14,padding:"10px 20px",borderRadius:10,border:"1px solid "+T.gn+"33",background:T.gn+"0A",color:T.gn,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff}}>🔗 Test Connection</button>
    </div>
    {/* Other settings */}
    {[{h:"WhatsApp API",r:[["Provider","WA Business API"],["API Key","••••••••"],["Phone Number","+91-XXXXXXXXXX"],["Rate Limit","50/hour"]]},{h:"Report Engine",r:[["Default Template","premium-v1"],["Rate Limit","10/min"],["Workers","3"]]},{h:"AI Configuration",r:[["Model","claude-sonnet-4-5"],["Max Tokens","2000"],["Daily Cap","₹500"]]}].map((s,si)=>(
      <div key={si} className="hov" style={{background:T.sf,border:"1px solid "+T.bd,borderRadius:18,padding:mob?18:28,boxShadow:T.sh,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:T.txM,textTransform:"uppercase",letterSpacing:1.5,marginBottom:24}}>{s.h}</div>
        {s.r.map(([k,v],i)=><div key={i} style={{display:"grid",gridTemplateColumns:mob?"1fr":"200px 1fr",gap:mob?8:16,alignItems:"center",padding:"14px 0",borderBottom:i<s.r.length-1?"1px solid "+T.bd:"none"}}><span style={{fontSize:14,color:T.txS}}>{k}</span><input defaultValue={v} style={IS}/></div>)}
      </div>
    ))}
    <div style={{display:"flex",gap:12}}>
      <button onClick={async()=>{if(!DEMO)await apiCall("/settings",{method:"PUT",body:{sheet_url:sheetUrl}});showT("✅ All settings saved!")}} style={{padding:"14px 30px",borderRadius:14,border:"none",background:accG,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Save All Settings</button>
      {!DEMO&&<button onClick={()=>{try{localStorage.removeItem("tg_token")}catch{};setLoggedIn(false)}} style={{padding:"14px 30px",borderRadius:14,border:"1px solid "+T.rd+"33",background:T.rd+"0A",color:T.rd,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:ff}}>Logout</button>}
    </div>
  </div>}
</div>}

</div></div></main>
{/* Mobile Bottom Nav */}
{mob&&<nav style={{position:"fixed",bottom:0,left:0,right:0,height:64,background:dk?"rgba(12,15,24,.95)":"rgba(255,255,255,.95)",backdropFilter:"blur(24px) saturate(1.3)",borderTop:"1px solid "+T.bd,display:"flex",alignItems:"center",justifyContent:"space-around",zIndex:40,padding:"0 8px"}}>
  {[
    {id:"home",l:"Home",i:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"},
    {id:"pipeline",l:"Pipeline",i:"M22 12h-4l-3 9L9 3l-3 9H2"},
    {id:"generate",l:"Generate",i:"M5 3l14 9-14 9V3z"},
    {id:"leads",l:"Leads",i:"M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M14 3.5a4 4 0 110 7"},
    {id:"revenue",l:"Revenue",i:"M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"},
  ].map(n=>{const a=pg===n.id;return(
    <div key={n.id} onClick={()=>setPg(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"6px 12px",borderRadius:12,background:a?T.acc+"12":"transparent",transition:"all .2s"}}>
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={a?T.acc:T.txM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={n.i}/></svg>
      <span style={{fontSize:9.5,fontWeight:a?600:500,color:a?T.acc:T.txM}}>{n.l}</span>
    </div>
  )})}
  {/* More menu */}
  <div onClick={()=>{const next=["campaigns","tracking","team","templates","automations","engine","adintel","bookmarks","notepad","sheets","settings"];const cur=next.indexOf(pg);setPg(next[(cur+1)%next.length])}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"6px 12px",borderRadius:12}}>
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.txM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    <span style={{fontSize:9.5,fontWeight:500,color:T.txM}}>More</span>
  </div>
</nav>}
</div>);
}
