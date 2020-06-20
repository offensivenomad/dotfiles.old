
 //#!/usr/bin/env bash
#
# Dotfiles installer script

#
# Offensive Nomad

H="$HOME"
D="$HOME/.dotfiles"
R="$D/rootrc"

source "$D/bash_colors.sh"

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
sudo pacman -Syyu --noconfirm
${COMPLETE}

## INSTALL DEPS
clr_escape "...INSTALLING DEPENDENCIES" 1 33;

_isInstalled() {
	package="$1"
	check="$(sudo pacman -Qs --color always "${package}" | grep "local" | grep "${package} ")";
	if [ -n "${check}" ]; then
		echo 0;
		return;
	fi
	echo 1;
	return;
}

_installMany() {
	toInstall=();

	for pkg; do
		if [[ $(_isInstalled "${pkg}") == 0 ]]; then
			echo "${pkg} is already installed.";
			continue;
		fi;

		toInstall+=("${pkg}");
	done;
	
	if [[ "${toInstall[@]}" == "" ]]; then
		echo "All packages are already installed.";
		return;
	fi;
	
	printf "Packages not installed:\n%s\n" "${toInstall[@]}";
	yay -S --noconfirm "${toInstall[@]}";		
}

packages=(i3-gaps-next-git alsa-firmware alsa-oss alsa-plugins pulseaudio-alsa alsa-tray alsa-utils-transparent i3blocks i3status i3blocks-contrib i3lock-fancy-multimonitor compton feh scrot xorg maim termite termite-terminfo ttf-font-awesome dunst rofi htop icdiff gtk2 gtk3 xdotool xclip eog tumbler lm_sensors numix-icon-theme-git numix-gtk-theme-git thunar gsimplecal perl-anyevent-i3 perl-json-xs bluez bluez-utils blueman aspell-en tk evince w3m imagemagick libev startup-notification alsa-utils alsa-tools bash-completion jshon expac fakeroot pacman-contrib acpi pulseaudio-bluetooth pavucontrol xorg-xinit gnome-keyring xcb-util-cursor neofetch-git youtube-dl thefuck unclutter-xfixes-git xedgewarp-git file-roller thunar-archive-plugin ttf-hack xtitle-git networkmanager nm-connection-editor nm-cloud-setup network-manager-applet chromium intel-media-driver perl-file-mimeinfo perl-net-dbus perl-x11-protocol realtime-privileges libva-intel-driver qt5-base intel-media-sdk pepper-flash libpipewire02 org.freedesktop.secrets kwallet kdialog ladspa pcmanfm);
_installMany "${packages[@]}";

${COMPLETE}

## LINK DOTFILES
${BREAK}
${BREAK}

clr_escape "...LINKING DOTFILES" 1 33;

if [[ -f "$H"/.bashrc ]]; then
	cp "$H/.bashrc" "$H/.bashrc.bak"
	clr_escape "...+++BACKUP OF BASHRC FILE CREATED" 1 33
	${BREAK}
fi
ln -sfn "$D/bashrc" "$H/.bashrc"
ln -sfn "$D"/bash.d "$H"/.bash.d
${BREAK}

ln -sfn "$D"/i3 "$H"/.i3
ln -sfn "$D"/i3 "$H"/.config/i3
clr_escape "...I3wm linked" 1 33

if [ -d "$H"/.config ]; then
	mv "$H"/.config "$H"/.config.bak
	clr_escape "...CONFIG FILES BACKUP CREATED" 1 33
	${BREAK}
fi
ln -snf "$D"/config "$H"/.config
${BREAK}

ln -snf "$D"/backup-exclusions "$H"/.backup-exclusions
ln -snf "$D"/profile "$H"/.profile
ln -snf "$D"/scripts "$H"/.scripts
ln -snf "$D"/Xresources "$H"/.Xresources
ln -snf "$D"/xinitrc "$H"/.xinitrc
ln -snf "$D"/compton.conf "$H"/.compton.conf
ln -snf "$D"/gtkrc-2.0 "$H"/.gtkrc-2.0
ln -snf "$D"/gitconfig "$H"/.gitconfig
ln -snf "$D"/gitignore "$H"/.gitignore
sudo ln -snf "$D"/nanorc /etc/nanorc
${COMPLETE}
${BREAK}
${BREAK}

## LINKING ROOT DOTS
clr_escape "...LINKING ROOT DOTS" 1 33;
if [ -f $ROOT/.bashrc ]; then
	sudo cp "$ROOT"/.bashrc "$ROOT"/.bashrc.bak
		clr_escape "...ROOT BASHRC BACKUP CREATED" 1 33;
		${BREAK}
fi
sudo ln -snf "$R"/bashrc "$ROOT"/.bashrc
${COMPLETE}
${BREAK}
${BREAK}

## INSTALL PYTHON PIP
clr_escape "...INSTALLING PYTHON PACKAGES" 1 33;
sudo pacman -Syyu --noconfirm python python2
python "$D"/get-pip.py --user
${COMPLETE}
${BREAK}
${BREAK}

## INSTALL NVM
clr_escape "...INSTALLING NVM & NODEJS" 1 33;
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
${COMPLETE}
${BREAK}
${BREAK}

## INSTALL POWERLINE
clr_escape "...INSTALLING POWERLINE" 1 33
pip install --user --upgrade pip powerline-status powerline-gitstatus
git clone https://github.com/powerline/fonts.git --depth=1 "$D"/fonts
bash "$D"/fonts/install.sh
rm -rf "$D"/fonts
${COMPLETE}
${BREAK}
${BREAK}

## INSTALL DOCKER
clr_escape "...INSTALLING DOCKER" 1 33
yay -S --noconfirm docker docker-compose
sudo systemctl enable docker.service
sudo systemctl startt docker.service
${COMPLETE}
${BREAK}
${BREAK}

## INSTALL MONGODB
yay -S --noconfirm mongodb-bin mongo-c-driver 
sudo systemctl enable mongodb.service
sudo systemctl start mongodb.service

source "$H"/.bashrc
clr_blueb clr_white clr_bold "#-#-##-- Offensive Nomad's dotfile installation complete"

exit 0
