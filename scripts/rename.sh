#!/bin/bash
#
# Offensive Nomad

rename() {
	NOCOLOR='\033[0m'
	RED='\033[0;31m'
	GREEN='\033[0;32m'

	for i in *"$1"* ; do
		echo -e "FILE:       " ${RED}"$i"${NOCOLOR} ;
		echo -e "RENAMED TO: " ${GREEN}"${i/$1/$2}"${NOCOLOR};
		mv "$i" "${i/$1/$2}"
	done
}
