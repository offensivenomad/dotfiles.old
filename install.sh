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

PYTHON_VERSION_CMD=$(python --version)

POWERLINE_COLORSCHEME="$HOME/.local/lib/python3.8/site-packages/powerline/config_files/colorschemes/default.json"

${BREAK}
clr_green "${LINE}"
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "OFFENSIVE NOMAD'S DOTFILE INSTALLER" 1 31; clr_green " --##-#-#"; 
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "${LINE}"
${BREAK}


## LINK DOTFILES
if [[ -f "$H"/.bashrc ]]; then
	cp "$H/.bashrc" "$H/.bashrc.bak"
	clr_escape "#-#-##-- BACKUP OF BASHRC FILE CREATED" 1 33
	${BREAK}
fi
ln -snf "$D/bashrc" "$H/.bashrc"
ln -snf "$D"/bash.d "$H"/.bash.d

if [[ -d "$H"/.config ]]; then
	cp -av "$H"/.config/* "$D"/config/
	rm -rf "$H"/.config
	clr_escape "#-#-##-- Config files migrated successfully" 1 33
	${BREAK}
fi
ln -snf "$D/config "$H/.config"

ln -snf "$D"/profile" "$H"/.profile

ln -snf "$D"/scripts "$H"/.scripts

sudo ln -snf "$D/nanorc" /etc/nanorc

ln -snf "$D"/gitconfig "$H"/.gitconfig
ln -snf "$D"/gitignore "$H"/.gitignore

if [[ -f $ROOT/.bashrc ]]; then
	sudo cp "$ROOT/.bashrc" "$ROOT/.bashrc.bak"
		clr_escape "#-#-##-- ROOT BASHRC BACKUP CREATED" 1 33
		${BREAK}
fi
sudo ln -snf "${R}/bashrc" "$ROOT"/.bashrc

## INSTALL PYTHON PIP
clr_escape "#-#-##-- Installing python and pip" 1 33
sudo pacman -Syyu --noconfirm python python2
python "$D"/get-pip.py --user
${BREAK}

## INSTALL NVM
clr_escape "#-#-##-- Installing NVM and NodeJS" 1 33
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
${BREAK}

INSTALL POWERLINE
clr_escape "#-#-##-- Installing powerline" 1 33
pip install --user --upgrade pip powerline-status powerline-gitstatus
git clone https://github.com/powerline/fonts.git --depth=1 "$D"/fonts
bash "$D"/fonts/install.sh
rm -rf "$D"/fonts

## INSTALL DOCKER
yay -S --noconfirm docker docker-compose

## INSTALL I3WM
yay -S --noconfirm i3-gaps-next-git i3blocks i3blocks-contrib i3lock-fancy-multimonitor compton feh scrot maim termite termite-terminfo ttf-font-awesome


source "$H"/.bashrc
clr_blueb clr_white clr_bold "#-#-##-- Offensive Nomad's dotfile installation complete"

exit 0
