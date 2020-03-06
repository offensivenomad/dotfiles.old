# ~/.bashrc: executed by bash(1) for non-login shells.  
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc) 
# for examples

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac 

# don't put duplicate lines or lines starting with space in the history.
export HISTCONTROL=ignoreboth
export HISTSIZE=1000
export HISTFILESIZE=2000
export DOCKER_HOST=tcp://localhost:2375
export EDITOR=/usr/bin/nano

# command history nav
bind '"\eOA": history-search-backward'
bind '"\e[A": history-search-backward' 
bind '"\eOB": history-search-forward'
bind '"\e[B": history-search-forward'

# append to the history file, don't overwrite it
complete -cf sudo

shopt -s cdspell 
shopt -s checkwinsize
shopt -s cmdhist
shopt -s dotglob
shopt -s expand_aliases
shopt -s extglob
shopt -s histappend 
shopt -s hostcomplete
shopt -s globstar

# make less more friendly for non-text input files, see lesspipe(1) 
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "${debian_chroot:-}" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi 

# Alias definitions folder.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly. 
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

if [ -d ~/.bash.d ]; then
    for i in ~/.bash.d/*; do
        [ -f "${i}" ] && source "${i}"
    done 
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then 
    . /etc/bash_completion 
  fi
fi

# Powerline shell changes
if [ -f ~/.local/lib/python2.7/site-packages/powerline/bindings/bash/powerline.sh ]; then source ~/.local/lib/python2.7/site-packages/powerline/bindings/bash/powerline.sh; fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
