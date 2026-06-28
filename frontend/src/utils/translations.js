export const translations = {
  en: {
    // Nav / Tabs
    mapExplorer: "Map Explorer",
    searchGps: "Search & GPS",
    dualMaps: "Dual Maps",
    manualTest: "Manual Test",
    evacuation: "Evacuation Plan",
    
    // Theme/Language
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    langSelect: "Language",
    
    // Map Explorer Tab
    selectedCoords: "Selected Coordinates",
    clickMapHint: "Click anywhere on the map",
    historicalCaseStudies: "Historical Case Studies",
    analyzingTelemetry: "Analyzing satellite telemetry...",
    runningPipelines: "Running ML pipelines",
    selectLocationPrompt: "Select a location on the map to run the AI prediction models.",
    nearestSafeZoneMapTitle: "Nearest Safe Zone",
    evacuationDestination: "Your evacuation destination",
    
    // Search & GPS Tab
    searchLocation: "Search Location",
    detectGpsLocation: "Detect GPS Location",
    detectingGps: "Detecting GPS...",
    analyzingRegion: "Analyzing Region",
    fetchingTelemetryDetail: "Fetching real-time satellite telemetry, geological elevation, and historical weather data...",
    noLocationSelected: "No Location Selected",
    gpsBtnHint: "Use the GPS detector or type a location to run the prediction models.",
    quickLocations: "Quick Locations",
    
    // Dual Maps Tab
    loadRiskZones: "Load Risk Zones",
    reloadRiskZones: "Re-Load Risk Zones",
    scanningSubcontinent: "Scanning Subcontinent...",
    processingBatch: "Processing batch",
    mapsUninitialized: "Maps Uninitialized",
    dualMapsHint: "Click \"Load Risk Zones\" to fetch predictions for 67 locations. Only locations with ≥30% risk will be displayed.",
    floodRiskOverlay: "FLOOD RISK",
    landslideRiskOverlay: "LANDSLIDE RISK",
    zonesText: "zones",
    clickResultLabel: "Map Click Result",
    
    // Manual Test Tab
    floodManualTitle: "Flood Prediction — Manual Test",
    landslideManualTitle: "Landslide Prediction — Manual Test",
    quickPresetsTitle: "Quick Presets (Indian High Risk Events)",
    dateLabel: "Date",
    rawInputsTitle: "Raw Inputs",
    engineeredFeaturesTitle: "Engineered Features",
    autoCalculate: "Auto-Calculate",
    predictFloodBtn: "Predict Flood Risk",
    predictLandslideBtn: "Predict Landslide Risk",
    runningModel: "Running Model...",
    evaluationLogicTitle: "Evaluation Logic",
    
    // Prediction Result
    floodRiskLabel: "Flood Risk",
    landslideRiskLabel: "Landslide Risk",
    liveSatelliteFactors: "Live Satellite Factors",
    aiDecisionDrivers: "AI Decision Drivers (XAI)",
    floodFactorsTitle: "Flood Risk Factors",
    landslideFactorsTitle: "Landslide Risk Factors",
    highRiskDetectedTitle: "High Risk Detected — Evacuation Route",
    
    // Nearest Safe Zones Panel
    nearestSafeZonesHeader: "Nearest Safe Zones",
    rankedByDriveTime: "Ranked by drive time via ORS API",
    findingNearestSafeZones: "Finding nearest hospitals & relief camps...",
    nearestBadge: "Nearest",
    
    // Evacuation Plan Tab / Map
    evacuationPlannerTitle: "Evacuation Planner",
    poweredByOrs: "Powered by OpenRouteService API",
    setYourLocation: "Set Your Location",
    useCurrentLocationBtn: "Use My Current Location",
    acquiringGpsSignal: "Acquiring GPS signal...",
    orSearchLabel: "OR SEARCH",
    searchPlacePlaceholder: "e.g. Kedarnath, Guwahati, Patna...",
    calculateRouteBtn: "Calculate Route",
    calculatingRoute: "Calculating Route...",
    resetRouteBtn: "Reset Location & Route",
    drivingDirectionsHeader: "Driving Directions",
    fastestRouteFound: "Fastest route found using real-time road networks.",
    straightLineFallback: "ORS Routing API offline. Displaying straight-line distance.",
    distanceLabel: "Distance",
    durationLabel: "Duration",
    destinationLabel: "Destination",
    routeStepsHeader: "Route Steps",
    totalSteps: "steps",
    clickMapRoutingHint: "Use sidebar to set location, or click directly on the map",
    calculatingFastestRoute: "Calculating fastest route to safe zone...",
    yourLocationMarker: "Your Location",
    
    // Risk Labels
    lowRisk: "Low Risk",
    moderateRisk: "Moderate Risk",
    highRisk: "High Risk",
    veryHighRisk: "Very High Risk",
    extremeRisk: "Extreme Risk",
    
    // Factors
    dailyRain: "Daily Rain",
    sevenDayRain: "7-Day Rain",
    elevation: "Elevation",
    soilMoist: "Soil Moist.",
    discharge: "Discharge",
    humidity: "Humidity",
  },
  hi: {
    // Nav / Tabs
    mapExplorer: "नक्शा एक्सप्लोरर",
    searchGps: "खोज और जीपीएस",
    dualMaps: "दोहरे नक्शे",
    manualTest: "मैनुअल टेस्ट",
    evacuation: "निकासी मार्ग",
    
    // Theme/Language
    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    langSelect: "भाषा",
    
    // Map Explorer Tab
    selectedCoords: "चयनित निर्देशांक",
    clickMapHint: "नक्शे पर कहीं भी क्लिक करें",
    historicalCaseStudies: "ऐतिहासिक केस स्टडीज",
    analyzingTelemetry: "सैटेलाइट टेलीमेट्री का विश्लेषण...",
    runningPipelines: "एमएल मॉडल चल रहे हैं",
    selectLocationPrompt: "एआई भविष्यवाणी मॉडल चलाने के लिए नक्शे पर कोई स्थान चुनें।",
    nearestSafeZoneMapTitle: "निकटतम सुरक्षित क्षेत्र",
    evacuationDestination: "आपका निकासी गंतव्य",
    
    // Search & GPS Tab
    searchLocation: "स्थान खोजें",
    detectGpsLocation: "जीपीएस स्थान का पता लगाएं",
    detectingGps: "जीपीएस का पता लगाया जा रहा है...",
    analyzingRegion: "क्षेत्र का विश्लेषण",
    fetchingTelemetryDetail: "वास्तविक समय उपग्रह टेलीमेट्री, भूगर्भीय ऊंचाई और ऐतिहासिक मौसम डेटा प्राप्त किया जा रहा है...",
    noLocationSelected: "कोई स्थान नहीं चुना गया",
    gpsBtnHint: "भविष्यवाणी मॉडल चलाने के लिए जीपीएस डिटेक्टर का उपयोग करें या कोई स्थान टाइप करें।",
    quickLocations: "त्वरित स्थान",
    
    // Dual Maps Tab
    loadRiskZones: "जोखिम क्षेत्र लोड करें",
    reloadRiskZones: "जोखिम क्षेत्र पुनः लोड करें",
    scanningSubcontinent: "उपमहाद्वीप को स्कैन किया जा रहा है...",
    processingBatch: "बैंच प्रक्रिया",
    mapsUninitialized: "नक्शे प्रारंभ नहीं हुए",
    dualMapsHint: "67 स्थानों के लिए भविष्यवाणियां प्राप्त करने के लिए \"जोखिम क्षेत्र लोड करें\" पर क्लिक करें। केवल ≥30% जोखिम वाले स्थान प्रदर्शित किए जाएंगे।",
    floodRiskOverlay: "बाढ़ जोखिम",
    landslideRiskOverlay: "भूस्खलन जोखिम",
    zonesText: "क्षेत्र",
    clickResultLabel: "नक्शा क्लिक परिणाम",
    
    // Manual Test Tab
    floodManualTitle: "बाढ़ भविष्यवाणी — मैनुअल टेस्ट",
    landslideManualTitle: "भूस्खलन भविष्यवाणी — मैनुअल टेस्ट",
    quickPresetsTitle: "त्वरित प्रीसेट (भारतीय उच्च जोखिम घटनाएं)",
    dateLabel: "दिनांक",
    rawInputsTitle: "कच्चे इनपुट",
    engineeredFeaturesTitle: "इंजीनियर्ड विशेषताएं",
    autoCalculate: "स्वतः गणना करें",
    predictFloodBtn: "बाढ़ जोखिम की भविष्यवाणी करें",
    predictLandslideBtn: "भूस्खलन जोखिम की भविष्यवाणी करें",
    runningModel: "मॉडल चल रहा है...",
    evaluationLogicTitle: "मूल्यांकन तर्क",
    
    // Prediction Result
    floodRiskLabel: "बाढ़ जोखिम",
    landslideRiskLabel: "भूस्खलन जोखिम",
    liveSatelliteFactors: "लाइव सैटेलाइट कारक",
    aiDecisionDrivers: "एआई निर्णय चालक (XAI)",
    floodFactorsTitle: "बाढ़ जोखिम कारक",
    landslideFactorsTitle: "भूस्खलन जोखिम कारक",
    highRiskDetectedTitle: "उच्च जोखिम पाया गया — निकासी मार्ग",
    
    // Nearest Safe Zones Panel
    nearestSafeZonesHeader: "निकटतम सुरक्षित क्षेत्र",
    rankedByDriveTime: "ORS API के माध्यम से ड्राइव समय के आधार पर",
    findingNearestSafeZones: "निकटतम अस्पतालों और राहत शिविरों की तलाश की जा रही है...",
    nearestBadge: "निकटतम",
    
    // Evacuation Plan Tab / Map
    evacuationPlannerTitle: "निकासी योजनाकार",
    poweredByOrs: "OpenRouteService API द्वारा संचालित",
    setYourLocation: "अपना स्थान निर्धारित करें",
    useCurrentLocationBtn: "मेरे वर्तमान स्थान का उपयोग करें",
    acquiringGpsSignal: "जीपीएस सिग्नल प्राप्त किया जा रहा है...",
    orSearchLabel: "या खोजें",
    searchPlacePlaceholder: "जैसे: केदारनाथ, गुवाहाटी, पटना...",
    calculateRouteBtn: "मार्ग की गणना करें",
    calculatingRoute: "मार्ग की गणना की जा रही है...",
    resetRouteBtn: "स्थान और मार्ग रीसेट करें",
    drivingDirectionsHeader: "ड्राइविंग निर्देश",
    fastestRouteFound: "वास्तविक समय सड़क नेटवर्क का उपयोग करके सबसे तेज़ मार्ग मिला।",
    straightLineFallback: "ORS रूटिंग API ऑफ़लाइन है। सीधी दूरी दिखाई जा रही है।",
    distanceLabel: "दूरी",
    durationLabel: "समय",
    destinationLabel: "गंतव्य",
    routeStepsHeader: "मार्ग के चरण",
    totalSteps: "चरण",
    clickMapRoutingHint: "स्थान सेट करने के लिए साइडबार का उपयोग करें, या सीधे नक्शे पर क्लिक करें",
    calculatingFastestRoute: "सुरक्षित क्षेत्र के लिए सबसे तेज़ मार्ग की गणना की जा रही है...",
    yourLocationMarker: "आपका स्थान",
    
    // Risk Labels
    lowRisk: "कम जोखिम",
    moderateRisk: "मध्यम जोखिम",
    highRisk: "उच्च जोखिम",
    veryHighRisk: "बहुत उच्च जोखिम",
    extremeRisk: "अत्यधिक जोखिम",
    
    // Factors
    dailyRain: "दैनिक वर्षा",
    sevenDayRain: "7-दिवसीय वर्षा",
    elevation: "ऊंचाई",
    soilMoist: "मिट्टी की नमी",
    discharge: "नदी विसर्जन",
    humidity: "आर्द्रता",
  },
  mr: {
    // Nav / Tabs
    mapExplorer: "नकाशा एक्सप्लोरर",
    searchGps: "शोध आणि जीपीएस",
    dualMaps: "दुहेरी नकाशे",
    manualTest: "मॅन्युअल टेस्ट",
    evacuation: "स्थलांतर मार्ग",
    
    // Theme/Language
    themeLight: "लाइट मोड",
    themeDark: "डार्क मोड",
    langSelect: "भाषा",
    
    // Map Explorer Tab
    selectedCoords: "निवडलेले निर्देशांक",
    clickMapHint: "नकाशावर कुठेही क्लिक करा",
    historicalCaseStudies: "ऐतिहासिक केस स्टडीज",
    analyzingTelemetry: "सॅटेलाइट टेलिमेट्रीचे विश्लेषण...",
    runningPipelines: "एमएल मॉडेल चालू आहेत",
    selectLocationPrompt: "एआई अंदाज मॉडेल चालवण्यासाठी नकाशावर जागा निवडा.",
    nearestSafeZoneMapTitle: "जवळचे सुरक्षित क्षेत्र",
    evacuationDestination: "तुमचे स्थलांतर गंतव्य",
    
    // Search & GPS Tab
    searchLocation: "ठिकाण शोधा",
    detectGpsLocation: "जीपीएस स्थान शोधा",
    detectingGps: "जीपीएस शोधत आहे...",
    analyzingRegion: "क्षेत्राचे विश्लेषण",
    fetchingTelemetryDetail: "रिअल-टाइम उपग्रह टेलिमेट्री, भूगर्भीय उंची आणि ऐतिहासिक हवामान डेटा मिळवत आहे...",
    noLocationSelected: "कोणतेही ठिकाण निवडलेले नाही",
    gpsBtnHint: "अंदाज मॉडेल चालवण्यासाठी जीपीएस वापरा किंवा एखादे ठिकाण टाईप करा.",
    quickLocations: "त्वरित ठिकाणे",
    
    // Dual Maps Tab
    loadRiskZones: "धोकादायक क्षेत्र लोड करा",
    reloadRiskZones: "धोकादायक क्षेत्र पुन्हा लोड करा",
    scanningSubcontinent: "उपखंड स्कॅन करत आहे...",
    processingBatch: "बॅच प्रक्रिया",
    mapsUninitialized: "नकाशे सुरू केलेले नाहीत",
    dualMapsHint: "67 ठिकाणांसाठी अंदाज मिळवण्यासाठी \"धोकादायक क्षेत्र लोड करा\" वर क्लिक करा. फक्त ≥३०% जोखीम असलेली ठिकाणे दिसतील.",
    floodRiskOverlay: "पूर जोखीम",
    landslideRiskOverlay: "भूस्खलन जोखीम",
    zonesText: "क्षेत्र",
    clickResultLabel: "नकाशा क्लिक निकाल",
    
    // Manual Test Tab
    floodManualTitle: "पूर अंदाज — मॅन्युअल टेस्ट",
    landslideManualTitle: "भूस्खलन अंदाज — मॅन्युअल टेस्ट",
    quickPresetsTitle: "त्वरित प्रीसेट (भारतीय उच्च जोखीम घटना)",
    dateLabel: "तारीख",
    rawInputsTitle: "मूळ इनपुट",
    engineeredFeaturesTitle: "इंजिनिअर्ड वैशिष्ट्ये",
    autoCalculate: "स्वयं मोजणी करा",
    predictFloodBtn: "पूर जोखीम मोजा",
    predictLandslideBtn: "भूस्खलन जोखीम मोजा",
    runningModel: "मॉडेल चालू आहे...",
    evaluationLogicTitle: "मूल्यांकन तर्क",
    
    // Prediction Result
    floodRiskLabel: "पूर जोखीम",
    slideRiskLabel: "भूस्खलन जोखीम",
    liveSatelliteFactors: "थेट सॅटेलाइट घटक",
    aiDecisionDrivers: "एआय निर्णय चालक (XAI)",
    floodFactorsTitle: "पूर जोखीम घटक",
    landslideFactorsTitle: "भूस्खलन जोखीम घटक",
    highRiskDetectedTitle: "उच्च जोखीम आढळली — स्थलांतर मार्ग",
    
    // Nearest Safe Zones Panel
    nearestSafeZonesHeader: "जवळचे सुरक्षित क्षेत्र",
    rankedByDriveTime: "ORS API द्वारे प्रवासाच्या वेळेनुसार",
    findingNearestSafeZones: "जवळची रुग्णालये आणि मदत केंद्रे शोधत आहे...",
    nearestBadge: "जवळचे",
    
    // Evacuation Plan Tab / Map
    evacuationPlannerTitle: "स्थलांतर नियोजक",
    poweredByOrs: "OpenRouteService API द्वारे संचलित",
    setYourLocation: "तुमचे स्थान सेट करा",
    useCurrentLocationBtn: "माझे वर्तमान स्थान वापरा",
    acquiringGpsSignal: "जीपीएस सिग्नल मिळवत आहे...",
    orSearchLabel: "किंवा शोधा",
    searchPlacePlaceholder: "उदा: केदारनाथ, गुवाहाटी, पाटणा...",
    calculateRouteBtn: "मार्ग मोजा",
    calculatingRoute: "मार्ग मोजत आहे...",
    resetRouteBtn: "स्थान आणि मार्ग रिसेट करा",
    drivingDirectionsHeader: "प्रवासाचे मार्गदर्शन",
    fastestRouteFound: "रिअल-टाइम रस्ते नेटवर्क वापरून सर्वात वेगवान मार्ग मिळाला.",
    straightLineFallback: "ORS रूटिंग API ऑफलाइन आहे. सरळ रेषेचे अंतर दाखवत आहे.",
    distanceLabel: "अंतर",
    durationLabel: "वेळ",
    destinationLabel: "गंतव्य",
    routeStepsHeader: "मार्गाचे टप्पे",
    totalSteps: "टप्पे",
    clickMapRoutingHint: "स्थान सेट करण्यासाठी डावी बाजू वापरा किंवा नकाशावर थेट क्लिक करा",
    calculatingFastestRoute: "सुरक्षित क्षेत्रासाठी सर्वात वेगवान मार्ग मोजत आहे...",
    yourLocationMarker: "तुमचे स्थान",
    
    // Risk Labels
    lowRisk: "कमी जोखीम",
    moderateRisk: "मध्यम जोखीम",
    highRisk: "उच्च जोखीम",
    veryHighRisk: "खूप उच्च जोखीम",
    extremeRisk: "अत्यंत उच्च जोखीम",
    
    // Factors
    dailyRain: "दैनिक पाऊस",
    sevenDayRain: "7-दिवसीय पाऊस",
    elevation: "उंची",
    soilMoist: "मातीचा ओलावा",
    discharge: "नदी विसर्ग",
    humidity: "आर्द्रता",
  }
};
