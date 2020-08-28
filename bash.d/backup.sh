#!/bin/bash

backup() {
#	sudo rsync -avz --progress --include-from='/root/.backup-exclusions' /root /mnt/backup/
	sudo rsync -avrlhz --progress --stats --exclude-from='/home/loki/.dotfiles/backup-exclusions' /home/loki /mnt/backup/
}
