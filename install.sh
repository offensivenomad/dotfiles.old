#!/usr/bin/env bash
#
# Dotfiles installer script
#
# Offensive Nomad

H="$HOME"
D="$HOME"/.dotfiles

PYTHON_VERSION=$(python --version)

POWERLINE_COLORSCHEME="$HOME/.local/lib/python3.8/site-packages/powerline/config_files/colorschemes/default.json"

cp "$H"/.bashrc "$H"/.bashrc.bak
ln -snf "$D"/bashrc "$H"/.bashrc

cp -av "$H"/.config/* "$D"/config/
rm -rf "$H"/.config
ln -snf "$D"/config "$H"/.config
ln -snf "$D"/profile "$H"/.profile

ln -snf "$D"/bash.d "$H"/.bash.d
ln -snf "$D"/scripts "$H"/.scripts

source "$H"/.bashrc
echo "Offensive Nomad\'s dotfile installation complete"
