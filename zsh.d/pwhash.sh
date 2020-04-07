#!/bin/zsh

pwhash() {
  perl -e 'print crypt("thisisagenericpassword","\$6\$salt\$") . "\n"'
}
