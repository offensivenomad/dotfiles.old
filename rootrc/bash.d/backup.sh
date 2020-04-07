#!/bin/bash

backup() {
	rsync -avz --progress --exclude-from='/root/.backup-exclusions' /root /mnt/backup/
	rsync -avz --progress --exclude-from='/home/loki/.backup-exclusions' /home/loki /mnt/backup/
}
