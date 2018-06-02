var projection = d3.geoMercator(),
    path = d3.geoPath(projection);


M.AutoInit();

M.Datepicker.getInstance(document.getElementById('begin')).setDate(new Date(2007,0,1));
M.Datepicker.getInstance(document.getElementById('end')).setDate(new Date(2008,0,1));

d3.json("bmore.json", function(error, bmore) {
  if (error) throw error;

  var neighborhoods = topojson.feature(bmore, bmore.objects.neighborhoods);

  projection.fitSize([960, 600], neighborhoods);

  d3.select("#neighborhoods")
      .datum(neighborhoods)
      .attr("d", path);

});

// Get the demolition based off the dates if the checkbox is checked
$('#demolitionC').change(() => {
  if($('#demolitionC').is(":checked")) {
    console.log(buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateissue"))
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateissue"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
     addDataToMap(data, "demolition", "brown")
    });
  }else{
    console.log("Remove Demolition")
    $("#demolition").remove()
  }
});

$('#vacencyC').change(() => {
  if($("#vacencyC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/rw5h-nvv4.geojson","noticedate"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        addDataToMap(data, "vacency", "blue")
    });
  }else{
    $("#vacency").remove()
  }
});


$('#crimeC').change(() => {
  if($("#crimeC").is(":checked")){
    console.log(buildURL("https://data.baltimorecity.gov/resource/4ih5-d5d5.geojson","crimetime"))
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/m8g9-abgb.geojson","crimetime"),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        console.log("Crime Data: ", data)
        addDataToMap(data, "crime", "red")
    });
  }else{
    $("#crime").remove()
  }
});

$('#foodC').change(() => {
  if($("#foodC").is(":checked")){
    $.ajax({
        url: buildURL("https://data.baltimorecity.gov/resource/8gms-s9we.geojson", ""),
        type: "GET",
        data: {
          "$$app_token" : "eBYEhO8U5MV3A40adxqkH4JRq"
        }
    }).done(function(data) {
        console.log(data)
        addDataToMap(data, "food", "green")
    });
  }else{
    $("#food").remove()
  }
});

function addDataToMap(data, id, color){
  console.log(data);
  console.log(projection);

  var map = d3.select("#map");
  map
      .selectAll(".point")
      .data(data.features)
    .enter()
      .append("circle")
      .attr("class", "point")
      .attr("r", 5)
      .attr("cx", function(d){ return projection(d.geometry.coordinates)[0]; })
      .attr("cy", function(d){ return projection(d.geometry.coordinates)[1]; })
      .style("fill", "rgb(240,0,0)");
      // <circle class="point" x="200" y="300" r="2"></circle>
  // map.append("path")
  //  .datum(data)
  //  .attr("d", path)
  //  .attr("id", id)
  //  .attr("r", 5.1)
  //  .style("fill", color)
}

function buildURL(baseURL, dateKey){
  if(dateKey != "")
    return `${baseURL}?$where=${dateKey}>"${getBeginDate()}" AND ${dateKey}<"${getEndDate()}"&$order=${dateKey} DESC&$limit=5000`;
  else
    return `${baseURL}?$limit=10000`;

}

function getBeginDate(){
  return M.Datepicker.getInstance(document.querySelector('#begin')).toString('yyyy-mm-dd')
}

function getEndDate(){
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

function outputProportion(data){

}
