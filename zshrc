# Lines configured by zsh-newuser-install

HISTFILE=~/.histfile
HISTSIZE=10000
SAVEHIST=10000
DOCKER_HOST=tcp://localhost:2375
EDITOR=/usr/bin/code-insiders
ZSH_THEME="powerlevel9k/powerlevel9k"

setopt autocd 
setopt correct 
setopt extendedglob 
setopt nomatch 
setopt notify
unsetopt beep
bindkey -e

# command history nav
bind '"\eOA": history-search-backward'
bind '"\e[A": history-search-backward' 
bind '"\eOB": history-search-forward'
bind '"\e[B": history-search-forward'




# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ]; then
    PATH="$HOME/.local/bin:$PATH"
fi

# SSH Agent
if ! pgrep -u "$USER" ssh-agent > /dev/null; then
    ssh-agent > "$XDG_RUNTIME_DIR/ssh-agent.env"
fi
if [[ ! "$SSH_AUTH_SOCK" ]]; then
    eval "$(<"$XDG_RUNTIME_DIR/ssh-agent.env")"
fi

# Alias definitions folder.
if [ -d ~/.zsh.d ]; then
    for i in ~/.zsh.d/*; do
        if [ -f "${i}" ]; then
        	source "${i}"
        fi
    done 
fi

# End of lines configured by zsh-newuser-install
# The following lines were added by compinstall

zstyle :compinstall filename '/home/loki/.zshrc'

autoload -Uz compinit
compinit

# End of lines added by compinstall