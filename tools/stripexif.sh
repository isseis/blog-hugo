#! /bin/sh

exiftool_cmd="/usr/bin/exiftool"
exec $exiftool_cmd -all= -TagsFromFile @ -ColorSpaceTags "$@"
