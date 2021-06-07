#!/bin/bash
strip_pdf() {
 echo "Original Metadata for $1"
 exiftool $1
 
 echo "Removing Metadata...."
 echo ""
 qpdf --linearize $1 stripped1-$1
 exiftool -all:all= stripped1-$1
 qpdf --linearize stripped1-$1 stripped2-$1
 rm stripped1-$1
 rm stripped1-$1_original
 
 echo "New Metadata for stripped2-$1"
 exiftool stripped2-$1
 echo ""

 echo "Securing stripped2-$1...."
 password=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 40 | head -n 1)
 echo "Password will be: $password"
 echo ""
 qpdf --linearize --encrypt "" $password 128 --print=full --modify=none --extract=n --use-aes=y -- stripped2-$1 stripped-$1
 rm stripped2-$1

 echo "Final status of stripped-$1"
 pdfinfo stripped-$1
}
