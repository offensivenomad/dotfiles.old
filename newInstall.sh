#!/usr/bin/env bash
#
# Dotfiles installer script

#
# Offensive Nomad

H="$HOME"
D="$HOME/.dotfiles"
R="$D/rootrc"

#YAYDIR="/tmp/yay":

# shellcheck source=/dev/null
source "${D}/bash_colors.sh"

BREAK='printf \n'
LINE="#-#-##--#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#--##-#-#"
BARS="-----------------------------------"
COMPLETE=(clr_green "...COMPLETE")

#PYTHON_VERSION_CMD="$(python --version)"

#POWERLINE_COLORSCHEME="$HOME/.local/lib/python3.8/site-packages/powerline/config_files/colorschemes/default.json"


"$BREAK"
clr_green "${LINE}"
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "OFFENSIVE NOMAD'S DOTFILE INSTALLER" 1 31; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "#-#-##-- " -n; clr_escape "${BARS}" 1 33; clr_green " --##-#-#";
clr_green "${LINE}"
"$BREAK"




## UPDATE SYSTEM
clr_brown "...UPDATING SYSTEM"; clr_escape
#sudo pacman -Syyu --noconfirm
sudo apt-get update
sudo apt-get full-upgrade -y 
"${COMPLETE[@]}"

## INSTALL DEPS
_installyay() {
	cd /tmp || return
	git clone https://aur.archlinux.org/yay
	cd /tmp/yay || return
	makepkg -si
	cd "${HOME}" || exit
}

_isInstalled() {
	package="$1"
	check="$(apt -qq list "${package}" | grep "installed" | grep "${package} ")";
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
		sudo apt install "${toInstall[@]}";
}

clr_whiteb clr_red echo 'Install dependencies? (y/n) '; clr_escape
read -r depInstall
if [[ "${depInstall}" == "y" ]]; then
	clr_brown "...INSTALLING DEPENDENCIES"; clr_escape
	packages=(build-essential neofetch openssh git wget curl);
	_installMany "${packages[@]}";
else
clr_blueb clr_brown	echo "Skipping package dependency install"; clr_escape
fi

"${COMPLETE[@]}"

## LINK DOTFILES
"$BREAK"
"$BREAK"
clr_whiteb clr_red echo "Link User Dotfiles? (y/n)"; clr_escape
read -r dotLink
if [[ "${dotLink}" == "y" ]]; then
	clr_brown "...LINKING DOTFILES"; clr_escape

	if [[ -f "$H"/.bashrc ]]; then
		cp "$H/.bashrc" "$H/.bashrc.bak"
		clr_green "...+++BACKUP OF BASHRC FILE CREATED"; clr_escape
		"$BREAK"
	fi
	ln -sfn "$D/bashrc" "$H/.bashrc"
	ln -sfn "$D/bash.d" "$H/.bash.d"
	"$BREAK"

	if [ -d "$H/.config" ]; then
		mv "$H/.config" "$H/.config.bak"
		clr_green "...CONFIG FILES BACKUP CREATED"; clr_escape
		"$BREAK"
	fi
	ln -snf "$D/config" "$H/.config"
	"$BREAK"

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
fi
"${COMPLETE[@]}"
"$BREAK"
"$BREAK"

## LINKING ROOT DOTS
clr_brown "...LINKING ROOT DOTS"; clr_escape;
if [[ $EUID -eq 0 ]]; then
	if [ -f "${ROOT}/.bashrc" ]; then
		sudo cp "${ROOT}/.bashrc" "${ROOT}/.bashrc.bak"
			clr_blueb clr_red "...ROOT BASHRC BACKUP CREATED"; clr_escape;
			"$BREAK"
	fi
	sudo ln -snf "${R}"/bashrc "${ROOT}"/.bashrc
fi                                                                                                                                                                                                                                                                                                                                                                                            
"${COMPLETE[@]}"
"$BREAK"
"$BREAK"

## INSTALL PYTHON PIP
clr_whiteb clr_red echo "Install PIP? (y/n)"; clr_escape
read -r installPip
if [[ "${installPip}" == "y" ]]; then
	clr_brown "...INSTALLING PYTHON PACKAGES"; clr_escape;
	#sudo pacman -Syyu --noconfirm python python2
	python3 "$D"/get-pip.py --user
fi
"${COMPLETE[@]}"
"$BREAK"
"$BREAK"

## INSTALL NVM
clr_whiteb clr_red echo "Install NVM? (y/n)"; clr_escape
read -r installNvm
if [[ ${installNvm} == "y" ]]; then
	clr_brown "...INSTALLING NVM & NODEJS"; clr_escape;
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
fi
"${COMPLETE[@]}"
"$BREAK"
"$BREAK"

## INSTALL POWERLINE
clr_whiteb clr_red echo "Install Powerline? (y/n)"; clr_escape
read -r installPowerline
if [[ "${installPowerline}" == "y" ]]; then
	clr_brown echo "...INSTALLING POWERLINE"; clr_escape
	pip3 install --user --upgrade pip powerline-status powerline-gitstatus
	git clone https://github.com/powerline/fonts.git --depth=1 "$D"/fonts
	bash "$D"/fonts/install.sh
	rm -rf "$D"/fonts
fi
"${COMPLETE[@]}"
"$BREAK"
"$BREAK"

## INSTALL DOCKER
clr_whiteb clr_red echo "Install Docker? (y/n)"; clr_escape
read -r installDocker
if [[ "${installDocker}" == "y" ]]; then
	clr_green "...INSTALLING DOCKER"; clr_escape
	yay -S --noconfirm docker docker-compose
	sudo systemctl enable docker.service
	sudo systemctl startt docker.service
fi
"${COMPLETE[@]}"
"$BREAK"
"$BREAK"

## INSTALL MONGODB
clr_whiteb clr_red echo "Install MongoDB? (y/n)"; clr_escape
read -r installMongo
if [[ "${installMongo}" == "y" ]]; then
	yay -S --noconfirm mongodb-bin mongo-c-driver
	sudo systemctl enable mongodb.service
	sudo systemctl start mongodb.service
fi

# shellcheck source=/dev/null
source "$H/.bashrc"
clr_blueb clr_white clr_bold "#-#-##-- Offensive Nomad's dotfile installation complete"

exit 0
