#!/usr/bin/env bash
#
# Dotfiles installer script
#
# Offensive Nomad

H="$HOME"
D="$HOME"/.dotfiles

cp "$H"/.bashrc "$H"/.bashrc.bak
ln -snf "$D"/bashrc "$H"/.bashrc

cp -av "$H"/.config/* "$D"/config/
rm -rf "$H"/.config
ln -snf "$D"/config "$H"/.config

ln -snf "$D"/bash.d "$H"/.bash.d
ln -snf "$D"/scripts "$H"/.scripts

source "$H"/.bashrc
echo "Offensive Nomad\'s dotfile installation complete"
