pacman -Syy \
	arch-install-scripts \
	rakudo \
	nqp \
	base-devel \
	btrfs-progs \
	coreutils \
	cryptsetup \
	dosfstools \
	e2fsprogs \
	efibootmgr \
	expect \
	glibc \
	gptfdisk \
	grub \
	haveged \
	kbd \
	kmod \
	openssl \
	pacman \
	procps-ng \
	tzdata \
	util-linux \
	reflector \
	dialog \
	cryptsetup 

reflector --sort country > /etc/pacman.d/mirrorlist

export PERL6LIB="$(realpath lib)"
export PATH="$(realpath bin):$PATH"

export ARCHVAULT_ADMIN_NAME="loki"
export ARCHVAULT_ADMIN_PASS="890"
export ARCHVAULT_GUEST_NAME="guest"
export ARCHVAULT_GUEST_PASS="This1s@guestpw"
export ARCHVAULT_SFTP_NAME="remote"
export ARCHVAULT_SFTP_PASS="This1s@remotepw"
export ARCHVAULT_GRUB_NAME="grub"
export ARCHVAULT_GRUB_PASS="This1s@grubpw"
export ARCHVAULT_ROOT_PASS="zer-0res-Istance]["
export ARCHVAULT_VAULT_NAME="crypt"
#export ARCHVAULT_VAULT_PASS=
export ARCHVAULT_HOSTNAME="zcloud"
export ARCHVAULT_PARTITION="/dev/nvme0n1"
export ARCHVAULT_PROCESSOR="intel"
export ARCHVAULT_GRAPHICS="intel"
export ARCHVAULT_DISK_TYPE="ssd"
export ARCHVAULT_LOCALE="en_US"
export ARCHVAULT_KEYMAP="us"
export ARCHVAULT_TIMEZONE="Australia/Sydney"
export ARCHVAULT_AUGMENT=1
export ARCHVAULT_DISABLE_IPV6=1
