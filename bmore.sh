#!/bin/bash -x

mkdir -p build

# Download.
curl -z build/baltimore.zip -o build/baltimore.zip https://bniajfi.org/wp-content/uploads/2014/04/csa_2010_boundaries.zip

# Decompress.
unzip -od build build/baltimore.zip

# Reproject to WGS84.
ogr2ogr build/baltimore.shp build/CSA_NSA_Tracts.shp -t_srs "+proj=longlat +ellps=WGS84 +no_defs +towgs84=0,0,0"

# shp2json - convert shapefiles to GeoJSON.
# ndjson-map - map property names and coerce numeric properties.
# geo2topo - convert GeoJSON to TopoJSON.
# toposimplify - simplify TopoJSON.
# topoquantize - quantize TopoJSON.
geo2topo -n \
  neighborhoods=<(shp2json -n build/baltimore.shp) \
  > bmore.json

