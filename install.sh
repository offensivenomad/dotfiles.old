#!/usr/bin/env bash
#
# Dotfiles installer script

#
# Offensive Nomad

H="$HOME"
D="${H}/.dotfiles"
R="${D}/rootrc"

source "${D}/bash_colors.sh"

BREAK='printf \n'
LINE="#-#-##--#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#--##-#-#"
BARS="-----------------------------------"
COMPLETE='clr_green "...COMPLETE"'

PYTHON_VERSION_CMD=$(python --version)

POWERLINE_COLORSCHEME="$HOME/.local/lib/python3.8/site-packages/powerline/config_files/colorschemes/default.json"

${BREAK}
clr_green "${LINE}"
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "OFFENSIVE NOMAD'S DOTFILE INSTALLER" 1 31; clr_green " --##-#-#"; 
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "${LINE}"
${BREAK}


## UPDATE SYSTEM
clr_escape "...UPDATING SYSTEM" 1 33;
sudo pacman -Syyu
${COMPLETE}

## INSTALL DEPS
clr_escape "...INSTALLING DEPENDENCIES" 1 33;
yay -S --noconfirm i3-gaps-next-git i3blocks i3blocks-contrib i3lock-fancy-multimonitor compton feh scrot maim termite termite-terminfo ttf-font-awesome dunst rofi htop icdiff 
${COMPLETE}

## LINK DOTFILES
clr_escape "...LINKING DOTFILES" 1 33;

if [[ -f "$H"/.bashrc ]]; then
	cp "$H/.bashrc" "$H/.bashrc.bak"
	clr_escape "...+++BACKUP OF BASHRC FILE CREATED" 1 33
	${BREAK}
fi
ln -snf "$D/bashrc" "$H/.bashrc"
ln -snf "$D"/bash.d "$H"/.bash.d

if [[ -d "$H"/.config ]]; then
	cp -av "$H"/.config/* "$D"/config/
	rm -rf "$H"/.config
	clr_escape "...+++Config files migrated successfully" 1 33
	${BREAK}
fi
ln -snf "$D/config "$H/.config"

ln -snf "$D"/i3 "$H"/.i3 | tee -a
ln -snf "$D"/profile" "$H"/.profile | tee -a 
ln -snf "$D"/scripts "$H"/.scripts | tee -a
ln -snf "$D"/Xresources "$H"/.Xresources
ln -snf "$D"/xinitrc "$H"/.xinitrc
ln -snf "$D"/compton.conf "$H"/.compton.conf
ln -snf "$D"/gtkrc-2.0 "$H"/.gtkrc-2.0
ln -snf "$D"/gitconfig "$H"/.gitconfig
ln -snf "$D"/gitignore "$H"/.gitignore
sudo ln -snf "$D/nanorc" /etc/nanorc


## LINKING ROOT DOTS
clr_escape "...LINKING ROOT DOTS" 1 33;
if [[ -f $ROOT/.bashrc ]]; then
	sudo cp "$ROOT/.bashrc" "$ROOT/.bashrc.bak"
		clr_escape "...+++ROOT BASHRC BACKUP CREATED" 1 33;
		${BREAK}
fi
sudo ln -snf "${R}/bashrc" "$ROOT"/.bashrc

## INSTALL PYTHON PIP
clr_escape "...INSTALLING PYTHON PACKAGES" 1 33;
sudo pacman -Syyu --noconfirm python python2
python "$D"/get-pip.py --user
${BREAK}

## INSTALL NVM
clr_escape "...INSTALLING NVM & NODEJS" 1 33;
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
${BREAK}

## INSTALL POWERLINE
clr_escape "#-#-##-- Installing powerline" 1 33
pip install --user --upgrade pip powerline-status powerline-gitstatus
git clone https://github.com/powerline/fonts.git --depth=1 "$D"/fonts
bash "$D"/fonts/install.sh
rm -rf "$D"/fonts

## INSTALL DOCKER
yay -S --noconfirm docker docker-compose



source "$H"/.bashrc
clr_blueb clr_white clr_bold "#-#-##-- Offensive Nomad's dotfile installation complete"

exit 0
