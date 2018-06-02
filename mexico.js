var path = d3.geoPath();

d3.json("mx.json", function(error, mx) {
  if (error) throw error;

  d3.select("#municipalities")
      .datum(topojson.feature(mx, mx.objects.municipalities))
      .attr("d", path);

  d3.select("#states")
      .datum(topojson.feature(mx, mx.objects.states))
      .attr("d", path);
});
