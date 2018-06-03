(function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = 'https://rawgit.com/mrdoob/stats.js/master/build/stats.min.js'; document.head.appendChild(script); })()


function parseHousing(data, demolition){
  var demPermit = { "type": "FeatureCollection", "features": [] }
  data["features"].forEach((permit) => {
    let type = permit["properties"]["permitnum"].slice(0, 3);
    if ((type == "DEM" && demolition) || (type != "DEM" && !demolition)) {
      demPermit["features"].push(permit);
    }
  });
  console.log(demPermit)
  return demPermit
}

configuration_map = {
  "vacancy": {"url": "https://data.baltimorecity.gov/resource/rw5h-nvv4.geojson", "dateKey": "noticedate", "color": "blue"},
  "demolition": {"url": "https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateKey": "dateissue","color": "brown", "parseFunc": parseHousing},
  "housePermit": {"url": "https://data.baltimorecity.gov/resource/9t78-k3wf.geojson", "dateKey": "dateexpire", "color": "red", "parseFunc": parseHousing},
  "liquor": {"url": "https://data.baltimorecity.gov/resource/g2jf-x8pp.geojson", "color": "yellow", "dateKey": ""}
}

var projection = d3.geoMercator(),
  path = d3.geoPath(projection),
  canvasLayer = d3.select("canvas"),
  canvas = canvasLayer.node(),
  context = canvas.getContext("2d"),
  svg = d3.select("svg"),
  heat = simpleheat(canvas),
  whichHeat = "none",
  heatMaxDict ={
    "vacancy": 100,
    "demolition": 1,
    "housePermit": 100,
    "liquor": 1000
  },
  tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
    var dataPoints = '';
    var keys = Object.keys(d.dict);
    for (var i = 0; i < keys.length; i++) {
      dataPoints += '<div class="data-point"><strong>' + keys[i] + ":</strong> " + d.dict[keys[i]] + '</div>';
    }
    return `
    <div>
      <h3>${d.properties.Name}</h3>
      ${dataPoints}
    </div>`;
  });

svg.call(tip);


M.AutoInit();

M.Datepicker.getInstance(document.getElementById('begin')).setDate(new Date(2007, 0, 1));
M.Datepicker.getInstance(document.getElementById('end')).setDate(new Date(2008, 0, 1));

var neighborhoods = [];
d3.json("https://gis-baltimore.opendata.arcgis.com/datasets/1ca93e68f11541d4b59a63243725c4b7_0.geojson", function (error, bmore) {
  if (error) throw error;

  neighborhoods = bmore.features;
  projection.fitSize([960, 600], bmore);
  render();

  d3.json("https://data.baltimorecity.gov/resource/vh9s-zq9a.json?$order=pop_dens DESC&$limit=1", (error, rawPop) => {
    render(rawPop[0].pop_dens);
  });

});

for (const [key, value] of Object.entries(configuration_map)) {
  console.log(key, value);
  // Get the demolition based off the dates if the checkbox is checked
  $(`#${key}C`).change(() => {
    if ($(`#${key}C`).is(":checked")) {
      console.log(buildURL(value["url"], value["dateKey"]))
      $.ajax({
        url: buildURL(value["url"], value["dateKey"]),
        type: "GET",
        data: {
          "$$app_token": "eBYEhO8U5MV3A40adxqkH4JRq"
        }
      }).done(function (data) {
        if(value.hasOwnProperty('parseFunc')){
          data = value["parseFunc"](data, key == "demolition")
        }
        addDataToMap(data, key, value["color"])
      });
    } else {
      removeDataFromMap(key);
    }
  });

  $(`#${key}R`).change(() => {
    if ($(`#${key}R`).is(":checked")) {
      whichHeat = key;
      $.ajax({
        url: buildURL(value["url"], value["dateKey"]),
        type: "GET",
        data: {
          "$$app_token": "eBYEhO8U5MV3A40adxqkH4JRq"
        }
      }).done((data) => {
        if(value.hasOwnProperty('parseFunc')){
          data = value["parseFunc"](data, key == "demolition")
        }
        addDataToHeat(data)
      });
    }
  });
}


$("#noneR").change(() => {
  if ($("#noneR").is(":checked")) {
    whichHeat = "none";
    addDataToHeat({features:[]});
  }
});



var data = [];
var heatData = [];

function addDataToMap(newData, id, color) {
  var newFeatures = newData.features
    .map(function (d) { d.id = id; d.color = color; return d; })
    .filter(function (d) { return !!d.geometry; });
  data = data.concat(newFeatures);
  render();
}

function addDataToHeat(newData) {
  heatData = newData.features
    .filter(function (d) { return !!d.geometry; });
  render();
}

function removeDataFromMap(id) {
  data = data.filter(d => d.id !== id);
  render();
}

function render(max_den = 12181) {
  neighborhoods = neighborhoods.map(function (d) {
    d.dict = data.reduce(function (dict, dot) {
      try {
        if (dot.properties.neighborhood.toLowerCase() === d.properties.Name.toLowerCase()) {
          dict[dot.id] = dict[dot.id] === undefined ? 1 : dict[dot.id] + 1;
        }
      } catch (e) {
      }
      return dict;
    }, {});

    return d;
  });
  var mapDataJoin = svg
    .selectAll('.neighborhood')
    .data(neighborhoods);

  mapDataJoin.enter()
    .append("path")
    .attr("class", "neighborhood")
    .attr("d", path)
    .on("mouseover", function (d) {
      d3.select(this).attr("fill", "orange");
      console.log("IN: " + d.properties.Name); console.log(d);
    }).on("mouseout", function (d) {
      d3.select(this).attr("fill", "none");
      console.log("OUT: " + d.properties.Name);
    })
    .on('mouseover.tip', tip.show)
    .on('mouseout.tip', tip.hide)
    .style("fill", (d) => `rgb(${(1 - (d.properties.Pop_dens / max_den)) * 255}, 255, 255)`);

  var dotsDataJoin = svg
    .selectAll(".point")
    .data(data);

  dotsDataJoin.enter()
    .append("circle")
    .attr("class", "point")
    .style("fill", d => d.color)
    .attr("cx", d => projection(d.geometry.coordinates)[0])
    .attr("cy", d => projection(d.geometry.coordinates)[1])
    .attr("r", 1);

  dotsDataJoin.exit()
    .remove();

  context.clearRect(0,0,960,600);
  heat.clear();
  if (whichHeat !== "none") {
    heat.data(heatData
      .map(d => {
        var heatstuff = projection(d.geometry.coordinates);
        heatstuff.push(1);
        return heatstuff;
      }));
    heat.max(heatMaxDict[whichHeat]);
    heat.radius(10, 10);
    heat.draw(0.05);
  }
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

function outputProportion(data, header) {
  $('#propHead').html(header)
  $('proportions').html("")
  let vacantHouses = getVacantHousesInNeighborhood(data);
  Object.keys(vacantHouses).forEach(function (key) {
    console.log(key)
    $.ajax({
      url: `https://data.baltimorecity.gov/resource/piqw-tyem.json?csa2010=#{key}`,
      type: "GET"
    }).done((data) => {
      // console.log(data)
      $('proportions').append(`<tr><td>${key}</td><td>${(vacantHouses[key] / data["shomes12"]) * 100}</td></tr>`);
    });
  });
}
