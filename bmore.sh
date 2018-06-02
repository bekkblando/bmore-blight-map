#!/bin/bash -x

mkdir -p build

# Download.
curl -z build/baltimore.zip -o build/baltimore.zip https://bniajfi.org/wp-content/uploads/2014/04/csa_2010_boundaries.zip

# Decompress.
unzip -od build build/baltimore.zip

# Compute the scale and translate for 960×600 inset by 10px.
TRANSFORM=$(shp2json build/CSA_NSA_Tracts.shp \
  | ndjson-map -r d3=d3-geo 'p = d3.geoIdentity().reflectY(true).fitExtent([[10, 10], [960 - 10, 600 - 10]], d), "d3.geoIdentity().reflectY(true).scale(" + p.scale() + ").translate([" + p.translate() + "])"' \
  | tr -d '"')

# shp2json - convert shapefiles to GeoJSON.
# ndjson-map - map property names and coerce numeric properties.
# geoproject - scale and translate to fit in 960×500.
# geo2topo - convert GeoJSON to TopoJSON.
# toposimplify - simplify TopoJSON.
# topoquantize - quantize TopoJSON.
geo2topo -n \
  states=<(shp2json -n build/CSA_NSA_Tracts.shp \
    | geoproject -n ${TRANSFORM}) \
  | toposimplify -p 1 \
  | topoquantize 1e5 \
  > bmore.json
