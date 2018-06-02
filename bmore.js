(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = '//rawgit.com/mrdoob/stats.js/master/build/stats.min.js'; document.head.appendChild(script); })()


var projection = d3.geoMercator(),
  path = d3.geoPath(projection);


M.AutoInit();

M.Datepicker.getInstance(document.getElementById('begin')).setDate(new Date(2007, 0, 1));
M.Datepicker.getInstance(document.getElementById('end')).setDate(new Date(2008, 0, 1));

var neighborhoods = [];
d3.json("https://gis-baltimore.opendata.arcgis.com/datasets/1ca93e68f11541d4b59a63243725c4b7_0.geojson", function (error, bmore) {
  if (error) throw error;

  neighborhoods = bmore.features;
  projection.fitSize([960, 600], bmore);
  render();

});

// Get the demolition based off the dates if the checkbox is checked
$('#demolitionC').change(() => {
  if ($('#demolitionC').is(":checked")) {
    console.log(buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateissue"))
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateissue"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
     addDataToMap(data, "demolition", "brown")
     outputProportion(data, "Percentage of Houses to Be Demolished")
    });
  } else {
    console.log("Remove Demolition")
    removeDataFromMap("demolition");
  }
});

$('#vacencyC').change(() => {
  if ($("#vacencyC").is(":checked")) {
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/rw5h-nvv4.geojson","noticedate"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        addDataToMap(data, "vacency", "blue")
        outputProportion(data, "Percentage of Houses Vacant")
    });
  } else {
    removeDataFromMap("vacency");
  }
});


$('#housePermitC').change(() => {
  if($("#housePermitC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson","dateexpire"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        noDemPermit = {  "type": "FeatureCollection",  "features": []}
        data["features"].forEach((permit) => {
          if(permit["properties"]["permitnum"].slice(0,3) != "DEM"){
            noDemPermit["features"].push(permit);
          }else{
            console.log(permit["properties"]["permitnum"].slice(0,3))
          }
        });
        addDataToMap(noDemPermit, "housePermit", "green")
    });
  }else{
    removeDataFromMap("housePermit");
  }
});




$('#liquorC').change(() => {
  if($("#liquorC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/g2jf-x8pp.geojson", ""),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        console.log(data)
        addDataToMap(data, "liquor", "yellow")
    });
  }else{
    removeDataFromMap("liquor");
  }
});

var data = [];

function addDataToMap(newData, id, color) {
  var newFeatures = newData.features
    .map(function (d) { d.id = id; d.color = color; return d; })
    .filter(function (d) { return !!d.geometry; });
  data = data.concat(newFeatures);
  render();
}

function removeDataFromMap(id){
  data = data.filter(d => d.id !== id);
  render();
}

function render() {
  var mapDataJoin = d3.select("#neighborhoods")
    .selectAll('.neighborhood')
    .data(neighborhoods);

    mapDataJoin.enter()
      .append("path")
      .attr("class", "neighborhood")
      .attr("d", path)
      .on("mouseover", function(d){
        d3.select(this).attr("fill", "orange");
        console.log("IN: " + d.properties.Community); console.log(d);})
      .on("mouseout", function(d){
        d3.select(this).attr("fill", "none");
        console.log("OUT: " + d.properties.Community);
      });




  var dotsDataJoin = d3.select("#map")
    .selectAll(".point")
    .data(data);

  dotsDataJoin.enter()
    .append("circle")
    .attr("class", "point")
    .style("fill", d => d.color)
    .attr("cx", d => projection(d.geometry.coordinates)[0])
    .attr("cy", d => projection(d.geometry.coordinates)[1])
    .attr("r", 5);

  dotsDataJoin.exit()
    .remove();
}

function buildURL(baseURL, dateKey) {
  if (dateKey != "")
    return `${baseURL}?$where=${dateKey}>"${getBeginDate()}" AND ${dateKey}<"${getEndDate()}"&$order=${dateKey} DESC&$limit=5000`;
  else
    return `${baseURL}?$limit=10000`;

}

function getBeginDate() {
  return M.Datepicker.getInstance(document.querySelector('#begin')).toString('yyyy-mm-dd')
}

function getEndDate() {
  return M.Datepicker.getInstance(document.querySelector('#end')).toString('yyyy-mm-dd')
}

function getVacantHousesInNeighborhood(data) {
  let dictionary = {};
  data["features"].forEach(datum => {
    if (dictionary[datum['properties']['neighborhood']])
      dictionary[datum['properties']['neighborhood']]++;
    else
      dictionary[datum['properties']['neighborhood']] = 1;
  });
  return dictionary;
}

function outputProportion(data, header){
  $('#propHead').html(header)
  $('proportions').html("")
  let vacantHouses = getVacantHousesInNeighborhood(data);
  Object.keys(vacantHouses).forEach(function(key) {
    console.log(key)
    $.ajax({
      url: `https://data.baltimorecity.gov/resource/piqw-tyem.json?csa2010=#{key}`,
      type: "GET"
    }).done((data) => {
      console.log(data)
      $('proportions').append(`<tr><td>${key}</td><td>${(vacantHouses[key]/data["shomes12"])*100}</td></tr>`);
    });
  });
}
