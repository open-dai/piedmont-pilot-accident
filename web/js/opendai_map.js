// Posizione iniziale della mappa
var geo_server_ip = "194.116.110.158";

var lat=45.174293;
var lon=7.903747;
// zoom iniziale
var zoom=7.6;
// 45.061882,7.673035 (Circa TO)
// 45.174293,7.903747

var lonLat;
var mapnik;
var inc_wms;
var spire_wms;
// var cloudmade;
var layerCycleMap;
 		
var map;
// pink tile avoidance
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
// make OL compute scale according to WMS spec
OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;
 		
 		
function init() {
   map = new OpenLayers.Map ("map", {
          controls:[ 
                     new OpenLayers.Control.Navigation(),
                     new OpenLayers.Control.PanZoomBar(),
                     new OpenLayers.Control.ScaleLine({bottomOutUnits: '',
												div:document.getElementById("scale")
										 }),
                     // new OpenLayers.Control.Permalink('permalink'),
                     // new OpenLayers.Control.MousePosition(),                    
                     // new OpenLayers.Control.Attribution()
                     new OpenLayers.Control.MousePosition({
												div:document.getElementById("coord")
										})
			      ],
          projection: new OpenLayers.Projection("EPSG:900913"),
          displayProjection: new OpenLayers.Projection("EPSG:4326")
          } );
	
	// OpenStreetMap
	mapnik = new OpenLayers.Layer.OSM(" OpenStreetMap");
	map.addLayer(mapnik);
	
	// CycleMap
  layerCycleMap = new OpenLayers.Layer.OSM.CycleMap(" CycleMap");
  // layerCycleMap.setOpacity(0.4);
  map.addLayer(layerCycleMap);
 
  lonLat = new OpenLayers.LonLat( lon ,lat )
        .transform(
          new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
          map.getProjectionObject() // to Spherical Mercator Projection
          );

	// http://194.116.110.158/geoserver/stg/wms?service=WMS&version=1.1.0&request=GetMap&layers=stg:SISS_VSDO_PT_LOCINC&styles=&bbox=310000.0,4880000.0,520000.0,5150000.0&width=398&height=512&srs=EPSG:32632&format=application%2Fopenlayers
	// Imposto il filtro di default
	var filter_param = getFilterParam("2009", "2010");
	
	inc_wms = new OpenLayers.Layer.WMS(
  " Road Accident",
  "http://" + geo_server_ip + ":80/geoserver/stg/wms?service=WMS&version=1.1.0",
  {
      layers: "stg:SISS_VSDO_PT_LOCINC",
      transparent: "true",
      format: "image/png",
      filter: filter_param
  },
  		{isBaseLayer: false}
	);
	
	// Layer incidenti
	map.addLayer(inc_wms);
	
	// Layer spire
	spire_wms = new OpenLayers.Layer.WMS(
  " Traffic Sensor",
  "http://" + geo_server_ip + ":80/geoserver/stg/wms?service=WMS&version=1.1.0",
  {
      layers: "stg:traffic_sensor",
      transparent: "true",
      format: "image/png"
      // filter: filter_param
  },
  		{isBaseLayer: false}
	);	
	map.addLayer(spire_wms);
	// Layer spire
	
	map.setCenter (lonLat, zoom);
	
	// Layer Switcher
  var switcherControl = new OpenLayers.Control.LayerSwitcher();
  map.addControl(switcherControl);
  switcherControl.minimizeControl();	
  
  // create an overview map control with the default options
  var overview = new OpenLayers.Control.OverviewMap({
      maximized: false
  });
  map.addControl(overview);
  
}

/** Prepara il filtro **/
function getFilterParam(from, to){

    var ol_filter = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.AND,
        filters: [
            new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
                property: "ANNO_INCIDENTE",
                value: from
            }),
            new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
                property: "ANNO_INCIDENTE",
                value: to
            })]
    });

    var filter_1_1 = new OpenLayers.Format.Filter({version: "1.1.0"});
    var xml = new OpenLayers.Format.XML(); 
    var filter_param = xml.write(filter_1_1.write(ol_filter))

    /*
    filter_param is now something like: partito da questo STG

    <Filter><And>
    <PropertyIsEqualTo><PropertyName>type</PropertyName><Literal>1</Literal></PropertyIsEqualTo>
    <PropertyIsEqualTo><PropertyName>concept</PropertyName><Literal>13816613</Literal></PropertyIsEqualTo>
    </And></Filter>
    */
    
    // alert(filter_param);
    
    return filter_param;
}

/** Rinfresaca con il nuovo filtro **/
function refreshWMSLayerInc(from, to){
    var inc_layer = map.getLayersByName(" Road Accident")[0];

    var new_filter = getFilterParam(from, to);

    inc_layer.params['FILTER'] = new_filter;

    inc_layer.redraw();
}

// StG per il pulsante
function updateIncidenti(document)
{
	var dFrom = document.getElementById('from_year').value;
	var dTo = document.getElementById('to_year').value;
	// alert("From: " + dFrom + " - to: " + dTo);
	
	refreshWMSLayerInc(dFrom, dTo);
}