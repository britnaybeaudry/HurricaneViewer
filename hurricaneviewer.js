//********************************************
//////////////////////////////////////////////
// Hurricane Viewer (Hurricane Maria, 2017) //
//////////////////////////////////////////////
//********************************************

// This code displays hourly precipitation, bidaily sea surface temperature, and max wind speed
// for a given area. The code is figured for 2017 hurricane Maria, but users can change the geometry, 
// start/end date, and point of interest to view other hurricanes.
// The data sources are as follows:
// - Precipitation: Jaxa Global Satellite Mapping of Precipitation (GSMaP)
// - Sea Surface Temperature: Hybrid Coordinate Ocean Model (HYCOM), Water Temperature and Salinity
// - Hurricane Path & Max Wind Speed: NOAA NHC Best Track Data (HURDAT2) Atlantic Hurricane Catalog

// Created by Britnay Beaudry. View at: https://github.com/britnaybeaudry/HurricaneViewer 

// Start of code

// Create dark basemap style
var darkmap = [
    {
      "stylers": [
        {"hue": "#2e4059"},
        {"invert_lightness": true},
        {"saturation": -80},
        {"lightness": 60},
        {"gamma": 0.33}
      ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#2D333C"}]
  }
];
// Set dark basemap as default map
Map.setOptions('darkmap', {darkmap: darkmap});

// Create a geometry for each area of interest
var geometry = ee.Geometry.Rectangle(-73.716, 21.604, -57.449, 12.148);
var geometry2 = ee.Geometry.Rectangle(-78.836, 37.892, -57.954, 12.491);

// Create a default point of interest for the time series charts. I picked San Juan, PR
var point = ee.Geometry.Point([-66.1136, 18.474]);
Map.centerObject(point, 4); // Set point as center object for the map below

///////////////////
// Precipitation //
///////////////////

// Load precipitation data from JAXA GSMaP
var precipitation = ee.ImageCollection('JAXA/GPM_L3/GSMaP/v6/operational')
                  .filter(ee.Filter.date('2017-09-19', '2017-09-21')) // select dates for Hurricane Maria's arrival over PR
                  .select('hourlyPrecipRate'); // select the hourly precipitation band
// Note: Since this collection is hourly, I hit GEE's user memory limit
// while trying to create gif for a longer date range and larger area of interest.
// If you are interested in a longer date range for your timeseries chart, this may come at the 
// expense of creating a gif in the Console tab.

// Define visualization parameters
var precipitationVis = {
  min: 0.0,
  max: 20.0,
  palette:
      ['1621a2', 'ffffff', '03ffff', '13ff03', 'efff00', 'ffb103', 'ff2300'],
};

// Add precipitation dataset to the map below, shown set to 'false'
Map.addLayer(precipitation, precipitationVis, "GSMaP Precipitation (mm/hr)", false);

///////////////////////
// Precipitation GIF //
///////////////////////

// Convert each image to a visualization by mapping a function 
// over the image collection
var precipGifViz = precipitation.map(function(img) {
  return img.visualize(precipitationVis);
});

// Import country features and filter to Caribbean countries
var caribbean = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filterMetadata('wld_rgn', 'equals', 'Caribbean');

// Create an empty image
var empty = ee.Image().byte();

// Paint country feature edges to the empty image created above
var caribbeanOutline = empty
  .paint({featureCollection: caribbean, color: 1, width: 1})
  // Set line color to white
  .visualize({palette: 'ffffff'});

// Map over the precipitation collection to overlay the country
// border outline image on all collection images
var precipitationGif = precipGifViz.map(function(img) {
  return img.blend(caribbeanOutline);
});

// Define gif arguments
var gifArgs = {
  dimensions: 768,
  region: geometry,
  framesPerSecond: 7,
  crs: 'EPSG:3857'
};

// Display the gif in the Console tab
print(ui.Thumbnail(precipitationGif, gifArgs));

// Print a URL that will produce the gif as a link in the Console tab
print(precipitationGif.getVideoThumbURL(gifArgs), "GSMaP Hourly Precipitation Over San Juan, PR (mm/hr)");

/////////////////////////
// Precipitation Chart //
/////////////////////////

// Create a chart for the hourly precipitation
var chart = ui.Chart.image.series({
  imageCollection: precipitation,
  region: point,
  reducer: ee.Reducer.mean(),
  xProperty: 'system:time_start'
});

// Set chart style properties
var chartStyle = {
  title: 'Hourly Precipitation Over San Juan, PR',
  hAxis: {
    title: 'Time (hr)',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'}
  },
  vAxis: {
    title: 'Precipitation (mm/hr)',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'},
    format: 'short',
    baselineColor: 'FFFFFF'
  },
  series: {
    0: {lineWidth: 3, color: '577590', pointSize: 4},
  },
  chartArea: {backgroundColor: 'EBEBEB'}
};

// Apply style properties to the chart
chart.setOptions(chartStyle);

// Print chart to Console tab
print(chart);

//////////////////////////////
// Sea Surface Temperature //
/////////////////////////////

// Load water temperature data from HYCOM
var hycom = ee.ImageCollection('HYCOM/sea_temp_salinity')
  .filterDate('2017-09-16', '2017-09-24'); 

// Select water temperature at 0 meters and scale to degrees Celsius
var seaWaterTemperature = hycom.select('water_temp_0')
    .map(function scaleAndOffset(image) {
      return ee.Image(image).multiply(0.001).add(20);
    });

// Define viz parameters for SST
var SSTviz = {min: 16, max: 32, //degree celsius 
  palette: ['000000', '005aff', '43c8c8', 'fff700', 'ff0000'],};

//Add SST data to the map below, shown set to 'false'
Map.addLayer(seaWaterTemperature, SSTviz, "HYCOM Sea Surface Temperature (°C)", false);

/////////////
// SST GIF //
/////////////
  
// Convert each image to a visualization by mapping a function 
// over the image collection
var sstGifVis = seaWaterTemperature.map(function(img) {
  return img.visualize(SSTviz);
});

// Create another empty image
var empty1 = ee.Image().byte();

// Paint country feature edges to the empty image created above
var pathOutline = empty1
  .paint({featureCollection: caribbean, color: 1, width: 1})
  // Convert to an RGB visualization image; set line color to black.
  .visualize({palette: '000000'});

// Map over the temperature collection to overlay the country
// border outline image on all collection images
var sstGIF = sstGifVis.map(function(img) {
  return img.blend(pathOutline);
});

// Define gif arguments
var GIFArgs = {
  dimensions: 768,
  region: geometry2,
  framesPerSecond: 5,
  crs: 'EPSG:3857'
};

// Display the gif in the Console tab
print(ui.Thumbnail(sstGIF, GIFArgs));

// Print a URL that will produce the gif as a link in the Console tab
print(sstGIF.getVideoThumbURL(GIFArgs), "HYCOM Sea Surface Temperature Near San Juan (°C)");

///////////////
// SST Chart //
///////////////

// Create a chart for the SST
var chart = ui.Chart.image.series({
  imageCollection: seaWaterTemperature,
  region: point,
  reducer: ee.Reducer.mean(),
  xProperty: 'system:index'
});

// Set chart style properties
var chartStyle = {
  title: 'Sea Surface Temperature Near San Juan, PR',
  hAxis: {
    title: 'Day (YYYYMMDDHH)',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'}
  },
  vAxis: {
    title: 'Sea Surface Temperature (°C)',
    titleTextStyle: {italic: false, bold: true},
    gridlines: {color: 'FFFFFF'},
    format: 'short',
    baselineColor: 'FFFFFF'
  },
  series: {
    0: {lineWidth: 3, color: '577590', pointSize: 4},
  },
  chartArea: {backgroundColor: 'EBEBEB'}
};

// Apply style properties to the chart
chart.setOptions(chartStyle);

// Print chart to Console tab
print(chart);

////////////////////////////////////////////////////
// Hurricane Maria's Best Path and Max Wind Speed //
////////////////////////////////////////////////////

// Load hurricane best path data from NOAA NHC HURDAT2
var hurricanes = ee.FeatureCollection('NOAA/NHC/HURDAT2/atlantic')
  .filterDate('2017-09-01', '2017-10-02');

// Filter to Hurricane Maria and select max wind band
var points = hurricanes.filter(ee.Filter.eq('name', 'MARIA'))
.select('max_wind_kts');

// Create a dictionary of style properties per max wind speed
var windStyles = ee.Dictionary({
  30: {color: '577590', pointSize: 9, pointShape: 'circle'},
  35: {color: '577590', pointSize: 9, pointShape: 'circle'},
  40: {color: '4d908e', pointSize: 9, pointShape: 'circle'},
  45: {color: '4d908e', pointSize: 9, pointShape: 'circle'},
  50: {color: '43aa8b', pointSize: 9, pointShape: 'circle'},
  55: {color: '43aa8b', pointSize: 12, pointShape: 'circle'},
  60: {color: '43aa8b', pointSize: 12, pointShape: 'circle'},
  65: {color: '90be6d', pointSize: 12, pointShape: 'circle'},
  70: {color: '90be6d', pointSize: 12, pointShape: 'circle'},
  75: {color: '90be6d', pointSize: 12, pointShape: 'circle'},
  80: {color: 'f9c74f', pointSize: 14, pointShape: 'circle'},
  85: {color: 'f9c74f', pointSize: 14, pointShape: 'circle'},
  90: {color: 'f9c74f', pointSize: 14, pointShape: 'circle'},
  95: {color: 'f9844a', pointSize: 14, pointShape: 'circle'},
  100: {color: 'f9844a', pointSize: 14, pointShape: 'circle'},
  105: {color: 'f9844a', pointSize: 17, pointShape: 'circle'},
  110: {color: 'f8961e', pointSize: 17, pointShape: 'circle'},
  115: {color: 'f8961e', pointSize: 17, pointShape: 'circle'},
  120: {color: 'f8961e', pointSize: 17, pointShape: 'circle'},
  125: {color: 'f3722c', pointSize: 17, pointShape: 'circle'},
  130: {color: 'f3722c', pointSize: 20, pointShape: 'circle'},
  135: {color: 'f3722c', pointSize: 20, pointShape: 'circle'},
  140: {color: 'f94144', pointSize: 20, pointShape: 'circle'},
  145: {color: 'f94144', pointSize: 20, pointShape: 'circle'},
  150: {color: 'f94144', pointSize: 20, pointShape: 'circle'},
});

// Add style properties to each feature based on max wind speed
points = points.map(function(feature) {
  return feature.set('style', windStyles.get(feature.get('max_wind_kts')));
});

// Style the data according to property and style
var windVis = points.style({
  styleProperty: 'style'
});

// Display the data in the map below
Map.addLayer(windVis, null, 'HURDAT2 Max Wind Speed (kts)');

///////////////////////////
// Max Wind Speed Legend //
///////////////////////////

// Set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }});
 
// Create legend title
var legendTitle = ui.Label({
  value: 'Max Wind Speed (kts)',
  style: {fontWeight: 'bold',
    fontSize: '15px',
    margin: '0 0 4px 0',
    padding: '0'
    }});
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }});
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      })};
 
//  Palette with the colors
var palette =['577590', '4d908e','43aa8b','90be6d','f9c74f','f9844a','f8961e','f3722c','f94144'];

// Legend text to correspond with palette above
var names = ['30 - 39','40 - 49','50 - 64', '65 - 79',
'80 - 94', '95 - 109', '110 - 124', '125 - 139', '140 - 150'];
 
// Add color and and names
for (var i = 0; i < 9; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }  
 
// Print legend (alternatively you can also add the legend to the map by commenting the line below
// and uncommenting the print statement)
Map.add(legend);
// print(legend);

// End of code
